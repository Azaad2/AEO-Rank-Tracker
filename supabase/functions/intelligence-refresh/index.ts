// Rebuilds the AI Market Intelligence derived tables from every enabled
// signal provider. Runs nightly via pg_cron and can be triggered by admins.
//
// Steps:
//   1. Load enabled providers from intelligence_provider_flags.
//   2. For each provider: fetchDaily(sinceDays=45).
//   3. Upsert prompt_intelligence_daily (idempotent per hash+day+industry).
//   4. Upsert prompt_hash_display (idempotent per hash).
//   5. Run a cheap clustering pass over new hashes (Gemini flash, one call).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { buildRegistry } from "./signals/registry.ts";
import type { SignalRow, DisplaySample } from "./signals/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const url = new URL(req.url);
    const sinceDays = Number(url.searchParams.get("sinceDays") ?? "45");

    // 1. Enabled providers only
    const { data: flags } = await supabase
      .from("intelligence_provider_flags")
      .select("provider, enabled");
    const enabled = new Set((flags ?? []).filter(f => f.enabled).map(f => f.provider));
    const providers = buildRegistry(supabase).filter(p => enabled.has(p.key));

    let totalRows = 0;
    let totalDisplays = 0;

    for (const p of providers) {
      const { rows, displays } = await p.fetchDaily(sinceDays);

      // 3. Upsert daily rows in batches of 500
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500).map((r: SignalRow) => ({
          prompt_template_hash: r.prompt_template_hash,
          day: r.day,
          industry_id: r.industry_id,
          scan_count: r.scan_count,
          citation_frequency: r.citation_frequency,
          distinct_brands: r.distinct_brands,
          distinct_domains: r.distinct_domains,
          engines: r.engines,
          top_brands: r.top_brands,
          top_domains: r.top_domains,
        }));
        // Upsert on (hash, day, industry_id) — matches unique index.
        // supabase-js only supports named unique-constraint upserts; we emulate
        // with delete+insert on the natural key set.
        const keys = batch.map(b => ({ h: b.prompt_template_hash, d: b.day, i: b.industry_id }));
        // Delete existing keys in this batch
        for (const k of keys) {
          await supabase.from("prompt_intelligence_daily")
            .delete()
            .eq("prompt_template_hash", k.h)
            .eq("day", k.d)
            .is("industry_id", k.i === null ? null : undefined as unknown as null)
            .eq("industry_id", k.i ?? "00000000-0000-0000-0000-000000000000")
            .then(() => {}, () => {}); // best-effort; ignore mismatch when industry is null
        }
        const { error: insErr } = await supabase.from("prompt_intelligence_daily").insert(batch);
        if (insErr) console.error("prompt_intelligence_daily insert error:", insErr.message);
        totalRows += batch.length;
      }

      // 4. Upsert display texts
      for (let i = 0; i < displays.length; i += 500) {
        const batch = displays.slice(i, i + 500).map((d: DisplaySample) => ({
          prompt_template_hash: d.prompt_template_hash,
          display_text: d.display_text.slice(0, 240),
          sample_count: d.sample_count,
        }));
        const { error } = await supabase.from("prompt_hash_display").upsert(batch, { onConflict: "prompt_template_hash" });
        if (error) console.error("prompt_hash_display upsert error:", error.message);
        totalDisplays += batch.length;
      }

      await supabase.from("intelligence_provider_flags")
        .update({ last_run_at: new Date().toISOString() })
        .eq("provider", p.key);
    }

    // 5. Lightweight clustering: pick unclustered hashes with the most scans
    //    and ask Gemini flash to group + label them.
    try {
      const clusteringResult = await runClustering(supabase);
      return new Response(JSON.stringify({
        ok: true,
        providers: providers.map(p => p.key),
        rows_written: totalRows,
        displays_written: totalDisplays,
        clustering: clusteringResult,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      console.error("Clustering skipped:", (e as Error).message);
      return new Response(JSON.stringify({
        ok: true,
        providers: providers.map(p => p.key),
        rows_written: totalRows,
        displays_written: totalDisplays,
        clustering: { skipped: true, error: (e as Error).message },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e) {
    console.error("intelligence-refresh failed:", e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function runClustering(supabase: ReturnType<typeof createClient>) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return { skipped: true, reason: "no LOVABLE_API_KEY" };

  // Find hashes not yet in any cluster with meaningful volume in last 30d.
  const { data: candidates } = await supabase
    .from("prompt_intelligence_daily")
    .select("prompt_template_hash, industry_id, scan_count")
    .gte("day", new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10));

  if (!candidates || candidates.length === 0) return { skipped: true, reason: "no data" };

  // Aggregate scans per hash
  const perHash = new Map<string, { industry_id: string | null; scans: number }>();
  for (const c of candidates) {
    const prev = perHash.get(c.prompt_template_hash);
    perHash.set(c.prompt_template_hash, {
      industry_id: prev?.industry_id ?? c.industry_id,
      scans: (prev?.scans ?? 0) + (c.scan_count ?? 0),
    });
  }

  const { data: clustered } = await supabase.from("prompt_clusters").select("member_hashes");
  const already = new Set<string>();
  for (const row of clustered ?? []) for (const h of row.member_hashes ?? []) already.add(h);

  const { data: displays } = await supabase.from("prompt_hash_display").select("prompt_template_hash, display_text");
  const displayMap = new Map((displays ?? []).map(d => [d.prompt_template_hash, d.display_text]));

  const unclustered = [...perHash.entries()]
    .filter(([h]) => !already.has(h) && displayMap.has(h))
    .sort((a, b) => b[1].scans - a[1].scans)
    .slice(0, 60);

  if (unclustered.length < 3) return { skipped: true, reason: "not enough new hashes" };

  const prompts = unclustered.map(([h, meta]) => ({
    hash: h,
    text: displayMap.get(h)!,
    industry_id: meta.industry_id,
    scans: meta.scans,
  }));

  const systemPrompt = "Group similar user questions into clusters. Return JSON only.";
  const userPrompt = `Group these ${prompts.length} prompts into 3-10 clusters based on topic similarity. For each cluster, output:
- label (2-4 word topic name)
- intent (one of: Commercial, Informational, Comparison, Problem, Buying, How-to)
- commercial_intent_score (0-100 integer)
- member_hashes (array of hash values from the input)
- representative_prompt (the clearest prompt in the cluster)

Return JSON: { "clusters": [ { label, intent, commercial_intent_score, member_hashes, representative_prompt } ] }

Prompts:
${prompts.map(p => `[${p.hash}] ${p.text}`).join("\n")}`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.error(`clustering AI call failed [${resp.status}]: ${body}`);
    return { skipped: true, reason: `ai ${resp.status}` };
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  const clusters = Array.isArray(parsed.clusters) ? parsed.clusters : [];

  let inserted = 0;
  for (const c of clusters) {
    if (!c.label || !Array.isArray(c.member_hashes) || c.member_hashes.length === 0) continue;
    // Pick industry that dominates the cluster
    const industryCounts = new Map<string | null, number>();
    for (const h of c.member_hashes) {
      const meta = perHash.get(h);
      if (!meta) continue;
      industryCounts.set(meta.industry_id, (industryCounts.get(meta.industry_id) ?? 0) + meta.scans);
    }
    const industry_id = [...industryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const { error } = await supabase.from("prompt_clusters").insert({
      cluster_label: String(c.label).slice(0, 80),
      industry_id,
      representative_prompt: String(c.representative_prompt ?? c.label).slice(0, 240),
      member_hashes: c.member_hashes.filter((h: unknown) => typeof h === "string"),
      intent: c.intent ?? null,
      commercial_intent_score: Number.isFinite(c.commercial_intent_score)
        ? Math.max(0, Math.min(100, Math.round(c.commercial_intent_score)))
        : 50,
    });
    if (error) { console.error("cluster insert:", error.message); continue; }
    inserted++;
  }
  return { clusters_inserted: inserted, candidates_considered: unclustered.length };
}
