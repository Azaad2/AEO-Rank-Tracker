// First-party signal source: anonymized aggregated data from AI Mention You scans.
// Reads from public.global_intelligence + public.global_intelligence_scan_contributions
// and joins to public.scan_results only to recover a brand-scrubbed representative
// display text per prompt template hash.
//
// Never emits any per-user or per-domain data — output is aggregated grain.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import type { SignalProvider, SignalRow, DisplaySample } from "./types.ts";

// Same brand-scrub rules used when the hash was originally built (in
// supabase/functions/_shared/intelligence.ts hashPromptTemplate). We reproduce
// them here to derive a *display* text that never leaks a real brand name.
function scrubForDisplay(prompt: string, knownBrands: string[]): string {
  let p = (prompt ?? "").toLowerCase();
  p = p.replace(/https?:\/\/\S+/g, " ");
  p = p.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, " ");
  const brands = [...new Set(knownBrands.filter(Boolean).map(b => b.toLowerCase().trim()))]
    .sort((a, b) => b.length - a.length);
  for (const b of brands) {
    if (b.length < 2) continue;
    const esc = b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    p = p.replace(new RegExp(`\\b${esc}\\b`, "gi"), "your brand");
  }
  p = p.replace(/\s+/g, " ").trim();
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function createInternalProvider(supabase: SupabaseClient): SignalProvider {
  return {
    key: "internal_scans",
    async fetchDaily(sinceDays: number) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();

      // Pull grain rows in the window.
      const { data: giRows, error: giErr } = await supabase
        .from("global_intelligence")
        .select("industry_id, prompt_template_hash, engine, winning_brand, citation_domain, observation_count, citation_frequency, last_observed_at")
        .gte("last_observed_at", since)
        .limit(20000);
      if (giErr) throw giErr;

      // Aggregate → SignalRow map keyed by hash|day|industry
      type Agg = SignalRow & { brandsMap: Map<string, number>; domainsMap: Map<string, number>; enginesSet: Set<string>; };
      const map = new Map<string, Agg>();
      for (const r of giRows ?? []) {
        const day = (r.last_observed_at as string).slice(0, 10);
        const key = `${r.prompt_template_hash}|${day}|${r.industry_id ?? ""}`;
        let a = map.get(key);
        if (!a) {
          a = {
            prompt_template_hash: r.prompt_template_hash,
            day,
            industry_id: r.industry_id,
            scan_count: 0,
            citation_frequency: 0,
            distinct_brands: 0,
            distinct_domains: 0,
            engines: [],
            top_brands: [],
            top_domains: [],
            brandsMap: new Map(),
            domainsMap: new Map(),
            enginesSet: new Set(),
          };
          map.set(key, a);
        }
        a.scan_count += r.observation_count ?? 0;
        a.citation_frequency += r.citation_frequency ?? 0;
        if (r.engine) a.enginesSet.add(r.engine);
        if (r.winning_brand) a.brandsMap.set(r.winning_brand, (a.brandsMap.get(r.winning_brand) ?? 0) + (r.observation_count ?? 1));
        if (r.citation_domain) a.domainsMap.set(r.citation_domain, (a.domainsMap.get(r.citation_domain) ?? 0) + (r.citation_frequency ?? 1));
      }

      const rows: SignalRow[] = [];
      for (const a of map.values()) {
        a.engines = [...a.enginesSet];
        a.distinct_brands = a.brandsMap.size;
        a.distinct_domains = a.domainsMap.size;
        a.top_brands = [...a.brandsMap.entries()]
          .sort((x, y) => y[1] - x[1]).slice(0, 5).map(([brand, count]) => ({ brand, count }));
        a.top_domains = [...a.domainsMap.entries()]
          .sort((x, y) => y[1] - x[1]).slice(0, 5).map(([domain, count]) => ({ domain, count }));
        rows.push({
          prompt_template_hash: a.prompt_template_hash,
          day: a.day,
          industry_id: a.industry_id,
          scan_count: a.scan_count,
          citation_frequency: a.citation_frequency,
          distinct_brands: a.distinct_brands,
          distinct_domains: a.distinct_domains,
          engines: a.engines,
          top_brands: a.top_brands,
          top_domains: a.top_domains,
        });
      }

      // Displays: for each hash pick most-recent raw prompt & scrub with known brands.
      const hashes = [...new Set(rows.map(r => r.prompt_template_hash))];
      const displays: DisplaySample[] = [];
      if (hashes.length) {
        // Pull scan_results joined against global_intelligence_scan_contributions
        // to know which raw prompts correspond to which hash — we don't have a
        // direct FK, but the `grain_key` in contributions contains the hash.
        // As a simpler + safe fallback, take up to N recent scan_results rows
        // and re-hash their text via the same normalization used at write time,
        // then match. For v1 we approximate: sample recent scan_results per
        // industry and store a scrubbed version keyed by best-guess mapping.
        // We rely on the fact that `scan_results.prompt` is short.
        const { data: sr } = await supabase
          .from("scan_results")
          .select("prompt, scan_id, created_at, scans!inner(project_domain)")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(2000);
        // Build brand list from project_domain hosts to scrub display text.
        const knownBrands = new Set<string>();
        for (const row of sr ?? []) {
          // deno-lint-ignore no-explicit-any
          const domain = (row as any).scans?.project_domain as string | undefined;
          if (domain) {
            const brand = domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].split(".")[0];
            if (brand && brand.length > 1) knownBrands.add(brand);
          }
        }
        const brandsArr = [...knownBrands];

        // For matching, re-hash each raw prompt with a lightweight version of
        // the normalization used at write time. Import the real hasher via the
        // shared module.
        const { hashPromptTemplate } = await import("../../_shared/intelligence.ts");
        const seen = new Set<string>();
        for (const row of sr ?? []) {
          const raw = (row.prompt ?? "").toString();
          if (!raw) continue;
          // deno-lint-ignore no-explicit-any
          const domain = (row as any).scans?.project_domain as string | undefined;
          const ownBrand = domain ? domain.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0].split(".")[0] : "";
          const hash = await hashPromptTemplate(raw, ownBrand, brandsArr);
          if (seen.has(hash)) continue;
          seen.add(hash);
          displays.push({
            prompt_template_hash: hash,
            display_text: scrubForDisplay(raw, [ownBrand, ...brandsArr]),
            sample_count: 1,
          });
        }
      }

      return { rows, displays };
    },
  };
}
