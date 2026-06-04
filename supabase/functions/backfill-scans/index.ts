// backfill-scans: resumable, idempotent, batched backfill of historical scans.
// Stages per scan: metrics_done -> recs_done -> rollup_done -> completed.
// Citations are assumed already present in the citations table; we skip
// re-extraction to avoid re-spending LLM tokens on historical data.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const MAX_ATTEMPTS = 5;

interface Body {
  batch_size?: number;
  max_runtime_seconds?: number;
  only_failed?: boolean;
  scan_ids?: string[];
  reset?: boolean; // requeue: set status back to pending for the given scan_ids
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.ok) return json({ error: adminCheck.error }, 401);

    const body: Body = await req.json().catch(() => ({} as Body));
    const batchSize = Math.min(Math.max(body.batch_size ?? 25, 1), 100);
    const maxRuntimeMs = Math.min(Math.max(body.max_runtime_seconds ?? 50, 5), 120) * 1000;
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    if (body.reset && body.scan_ids?.length) {
      await sb.from('backfill_jobs')
        .update({ status: 'pending', error: null, attempts: 0 })
        .in('scan_id', body.scan_ids);
      return json({ ok: true, reset: body.scan_ids.length });
    }

    // Claim a batch
    let claimQuery = sb.from('backfill_jobs').select('scan_id, status, attempts');
    if (body.scan_ids?.length) {
      claimQuery = claimQuery.in('scan_id', body.scan_ids);
    } else if (body.only_failed) {
      claimQuery = claimQuery.eq('status', 'failed').lt('attempts', MAX_ATTEMPTS);
    } else {
      claimQuery = claimQuery.in('status', ['pending', 'failed']).lt('attempts', MAX_ATTEMPTS);
    }
    const { data: batch } = await claimQuery.order('updated_at', { ascending: true }).limit(batchSize);
    if (!batch || batch.length === 0) {
      const remaining = await countRemaining(sb);
      return json({ ok: true, processed: 0, succeeded: 0, failed: 0, remaining });
    }

    const scanIds = batch.map(b => b.scan_id);
    await sb.from('backfill_jobs')
      .update({ status: 'in_progress', last_attempt_at: new Date().toISOString() })
      .in('scan_id', scanIds);

    const started = Date.now();
    let succeeded = 0, failed = 0, processed = 0;

    for (const job of batch) {
      if (Date.now() - started > maxRuntimeMs) break;
      processed += 1;
      try {
        const rows = await processScan(sb, job.scan_id);
        await sb.from('backfill_jobs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          processed_rows: rows,
          error: null,
          attempts: (job.attempts ?? 0) + 1,
        }).eq('scan_id', job.scan_id);
        succeeded += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`backfill scan ${job.scan_id} failed:`, msg);
        await sb.from('backfill_jobs').update({
          status: 'failed',
          error: msg.slice(0, 1000),
          attempts: (job.attempts ?? 0) + 1,
          last_attempt_at: new Date().toISOString(),
        }).eq('scan_id', job.scan_id);
        failed += 1;
      }
    }

    // Anything we claimed but didn't get to: revert to pending
    const handledIds = batch.slice(0, processed).map(b => b.scan_id);
    const unhandledIds = scanIds.filter(id => !handledIds.includes(id));
    if (unhandledIds.length > 0) {
      await sb.from('backfill_jobs')
        .update({ status: 'pending' })
        .in('scan_id', unhandledIds);
    }

    const remaining = await countRemaining(sb);
    await sb.from('backfill_jobs')
      .update({ estimated_remaining_rows: remaining })
      .in('scan_id', scanIds);

    return json({ ok: true, processed, succeeded, failed, remaining });
  } catch (e) {
    console.error('backfill-scans error', e);
    return json({ error: e instanceof Error ? e.message : 'unknown' }, 500);
  }
});

async function processScan(sb: any, scanId: string): Promise<number> {
  // Stage 1: compute-metrics (idempotent — upserts on scan_id)
  await invokeFn('compute-metrics', { scanId });
  await sb.from('backfill_jobs').update({ status: 'metrics_done' }).eq('scan_id', scanId);

  // Stage 2: generate-recommendations (idempotent — engine deletes its own rows)
  await invokeFn('generate-recommendations', { scan_id: scanId });
  await sb.from('backfill_jobs').update({ status: 'recs_done' }).eq('scan_id', scanId);

  // Stage 3: rollup-intelligence with force=true so it correctly subtracts
  // any prior contribution before re-applying. Safe to re-run.
  const rollup = await invokeFn('rollup-intelligence', { scanId, force: true });
  await sb.from('backfill_jobs').update({ status: 'rollup_done' }).eq('scan_id', scanId);

  return (rollup?.grains ?? 0) + (rollup?.contributions ?? 0);
}

async function invokeFn(name: string, body: unknown): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name} failed: ${res.status} ${text.slice(0, 300)}`);
  try { return JSON.parse(text); } catch { return null; }
}

async function countRemaining(sb: any): Promise<number> {
  const { count } = await sb
    .from('backfill_jobs')
    .select('scan_id', { count: 'exact', head: true })
    .in('status', ['pending', 'in_progress', 'failed']);
  return count ?? 0;
}

async function requireAdmin(req: Request): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return { ok: false, error: 'unauthorized' };
  const token = auth.replace('Bearer ', '');
  // Allow service-role direct calls (cron)
  if (token === SERVICE_KEY) return { ok: true };
  const sb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return { ok: false, error: 'unauthorized' };
  if (data.user.email?.toLowerCase() !== ADMIN_EMAIL) return { ok: false, error: 'forbidden' };
  return { ok: true };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
