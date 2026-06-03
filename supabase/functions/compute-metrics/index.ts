// compute-metrics: computes RSS/CAG/TSD/CIS/COI + explainability for a scan
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import {
  computeRss,
  computeCag,
  computeTsd,
  computeCis,
  computeCompetitorRss,
  computeCoi,
  computeConfidence,
  buildExplanation,
  DEFAULT_ENGINE_WEIGHTS,
  type EngineWeights,
} from '../_shared/metrics.ts';

function normalizeBrand(input: string | null | undefined): string {
  if (!input) return '';
  let s = input.toLowerCase().trim();
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  s = s.replace(/\.(com|io|co|net|org|ai|app|dev)(\/.*)?$/i, '');
  s = s.replace(/\s+(inc|ltd|llc|gmbh|corp|co)\.?$/i, '');
  return s.trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { scanId } = await req.json();
    if (!scanId || typeof scanId !== 'string') {
      return new Response(JSON.stringify({ error: 'scanId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: scan, error: scanErr } = await supabase
      .from('scans')
      .select('id, user_id, project_domain, created_at')
      .eq('id', scanId)
      .maybeSingle();
    if (scanErr || !scan) {
      return new Response(JSON.stringify({ error: 'scan not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ownBrandNorm = normalizeBrand(scan.project_domain);

    const [resultsRes, citsRes, obsRes, weightsRes] = await Promise.all([
      supabase.from('scan_results').select('*').eq('scan_id', scanId),
      supabase
        .from('citations')
        .select('scan_result_id, engine, url, domain, source_type, asset_type, cites_brand, position')
        .in('scan_result_id', []), // overwritten below
      supabase
        .from('brand_observations')
        .select('scan_result_id, normalized_name, is_customer_brand, engine, cited, position')
        .in('scan_result_id', []),
      supabase.from('engine_weights').select('engine, weight'),
    ]);

    if (resultsRes.error) throw resultsRes.error;
    const results = resultsRes.data ?? [];
    const resultIds = results.map((r: any) => r.id);

    let citations: any[] = [];
    let observations: any[] = [];
    if (resultIds.length > 0) {
      const [c2, o2] = await Promise.all([
        supabase
          .from('citations')
          .select('scan_result_id, engine, url, domain, source_type, asset_type, cites_brand, position')
          .in('scan_result_id', resultIds),
        supabase
          .from('brand_observations')
          .select('scan_result_id, normalized_name, is_customer_brand, engine, cited, position')
          .in('scan_result_id', resultIds),
      ]);
      if (c2.error) throw c2.error;
      if (o2.error) throw o2.error;
      citations = c2.data ?? [];
      observations = o2.data ?? [];
    }

    const domainList = Array.from(new Set(citations.map((c) => c.domain).filter(Boolean)));
    let sources: any[] = [];
    if (domainList.length) {
      const { data: src } = await supabase
        .from('citation_sources')
        .select('domain, source_type, authority_score')
        .in('domain', domainList);
      sources = src ?? [];
    }

    const engineWeights: EngineWeights = { ...DEFAULT_ENGINE_WEIGHTS };
    if (weightsRes.data) {
      for (const w of weightsRes.data) {
        const k = (w as any).engine;
        const v = Number((w as any).weight);
        if (k && !isNaN(v)) (engineWeights as any)[k] = v;
      }
    }

    // total prompts where brand appeared (any engine mention)
    const promptsWithBrand = results.filter(
      (r: any) => r.gemini_mentioned || r.chatgpt_mentioned || r.perplexity_mentioned || r.claude_mentioned || r.mentioned
    ).length;

    const tsd = computeTsd(citations, ownBrandNorm, promptsWithBrand);
    const rss = computeRss(results, tsd.value, engineWeights);

    // winning brand per scan_result = brand most frequently cited across engines
    const winnerByResult = new Map<number, string>();
    const tallyByResult = new Map<number, Map<string, number>>();
    for (const c of citations) {
      if (!c.cites_brand) continue;
      const m = tallyByResult.get(c.scan_result_id) ?? new Map();
      const k = c.cites_brand.toLowerCase();
      m.set(k, (m.get(k) ?? 0) + 1);
      tallyByResult.set(c.scan_result_id, m);
    }
    for (const [rid, m] of tallyByResult.entries()) {
      let best = '';
      let bestN = 0;
      for (const [k, n] of m.entries()) if (n > bestN) { best = k; bestN = n; }
      if (best) winnerByResult.set(rid, best);
    }

    const cag = computeCag(citations, sources, ownBrandNorm);
    const cisTop = computeCis(citations, winnerByResult);
    const compRss = computeCompetitorRss(observations, resultIds, citations, engineWeights);
    const coi = computeCoi(rss, compRss);

    // Find previous scan for same user + domain
    let prevMetrics: any = null;
    let previousScanId: string | null = null;
    if (scan.user_id) {
      const { data: prevScan } = await supabase
        .from('scans')
        .select('id, created_at')
        .eq('user_id', scan.user_id)
        .eq('project_domain', scan.project_domain)
        .lt('created_at', scan.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prevScan) {
        previousScanId = prevScan.id;
        const { data: prev } = await supabase
          .from('proprietary_metrics_cache')
          .select('rss, rss_breakdown, cag, cag_breakdown, tsd, tsd_breakdown')
          .eq('scan_id', prevScan.id)
          .maybeSingle();
        if (prev) prevMetrics = prev;
      }
    }

    const prevBundle = prevMetrics
      ? {
          rss: prevMetrics.rss != null ? { value: Number(prevMetrics.rss), breakdown: prevMetrics.rss_breakdown ?? {} } : null,
          cag: prevMetrics.cag != null ? { value: Number(prevMetrics.cag), breakdown: prevMetrics.cag_breakdown ?? {} } : null,
          tsd: prevMetrics.tsd != null ? { value: Number(prevMetrics.tsd), breakdown: prevMetrics.tsd_breakdown ?? {} } : null,
        }
      : {};

    const { deltas, explanation, narrative } = buildExplanation(
      { rss, cag, tsd },
      prevBundle as any
    );

    const enginesWithData = (['gemini', 'chatgpt', 'perplexity', 'claude'] as const).filter((e) =>
      results.some((r: any) => r[`${e}_mentioned`] !== null && r[`${e}_mentioned`] !== undefined)
    ).length;
    const confidence = computeConfidence({
      prompts: results.length,
      citations: citations.length,
      engines_with_data: enginesWithData,
    });

    const sampleSize = {
      prompts: results.length,
      citations: citations.length,
      engines_with_data: enginesWithData,
      competitors: compRss.size,
      unique_citation_domains: domainList.length,
      bucket: confidence.bucket,
    };

    const payload: any = {
      scan_id: scanId,
      rss: rss.value,
      cag: cag.value,
      tsd: tsd.value,
      cis_top: cisTop,
      coi,
      rss_breakdown: rss.breakdown,
      cag_breakdown: cag.breakdown,
      tsd_breakdown: tsd.breakdown,
      previous_scan_id: previousScanId,
      deltas,
      explanation,
      narrative,
      confidence_score: confidence.score,
      sample_size: sampleSize,
      metrics: { confidence_bucket: confidence.bucket },
      computed_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from('proprietary_metrics_cache')
      .upsert(payload, { onConflict: 'scan_id' });
    if (upErr) throw upErr;

    return new Response(
      JSON.stringify({
        ok: true,
        scanId,
        rss: rss.value,
        cag: cag.value,
        tsd: tsd.value,
        coi: coi.overall,
        confidence: confidence.score,
        narrative,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('compute-metrics error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
