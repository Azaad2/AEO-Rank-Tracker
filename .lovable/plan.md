# Phase 1, Chunk #2 — Proprietary Metrics with Explainability

## Goal

Compute CAG, CIS, TSD, RSS, COI after every scan AND store the **decomposition + delta-vs-previous** so the dashboard never shows a score without "why it changed" evidence.

## Scope

1. Schema additions for explainability (breakdown + previous-scan deltas)
2. New shared module: metric formulas (pure functions, testable)
3. New edge function `compute-metrics` (called from `scan` after citations pipeline)
4. Integration hook in `scan/index.ts` (fire-and-forget, non-fatal)
5. No dashboard UI in this chunk — only the durable evidence layer the UI will read

## 1. Schema additions

Extend `proprietary_metrics_cache`:

- `rss_breakdown jsonb` — `{ mention_rate, citation_rate, position_inv, tsd, weighted_components: {…}, weights: {…} }`
- `cag_breakdown jsonb` — `{ brand_mean_authority, competitor_mean_authority, by_competitor: [{name, mean, delta}], top_gaps: [{domain, your_auth, comp_auth}] }`
- `tsd_breakdown jsonb` — `{ unique_domains, total_prompts, by_source_type: {reddit, review, …}, by_asset_type: {comparison, listicle, …} }`
- `cis_top` (existing) → standardize shape: `[{domain, cis, source_type, sample_size, wins, appearances}]`
- `coi` (existing) → standardize: `{ overall, by_competitor: [{name, coi, component_deltas: {mention_rate, citation_rate, position_inv, tsd}}] }`
- `previous_scan_id uuid` — pointer to the prior scan for the same `(user_id, project_domain)`
- `deltas jsonb` — `{ rss: {prev, curr, delta}, cag: {…}, tsd: {…}, by_source_type: [{type, prev_count, curr_count, delta}], by_asset_type: [{type, prev_count, curr_count, delta, pct_change}], new_winning_domains: [...], lost_winning_domains: [...] }`
- `explanation jsonb` — `[{metric: 'rss', direction: 'up'|'down'|'flat', magnitude: number, top_drivers: [{factor, contribution_pct, evidence: {…}}]}]` — pre-rendered "why it changed" payload the UI consumes directly
- `narrative text` — one-sentence human summary (e.g. *"RSS up 7 pts: Reddit citations +12%, comparison pages +4, TSD 0.41→0.58."*) generated deterministically from the explanation payload (no LLM)

Index: `idx_metrics_cache_previous` on `previous_scan_id` for follow-up queries.

## 2. Formulas (per architecture doc, with engine weighting)

Input: this scan's `scan_results` + `citations` + `citation_sources` + (optional) prior scan's metrics row.

- **Engine-weighted mention/citation rates**: pull weights from `engine_weights` table, default `{chatgpt:0.4, gemini:0.3, perplexity:0.2, claude:0.1}`.
- **RSS** = `0.35*mention_rate + 0.25*citation_rate + 0.25*position_inv + 0.15*TSD`
- **CAG** = `mean(authority of competitor citations) − mean(authority of your citations)` (authority joined via `citation_sources`)
- **TSD** = `unique_domains_supporting_brand / total_prompts_where_brand_appeared`, plus `by_source_type` + `by_asset_type` counts (uses Chunk #1's `asset_type` field — directly fulfills the user's explainability ask)
- **CIS** per domain in this scan's industry context: `(# prompts where d appears AND a brand it cites wins) / (# prompts where d appears)` — top 20 stored
- **COI** per competitor: `RSS(competitor) − RSS(you)`, **decomposed** into the four RSS components so we can say "you lose 8 pts on citation_rate, 3 on TSD"

Competitors are derived from `brand_observations` for this scan (with their own per-brand RSS computed against the same prompt set).

## 3. Explainability engine (deterministic, no LLM)

After computing current + loading previous, generate `deltas` + `explanation`:

```text
for each metric m in [rss, cag, tsd]:
  delta = curr[m] - prev[m]
  factors = decompose(m, curr_breakdown, prev_breakdown)
    e.g. for RSS:
      contribution_pct[mention_rate] = (Δmention_rate * weight) / Δrss
      contribution_pct[citation_rate] = ...
      contribution_pct[tsd] = ...
  attach evidence per factor:
    citation_rate: "+12% citations from reddit.com" (pull from by_source_type deltas)
    tsd:          "0.41 → 0.58 (+7 unique domains)"
    asset_type:   "+4 comparison_page citations, -2 listicle citations"
  rank factors by |contribution_pct| desc, take top 3
```

The deterministic `narrative` is then a templated string assembled from the top 3 factors. No model call, fully reproducible.

When no previous scan exists, `deltas` is null, `explanation` shows component breakdown only (no "why it changed"), and `narrative` becomes a baseline statement ("Baseline RSS 42. Strongest component: citation_rate (28).").

## 4. Compute pipeline

New edge function `compute-metrics` (verify_jwt = false, internal):

- Input: `{ scanId }` (looks up everything via service-role client)
- Loads: scan + scan_results + citations + citation_sources + brand_observations
- Computes all five metrics + breakdowns
- Finds prior `proprietary_metrics_cache` row by `(scan.user_id, scan.project_domain)` ordered by `computed_at desc`
- Builds deltas + explanation + narrative
- Upserts into `proprietary_metrics_cache` keyed by `scan_id`

Shared helpers in `supabase/functions/_shared/metrics.ts`:

- `computeRss(rows, engineWeights)` → `{ value, breakdown }`
- `computeCag(citations, sources, ownBrand, competitors)` → `{ value, breakdown }`
- `computeTsd(citations, ownBrand)` → `{ value, breakdown }` (groups by `source_type` AND `asset_type`)
- `computeCis(citations, winningBrands)` → `[{domain, cis, ...}]`
- `computeCoi(ownRss, competitorRssMap)` → `{ overall, by_competitor }`
- `buildExplanation(currMetrics, prevMetrics)` → `{ deltas, explanation, narrative }`

All pure functions, no Supabase imports — unit-testable.

## 5. Scan integration

In `scan/index.ts`, after the citations pipeline succeeds, fire-and-forget invoke `compute-metrics` (background, like `auto-optimize` is invoked today). Failures logged, never break the scan response.

## 6. What this chunk does NOT do

- No dashboard surfaces (chunk #5 reads this evidence)
- No `global_intelligence` writes (chunk #4)
- No recommendations (chunk #3 — but recs will cite `explanation` entries as their `evidence`)
- No backfill of historic scans (chunk #6)

---

## Technical details (engineer-facing)

- `compute-metrics` deno function: imports shared metrics module + uses service-role client (already pattern in repo)
- Engine weights loaded once per invocation from `engine_weights` (fallback to constants if table empty)
- For per-competitor RSS we reuse the same prompt set; `competitor_rss` requires per-engine mention/citation data — derive from `brand_observations` (engine, cited, position columns)
- Numeric stability: when prev or curr metric is null, contribution_pct = 0 and factor is dropped from explanation
- `narrative` length cap: 240 chars; truncate factor list rather than text
- `deltas.by_asset_type` is the field that powers the user's explicit example ("comparison pages increased by 4") — guarantee it's always populated when current scan has citations, even if prev is null (zero-baseline diff)
- Concurrency: `(scan_id)` unique constraint already exists, so `compute-metrics` is idempotent — safe to retry

## Open question (low-risk, decide during build)

For competitor RSS, do we score them against the **same prompt set** as the scan (apples-to-apples) or include their broader presence in `global_intelligence` (richer but cross-scan)? Proposal: same prompt set in Chunk #2; cross-scan upgrade lands with Chunk #4 when the moat dataset is live.  
  
Approved. One addition: add confidence_score and sample_size to proprietary_metrics_cache so every metric can communicate confidence based on data volume. For competitor RSS use the same prompt set as the scan for now; cross-scan/global_intelligence comparisons can be introduced in Chunk #4. Proceed with the build.

---

Approve and I'll build this chunk.