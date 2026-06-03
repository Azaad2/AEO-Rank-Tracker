// Evidence-first recommendation generator.
// Triggered fire-and-forget by the scan pipeline after metrics+rollup.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import {
  ENGINE_VERSION,
  rankAndCap,
  runAllRules,
  type AssetType,
  type CitationRow,
  type PeerAssetStats,
  type RecommendationContext,
} from "../_shared/recommendations.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeBrand(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { scan_id } = await req.json();
    if (!scan_id) {
      return new Response(JSON.stringify({ error: "scan_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Load scan
    const { data: scan, error: scanErr } = await supabase
      .from("scans")
      .select("id,user_id,project_domain,industry_id,topic_cluster_id")
      .eq("id", scan_id)
      .single();
    if (scanErr || !scan) throw scanErr ?? new Error("scan not found");

    const userBrand = normalizeBrand(scan.project_domain);

    // 2. Load this scan's citations (joined with scan_results to filter by scan)
    const { data: scanResults } = await supabase
      .from("scan_results")
      .select("id")
      .eq("scan_id", scan_id);
    const resultIds = (scanResults ?? []).map((r: any) => r.id);

    let citations: CitationRow[] = [];
    if (resultIds.length > 0) {
      const { data: cits } = await supabase
        .from("citations")
        .select("domain,url,asset_type,source_type,cites_brand,title,classification_confidence")
        .in("scan_result_id", resultIds);
      citations = (cits ?? []).map((c: any) => ({
        domain: c.domain,
        url: c.url,
        asset_type: c.asset_type as AssetType | null,
        source_type: c.source_type,
        cites_brand: c.cites_brand,
        title: c.title,
        classification_confidence: c.classification_confidence,
      }));
    }

    const userCitations = citations.filter(
      (c) => normalizeBrand(c.cites_brand) && userBrand && normalizeBrand(c.cites_brand)!.includes(userBrand),
    );

    // 3. Load metrics (current + previous)
    const { data: metricsRows } = await supabase
      .from("proprietary_metrics_cache")
      .select("rss,cag,tsd,previous_scan_id")
      .eq("scan_id", scan_id)
      .limit(1);
    const m = metricsRows?.[0] ?? { rss: null, cag: null, tsd: null, previous_scan_id: null };

    let prev = { rss: null as number | null, cag: null as number | null, tsd: null as number | null };
    if (m.previous_scan_id) {
      const { data: p } = await supabase
        .from("proprietary_metrics_cache")
        .select("rss,cag,tsd")
        .eq("scan_id", m.previous_scan_id)
        .limit(1);
      if (p?.[0]) prev = { rss: p[0].rss, cag: p[0].cag, tsd: p[0].tsd };
    }

    // 4. Pull peer rollups from global_intelligence filtered by industry
    let peerStats: PeerAssetStats[] = [];
    if (scan.industry_id) {
      const q = supabase
        .from("global_intelligence")
        .select("winning_brand,asset_type,citation_frequency,authority_score,recommendation_position")
        .eq("industry_id", scan.industry_id)
        .not("asset_type", "is", null);
      if (scan.topic_cluster_id) q.eq("topic_cluster_id", scan.topic_cluster_id);
      const { data: peers } = await q;

      // Group by asset_type
      const byAsset = new Map<AssetType, Array<{ brand: string; freq: number; auth: number | null; pos: number | null }>>();
      for (const row of peers ?? []) {
        const at = row.asset_type as AssetType;
        if (!at) continue;
        if (!byAsset.has(at)) byAsset.set(at, []);
        // Aggregate per brand (sum citation_frequency)
        byAsset.get(at)!.push({
          brand: row.winning_brand ?? "unknown",
          freq: row.citation_frequency ?? 1,
          auth: row.authority_score,
          pos: row.recommendation_position,
        });
      }

      for (const [asset, rows] of byAsset.entries()) {
        // Aggregate per-brand totals
        const perBrand = new Map<string, { value: number; auth: number[]; pos: number[] }>();
        for (const r of rows) {
          if (!perBrand.has(r.brand)) perBrand.set(r.brand, { value: 0, auth: [], pos: [] });
          const acc = perBrand.get(r.brand)!;
          acc.value += r.freq;
          if (typeof r.auth === "number") acc.auth.push(r.auth);
          if (typeof r.pos === "number") acc.pos.push(r.pos);
        }
        // Exclude the user's own brand from peer benchmarks
        if (userBrand) {
          for (const k of [...perBrand.keys()]) {
            if (k.includes(userBrand)) perBrand.delete(k);
          }
        }
        if (perBrand.size < 3) continue;

        const values = [...perBrand.values()].map((v) => v.value);
        const auths = [...perBrand.values()].flatMap((v) => v.auth);
        const poss = [...perBrand.values()].flatMap((v) => v.pos);
        const topBrands = [...perBrand.entries()]
          .sort((a, b) => b[1].value - a[1].value)
          .slice(0, 5)
          .map(([brand, v]) => ({ brand, value: v.value, asset_type: asset }));

        peerStats.push({
          asset_type: asset,
          peer_sample_size: perBrand.size,
          peer_avg: values.reduce((s, x) => s + x, 0) / values.length,
          peer_median: median(values),
          peer_max: Math.max(...values),
          top_brands: topBrands,
          avg_authority: auths.length ? auths.reduce((s, x) => s + x, 0) / auths.length : null,
          avg_position: poss.length ? poss.reduce((s, x) => s + x, 0) / poss.length : null,
        });
      }
    }

    // 5. Load recurrence history (existing recommendations by type for this user)
    const { data: priorRecs } = await supabase
      .from("recommendations")
      .select("recommendation_type,recurrence_count,scan_id")
      .eq("user_id", scan.user_id)
      .not("recommendation_type", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    const history: RecommendationContext["history"] = {};
    for (const r of priorRecs ?? []) {
      const t = r.recommendation_type as string;
      if (!t || history[t]) continue;
      history[t] = { recurrence_count: r.recurrence_count ?? 1, last_seen_scan_id: r.scan_id };
    }

    // 6. Run rules
    const ctx: RecommendationContext = {
      scan_id,
      user_id: scan.user_id,
      domain: scan.project_domain,
      industry_id: scan.industry_id,
      topic_cluster_id: scan.topic_cluster_id,
      userCitations,
      allCitations: citations,
      metrics: { rss: m.rss, cag: m.cag, tsd: m.tsd },
      prevMetrics: prev,
      peerStats,
      history,
    };

    const candidates = runAllRules(ctx);
    const ranked = rankAndCap(candidates, history, 12);

    // 7. Replace this scan's recommendations
    await supabase.from("recommendations").delete().eq("scan_id", scan_id);

    if (ranked.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, reason: "no candidates with sufficient peer evidence" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = ranked.map(({ c, recurrence, novelty, priority }) => ({
      scan_id,
      user_id: scan.user_id,
      title: c.title,
      description: c.description,
      evidence: { ...c.evidence, novelty_score: novelty, recurrence_count: recurrence },
      expected_impact: c.expected_impact,
      confidence: c.confidence,
      difficulty: c.difficulty,
      time_estimate_minutes: c.time_estimate_minutes,
      category: c.category,
      status: "pending",
      priority_score: priority,
      difficulty_weight: c.difficulty_weight,
      why_this_matters: c.why_this_matters,
      industry_benchmark: c.industry_benchmark,
      competitor_examples: c.competitor_examples,
      supporting_asset_types: c.supporting_asset_types,
      recommendation_type: c.recommendation_type,
      target_metric: c.target_metric,
      projected_metric_delta: c.projected_metric_delta,
      execution_payload: c.execution_payload,
      industry_id: scan.industry_id,
      generated_by_version: ENGINE_VERSION,
      evidence_urls: c.evidence_urls,
      novelty_score: novelty,
      recurrence_count: recurrence,
      last_seen_scan_id: scan_id,
    }));

    const { error: insErr } = await supabase.from("recommendations").insert(rows);
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ inserted: rows.length, engine: ENGINE_VERSION }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recommendations error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
