import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.25.76';

const BodySchema = z.object({ dry_run: z.boolean().optional() }).strict();
const SITE_URL = 'https://aimentionyou.com';
const SCHEDULER_TOKEN = '-nUyS-BGRH3Pei7Rta_jIriicKA5Nh29iTV-1SpoJrY';

type Activity = { user_id: string; event_type: string; event_metadata: Record<string, unknown> | null; created_at: string };
type Journey = { key: string; contextKey: string; subject: string; heading: string; detail: string; action: string; path: string; metadata: Record<string, unknown> };

function escapeHtml(value: unknown): string {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

async function hmacToken(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function renderEmail(journey: Journey, email: string, token: string): string {
  const unsubscribe = `${SITE_URL}/functions/v1/resend-unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(journey.subject)}</title></head><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111;border:1px solid #262626;border-radius:8px;overflow:hidden;"><tr><td style="padding:26px 30px;border-bottom:1px solid #262626;color:#facc15;font-weight:800;">AI MENTION YOU</td></tr><tr><td style="padding:30px;color:#e5e5e5;font-size:15px;line-height:1.65;"><h1 style="font-size:22px;line-height:1.35;color:#fff;margin:0 0 16px;">${escapeHtml(journey.heading)}</h1><p style="margin:0 0 18px;">${escapeHtml(journey.detail)}</p><p style="margin:0 0 24px;color:#a3a3a3;">There is one useful next step—nothing else to set up first.</p><a href="${SITE_URL}${journey.path}" style="display:inline-block;background:#facc15;color:#09090b;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:6px;">${escapeHtml(journey.action)} →</a></td></tr><tr><td style="padding:18px 30px;border-top:1px solid #262626;color:#737373;font-size:11px;line-height:1.5;">You received this because you started this work in AI Mention You. <a href="${unsubscribe}" style="color:#a3a3a3;">Unsubscribe</a></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!url || !serviceKey || !resendKey) return new Response(JSON.stringify({ error: 'Email settings are missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const cronSecret = req.headers.get('x-cron-secret') ?? '';
  if (bearer !== serviceKey && cronSecret !== SCHEDULER_TOKEN) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  let input: unknown = {};
  try { const raw = await req.text(); input = raw ? JSON.parse(raw) : {}; } catch { return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
  const parsed = BodySchema.safeParse(input);
  if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const dryRun = parsed.data.dry_run ?? false;
  const admin = createClient(url, serviceKey);
  const now = Date.now();
  const inactivityCutoff = new Date(now - 30 * 60_000).toISOString();
  const lookback = new Date(now - 48 * 60 * 60_000).toISOString();
  const { data: rows, error } = await admin.from('user_activity').select('user_id,event_type,event_metadata,created_at').not('user_id', 'is', null).gte('created_at', lookback).order('created_at', { ascending: false }).limit(2000);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const byUser = new Map<string, Activity[]>();
  for (const row of (rows ?? []) as Activity[]) byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row]);
  const summary = { considered: byUser.size, eligible: 0, queued: 0, skipped: 0, dry_run: dryRun, journey_counts: {} as Record<string, number> };

  for (const [userId, activities] of byUser) {
    if (!activities[0] || activities[0].created_at > inactivityCutoff) { summary.skipped++; continue; }
    const [{ data: profile }, { data: scans }, { data: recommendations }, { data: sent }] = await Promise.all([
      admin.from('profiles').select('email,marketing_unsubscribed_at').eq('id', userId).maybeSingle(),
      admin.from('scans').select('id,project_domain,score').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
      admin.from('recommendations').select('id,title,status,scan_id').eq('user_id', userId).neq('status', 'dismissed').order('priority_score', { ascending: false, nullsFirst: false }).limit(10),
      admin.from('lifecycle_email_events').select('created_at').eq('user_id', userId).gte('created_at', new Date(now - 30 * 86_400_000).toISOString()).order('created_at', { ascending: false }),
    ]);
    if (!profile?.email || profile.marketing_unsubscribed_at) { summary.skipped++; continue; }
    const email = profile.email.trim().toLowerCase();
    const { data: suppressed } = await admin.from('suppressed_emails').select('id').eq('email', email).maybeSingle();
    if (suppressed || (sent?.length ?? 0) >= 3 || (sent?.[0]?.created_at && new Date(sent[0].created_at).getTime() > now - 48 * 60 * 60_000)) { summary.skipped++; continue; }

    const scan = scans?.[0];
    const open = (recommendations ?? []).filter((rec) => rec.status !== 'completed');
    const started = open.find((rec) => rec.status === 'in_progress');
    const viewedRecommendations = activities.some((event) => event.event_type === 'recommendation_started' || (event.event_type === 'dashboard_section_viewed' && event.event_metadata?.section === 'recommendations'));
    const optimizationStarted = activities.find((event) => event.event_type === 'optimization_plan_requested');
    const optimizationFinished = activities.find((event) => event.event_type === 'optimization_plan_generated');
    let journey: Journey;
    if (optimizationStarted && (!optimizationFinished || optimizationFinished.created_at < optimizationStarted.created_at)) journey = { key: 'optimization_unfinished', contextKey: String(optimizationStarted.event_metadata?.scan_id ?? optimizationStarted.created_at), subject: 'Finish your improvement plan', heading: 'You started building your plan but did not finish it', detail: 'Your scan evidence is still available. Return to the improvement hub to generate the practical steps for your brand.', action: 'Finish my plan', path: '/dashboard?tab=recommendations', metadata: optimizationStarted.event_metadata ?? {} };
    else if (started) journey = { key: 'recommendation_started', contextKey: started.id, subject: `Continue: ${started.title}`, heading: 'You already chose what to improve', detail: `You started “${started.title}” but have not marked it finished. Open it again to continue from your checklist.`, action: 'Continue this improvement', path: '/dashboard?tab=recommendations', metadata: { recommendation_id: started.id, scan_id: started.scan_id } };
    else if (viewedRecommendations && open[0]) journey = { key: 'recommendations_viewed', contextKey: open[0].id, subject: 'Your best next step is ready', heading: 'You saw the advice—now choose one action', detail: `Your top unfinished suggestion is “${open[0].title}”. Start with its first checklist item rather than trying to fix everything at once.`, action: 'Start my top suggestion', path: '/dashboard?tab=recommendations', metadata: { recommendation_id: open[0].id, scan_id: open[0].scan_id } };
    else if ((recommendations ?? []).length > 0 && open.length === 0) { summary.skipped++; continue; }
    else if (scan) journey = { key: 'scan_ready', contextKey: scan.id, subject: `Your next step for ${scan.project_domain}`, heading: `Your scan for ${scan.project_domain} is ready`, detail: `Your latest AI visibility score is ${scan.score ?? 'ready to review'}. Open the evidence-backed suggestions and choose one improvement.`, action: 'See what to do next', path: '/dashboard?tab=recommendations', metadata: { scan_id: scan.id, domain: scan.project_domain, score: scan.score } };
    else journey = { key: 'account_no_scan', contextKey: 'first-scan', subject: 'Your first AI visibility answer is one scan away', heading: 'You created your account but have not scanned a brand yet', detail: 'Enter your website once to see whether ChatGPT, Claude, Gemini, and Perplexity recommend your brand—and which brands they choose instead.', action: 'Run my first scan', path: '/dashboard?tab=scan', metadata: {} };

    const messageId = `lifecycle:${userId}:${journey.key}:${journey.contextKey}`;
    const { data: existing } = await admin.from('lifecycle_email_events').select('id').eq('message_id', messageId).maybeSingle();
    if (existing) { summary.skipped++; continue; }
    summary.eligible++;
    summary.journey_counts[journey.key] = (summary.journey_counts[journey.key] ?? 0) + 1;
    if (dryRun) continue;

    const token = await hmacToken(email, resendKey);
    const { error: recordError } = await admin.from('lifecycle_email_events').insert({ user_id: userId, journey_key: journey.key, context_key: journey.contextKey, recipient_email: email, message_id: messageId, status: 'queued', metadata: journey.metadata });
    if (recordError) { summary.skipped++; continue; }
    const { error: queueError } = await admin.rpc('enqueue_email', { queue_name: 'transactional_emails', payload: { run_id: crypto.randomUUID(), to: email, from: 'AI Mention You <hello@aimentionyou.com>', sender_domain: 'aimentionyou.com', subject: journey.subject, html: renderEmail(journey, email, token), text: `${journey.heading}\n\n${journey.detail}\n\n${SITE_URL}${journey.path}`, purpose: 'marketing', label: `lifecycle_${journey.key}`, idempotency_key: messageId, unsubscribe_token: token, message_id: messageId, queued_at: new Date().toISOString() } });
    if (queueError) { await admin.from('lifecycle_email_events').update({ status: 'failed', metadata: { ...journey.metadata, error: queueError.message } }).eq('message_id', messageId); continue; }
    summary.queued++;
  }
  return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
