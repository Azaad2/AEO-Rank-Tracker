// rollup-intelligence: writes anonymized citation observations into
// public.global_intelligence after a scan. Privacy-safe by construction.
// Idempotent via global_intelligence_scan_contributions ledger.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { classifyCitations, type ExtractedCitation } from '../_shared/citations.ts';
import {
  buildGrainRows,
  hashPromptTemplate,
  normalizeBrand,
  mergeWeightedPosition,
  type CitationInput,
  type GrainRow,
  type PromptRow,
  type ScanContext,
} from '../_shared/intelligence.ts';

export const ROLLUP_ENGINE_VERSION = 'rollup-v1.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Body { scanId: string; force?: boolean }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { scanId, force } = (await req.json()) as Body;
    if (!scanId) return json({ error: 'scanId required' }, 400);
    const sb = createClient(supabaseUrl, serviceKey);

    const { data: scan, error: scanErr } = await sb
      .from('scans')
      .select('id, project_domain, industry_id, topic_cluster_id, rolled_up_at')
      .eq('id', scanId).maybeSingle();
    if (scanErr || !scan) return json({ error: 'scan not found' }, 404);
    if (scan.rolled_up_at && !force) {
      return json({ ok: true, skipped: 'already rolled up', at: scan.rolled_up_at });
    }

    // If force-rerun, first roll back this scan's prior contributions so we
    // never double-count.
    if (force) {
      await rollbackPriorContributions(sb, scanId);
    }

    const { data: results } = await sb
      .from('scan_results')
      .select('id, prompt')
      .eq('scan_id', scanId);
    const promptRows: PromptRow[] = (results ?? []).map(r => ({
      scan_result_id: Number(r.id), prompt: r.prompt,
    }));
    if (promptRows.length === 0) {
      await sb.from('scans').update({ rolled_up_at: new Date().toISOString() }).eq('id', scanId);
      return json({ ok: true, rows: 0, note: 'no scan_results' });
    }
    const resultIds = promptRows.map(p => p.scan_result_id);

    const { data: citations } = await sb
      .from('citations')
      .select('scan_result_id, engine, url, domain, source_type, asset_type, position, cites_brand')
      .in('scan_result_id', resultIds);

    const { data: brandObs } = await sb
      .from('brand_observations')
      .select('normalized_name')
      .in('scan_result_id', resultIds);

    const uniqueDomains = Array.from(new Set((citations ?? []).map(c => c.domain).filter(Boolean)));
    const authorityByDomain = new Map<string, number>();
    if (uniqueDomains.length > 0) {
      const { data: srcs } = await sb
        .from('citation_sources')
        .select('domain, authority_score')
        .in('domain', uniqueDomains);
      for (const s of srcs ?? []) authorityByDomain.set(s.domain, s.authority_score);
    }

    const extracted: ExtractedCitation[] = (citations ?? []).map((c, i) => ({
      url: c.url, domain: c.domain, position: c.position ?? i, title: undefined,
    }));
    const classified = await classifyCitations(extracted, { enableLlm: false });
    const confByUrl = new Map<string, number>();
    for (const cc of classified) confByUrl.set(cc.url, cc.confidence);

    const knownBrands = Array.from(new Set((brandObs ?? []).map(b => b.normalized_name).filter(Boolean)));
    const ownBrand = scan.project_domain ?? '';
    const ownBrandNormalized = normalizeBrand(ownBrand);

    const ctx: ScanContext = {
      industryId: scan.industry_id ?? null,
      topicClusterId: scan.topic_cluster_id ?? null,
      ownBrand,
      knownBrands,
    };

    const hashEntries = await Promise.all(
      promptRows.map(async p => [p.scan_result_id, await hashPromptTemplate(p.prompt, ownBrand, knownBrands)] as const)
    );
    const promptHashes = new Map(hashEntries);

    const cInputs: CitationInput[] = (citations ?? []).map(c => ({
      scan_result_id: Number(c.scan_result_id),
      engine: c.engine,
      domain: c.domain,
      source_type: c.source_type,
      asset_type: c.asset_type,
      position: c.position,
      cites_brand: c.cites_brand,
      authority_score: authorityByDomain.get(c.domain) ?? null,
      classification_confidence: confByUrl.get(c.url) ?? null,
    }));

    const grains = buildGrainRows({
      ctx, prompts: promptRows, promptHashes, citations: cInputs, ownBrandNormalized,
    });

    if (grains.length === 0) {
      await sb.from('scans').update({ rolled_up_at: new Date().toISOString() }).eq('id', scanId);
      return json({ ok: true, rows: 0 });
    }

    let inserted = 0, updated = 0;
    const periodStart = dateTruncUtcDay(new Date()).toISOString();
    const periodEnd = new Date(dateTruncUtcDay(new Date()).getTime() + 86400000).toISOString();
    const contributions: Array<{
      scan_id: string; grain_key: string; global_intelligence_id: string | null;
      observation_count: number; citation_frequency: number;
      contribution_hash: string; engine_version: string;
    }> = [];

    for (const chunk of chunkArray(grains, 200)) {
      const ors = chunk.map(g => grainMatchExpr(g, periodStart)).join(',');
      const { data: existing } = await sb
        .from('global_intelligence')
        .select('id, industry_id, topic_cluster_id, engine, winning_brand, citation_domain, source_type, asset_type, prompt_template_hash, period_start, observation_count, citation_frequency, recommendation_position, authority_score, classification_confidence, first_observed_at')
        .or(ors)
        .gte('period_start', periodStart)
        .lt('period_start', periodEnd);

      const existingByKey = new Map<string, any>();
      for (const e of existing ?? []) existingByKey.set(grainKey(e), e);

      const toInsert: any[] = [];
      const insertGrainKeys: string[] = [];
      for (const g of chunk) {
        const key = grainKey({ ...g, period_start: periodStart });
        const prev = existingByKey.get(key);
        const contribHash = await sha16(`${key}|${g.observation_count}|${g.citation_frequency}|${g.recommendation_position ?? ''}|${g.authority_score ?? ''}`);

        if (!prev) {
          toInsert.push({
            ...g,
            period_start: periodStart,
            period_end: periodEnd,
            first_observed_at: new Date().toISOString(),
            last_observed_at: new Date().toISOString(),
          });
          insertGrainKeys.push(key);
          contributions.push({
            scan_id: scanId, grain_key: key, global_intelligence_id: null,
            observation_count: g.observation_count, citation_frequency: g.citation_frequency,
            contribution_hash: contribHash, engine_version: ROLLUP_ENGINE_VERSION,
          });
        } else {
          const mergedPos = mergeWeightedPosition(
            prev.recommendation_position, prev.observation_count,
            g.recommendation_position, g.observation_count,
          );
          const mergedAuth = Math.max(prev.authority_score ?? 0, g.authority_score ?? 0) || null;
          const totalN = prev.observation_count + g.observation_count;
          const mergedConf = (() => {
            if (prev.classification_confidence == null) return g.classification_confidence;
            if (g.classification_confidence == null) return prev.classification_confidence;
            return +(((prev.classification_confidence * prev.observation_count) + (g.classification_confidence * g.observation_count)) / Math.max(1, totalN)).toFixed(3);
          })();
          await sb.from('global_intelligence')
            .update({
              observation_count: prev.observation_count + g.observation_count,
              citation_frequency: prev.citation_frequency + g.citation_frequency,
              recommendation_position: mergedPos,
              authority_score: mergedAuth,
              classification_confidence: mergedConf,
              last_observed_at: new Date().toISOString(),
            })
            .eq('id', prev.id);
          updated += 1;
          contributions.push({
            scan_id: scanId, grain_key: key, global_intelligence_id: prev.id,
            observation_count: g.observation_count, citation_frequency: g.citation_frequency,
            contribution_hash: contribHash, engine_version: ROLLUP_ENGINE_VERSION,
          });
        }
      }

      if (toInsert.length > 0) {
        const { data: insertedRows, error: insErr } = await sb
          .from('global_intelligence').insert(toInsert).select('id');
        if (insErr) {
          console.error('global_intelligence insert error', insErr);
        } else {
          inserted += toInsert.length;
          // Wire the newly-created IDs into the corresponding contribution rows.
          const newContribStart = contributions.length - toInsert.length;
          (insertedRows ?? []).forEach((row, i) => {
            // Match by order — insert returns rows in input order.
            const contribIdx = contributions.findIndex(
              (c, idx) => idx >= newContribStart && c.global_intelligence_id === null && c.grain_key === insertGrainKeys[i]
            );
            if (contribIdx >= 0) contributions[contribIdx].global_intelligence_id = row.id;
          });
        }
      }
    }

    if (contributions.length > 0) {
      const { error: cErr } = await sb
        .from('global_intelligence_scan_contributions')
        .upsert(contributions, { onConflict: 'scan_id,grain_key' });
      if (cErr) console.error('contributions upsert error', cErr);
    }

    await sb.from('scans').update({ rolled_up_at: new Date().toISOString() }).eq('id', scanId);

    return json({ ok: true, grains: grains.length, inserted, updated, contributions: contributions.length });
  } catch (e) {
    console.error('rollup-intelligence error', e);
    return json({ error: e instanceof Error ? e.message : 'unknown' }, 500);
  }
});

async function rollbackPriorContributions(sb: any, scanId: string) {
  const { data: prior } = await sb
    .from('global_intelligence_scan_contributions')
    .select('id, global_intelligence_id, observation_count, citation_frequency')
    .eq('scan_id', scanId);
  if (!prior || prior.length === 0) return;
  for (const p of prior) {
    if (!p.global_intelligence_id) continue;
    const { data: gi } = await sb
      .from('global_intelligence')
      .select('id, observation_count, citation_frequency')
      .eq('id', p.global_intelligence_id).maybeSingle();
    if (!gi) continue;
    const newObs = Math.max(0, (gi.observation_count ?? 0) - (p.observation_count ?? 0));
    const newFreq = Math.max(0, (gi.citation_frequency ?? 0) - (p.citation_frequency ?? 0));
    if (newObs === 0 && newFreq === 0) {
      await sb.from('global_intelligence').delete().eq('id', gi.id);
    } else {
      await sb.from('global_intelligence')
        .update({ observation_count: newObs, citation_frequency: newFreq })
        .eq('id', gi.id);
    }
  }
  await sb.from('global_intelligence_scan_contributions').delete().eq('scan_id', scanId);
}

async function sha16(s: string): Promise<string> {
  const bytes = new TextEncoder().encode(s);
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function chunkArray<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out;
}

function dateTruncUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function grainKey(r: {
  industry_id?: string | null; topic_cluster_id?: string | null;
  engine: string; winning_brand?: string | null; citation_domain: string;
  source_type?: string | null; asset_type?: string | null;
  prompt_template_hash: string; period_start: string;
}): string {
  return [
    r.industry_id ?? '_', r.topic_cluster_id ?? '_', r.engine,
    r.winning_brand ?? '_', r.citation_domain, r.source_type ?? '_',
    r.asset_type ?? '_', r.prompt_template_hash, r.period_start,
  ].join('|');
}

function grainMatchExpr(g: GrainRow, periodStart: string): string {
  const parts = [
    g.industry_id ? `industry_id.eq.${g.industry_id}` : 'industry_id.is.null',
    g.topic_cluster_id ? `topic_cluster_id.eq.${g.topic_cluster_id}` : 'topic_cluster_id.is.null',
    `engine.eq.${g.engine}`,
    g.winning_brand ? `winning_brand.eq.${escapeOr(g.winning_brand)}` : 'winning_brand.is.null',
    `citation_domain.eq.${escapeOr(g.citation_domain)}`,
    g.source_type ? `source_type.eq.${escapeOr(g.source_type)}` : 'source_type.is.null',
    g.asset_type ? `asset_type.eq.${escapeOr(g.asset_type)}` : 'asset_type.is.null',
    `prompt_template_hash.eq.${g.prompt_template_hash}`,
  ];
  return `and(${parts.join(',')})`;
}

function escapeOr(v: string): string {
  return `"${v.replace(/"/g, '\\"')}"`;
}
