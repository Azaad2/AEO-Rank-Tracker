# Chunk #3 — Evidence-First Recommendation Engine

Builds the engine that turns the moat (citations + metrics + global_intelligence) into prioritized, evidence-backed actions. Every recommendation cites its data, benchmarks against industry peers, and is structured for a future "Generate → Apply → Measure" loop.

## Core principles

1. **Evidence-first** — no recommendation without supporting rows from `citations`, `global_intelligence`, `proprietary_metrics_cache`, or `brand_observations`.
2. **Priority-sorted** — `Impact × Confidence ÷ Difficulty` computed server-side.
3. **Execution-ready** — schema and payload designed so a later worker can run Generate → Apply → Measure without migration.

## Schema changes (extend existing `recommendations` table)

Add columns (nullable, backfill-safe):

```text
priority_score        numeric          -- impact * confidence / difficulty_weight
difficulty_weight     smallint         -- 1=easy, 3=medium, 5=hard (derived from difficulty text)
why_this_matters      text             -- short narrative (≤280 chars)
industry_benchmark    jsonb            -- { metric, peer_avg, peer_median, user_value, gap }
competitor_examples   jsonb            -- [{ brand, value, asset_type }]
supporting_asset_types text[]          -- ['comparison_page','reddit_thread',...]
recommendation_type   text             -- 'comparison_page_gap' | 'reddit_presence' | 'authority' | ...
target_metric         text             -- 'RSS' | 'CAG' | 'TSD' | 'CIS' | 'COI'
projected_metric_delta numeric         -- e.g. +7 RSS pts
execution_payload     jsonb            -- structured spec for future auto-execution
industry_id           uuid             -- denormalized for analytics
generated_by_version  text             -- engine version tag for A/B + audit
```

Index: `(user_id, scan_id, priority_score desc)`.
No data deletion. Old rows simply have NULL in new columns.

## Recommendation rule library (`_shared/recommendations.ts`)

Pure functions, each returns `RecommendationCandidate | null` given a `RecommendationContext` (scan, citations, metrics, peer rollups). Initial set:

- `comparisonPageGap` — compares user comparison_page count vs industry peers from `global_intelligence`.
- `redditPresenceGap` — reddit_thread asset_type density.
- `listicleInclusion` — appearances in listicle asset_type.
- `directoryListingGap` — directory_listing presence.
- `reviewProfileGap` — review_page presence on G2/Capterra/Trustpilot class domains.
- `authorityLift` — domains where peers have higher `authority_score`.
- `positionImprovement` — prompts where user cited but `recommendation_position` > peer median.
- `tsdLift` — Trust Source Density below peer median.
- `cagClose` — Citation Authority Gap negative outliers.

Each rule emits:

```text
{
  recommendation_type, title, description, why_this_matters,
  category, target_metric, projected_metric_delta,
  expected_impact (0-100), confidence (0-100),
  difficulty ('easy'|'medium'|'hard'), difficulty_weight,
  time_estimate_minutes,
  evidence: { user_value, peer_sample_size, peer_avg, peer_median, source_grain },
  industry_benchmark: { metric, peer_avg, peer_median, user_value, gap },
  competitor_examples: [{ brand, value, asset_type }],  // anonymized brands only
  supporting_asset_types: [...],
  execution_payload: { action, generator, inputs, expected_artifacts }
}
```

Confidence is data-driven: scales with `peer_sample_size` and `classification_confidence` from Chunk #1; capped at 95.
Impact is the projected metric delta normalized 0–100 against the engine's deltas table.
Difficulty is rule-defined, with `difficulty_weight ∈ {1,3,5}`.

## Edge function `generate-recommendations`

`verify_jwt = false` (internal, scan-pipeline-invoked). Accepts `{ scan_id }`.

Steps:

1. Load scan, scan_results, citations (with classified asset_type), proprietary_metrics_cache (latest + previous), brand_observations.
2. Resolve `industry_id` and `topic_cluster_id` for the scan.
3. Pull peer rollups from `global_intelligence` filtered by `industry_id`, optionally `topic_cluster_id`. Aggregate by `asset_type` to compute `peer_avg`, `peer_median`, `peer_sample_size`, top-3 anonymized brands by `citation_frequency`.
4. Run every rule in the library; drop rules with `peer_sample_size < 3` or missing evidence (no recommendation without evidence).
5. Compute `priority_score = expected_impact * confidence / difficulty_weight`.
6. Delete previous `recommendations` rows for `(user_id, scan_id)` then bulk-insert new set sorted by `priority_score desc`.
7. Cap at top 12 to prevent overload (configurable; spillover stored with status `suppressed`).

## Pipeline integration

In `supabase/functions/scan/index.ts`, after `compute-metrics` and `rollup-intelligence` are dispatched (fire-and-forget), additionally dispatch `generate-recommendations`. Non-fatal: scan completion does not depend on it. Logs only; no user-visible error.

Note: rollup must finish before recommendations to use latest peer data. Two options:

- (a) Best-effort: recommendations may use yesterday's `global_intelligence`. Acceptable now; documented.
- (b) Add a 5s soft delay or chain via `await` inside the dispatcher. Plan picks **(a)** for simplicity and to keep scan latency unchanged.

## Future-proofing (no code now, just structure)

`execution_payload` is shaped to drive a later `execute-recommendation` worker:

```text
{
  "action": "generate_comparison_page",
  "generator": "lovable-ai/gemini-2.5-flash",
  "inputs": { "competitor_brands": [...], "topic_cluster_id": "...", "target_url_pattern": "/compare/..." },
  "expected_artifacts": [{ "type": "content_asset", "asset_type": "comparison_page" }],
  "measurement": { "metric": "RSS", "horizon_days": 14 }
}
```

The future loop reads this payload, calls a generator, writes to `content_assets`, and tracks impact in `recommendation_outcomes` (already exists).

## What this chunk does NOT do

- No UI changes. (Dashboard rewrite is Chunk #5.)
- No execution worker. (Future chunk.)
- No backfill for historical scans. (Chunk #6.)
- No new LLM calls — engine is deterministic; uses only data already in DB.

## Files

- `supabase/migrations/<ts>_recommendations_evidence.sql` — additive columns + index.
- `supabase/functions/_shared/recommendations.ts` — rule library + types + scoring.
- `supabase/functions/generate-recommendations/index.ts` — new edge function.
- `supabase/functions/scan/index.ts` — dispatch new function (fire-and-forget).
- `src/integrations/supabase/types.ts` — regenerated.

## Acceptance

- Running a scan inserts `recommendations` rows where every row has non-null `evidence`, `industry_benchmark`, `priority_score`, `why_this_matters`.
- Rows are returned by `ActionPlan.tsx` ordered by `priority_score` (component currently orders by `created_at`; UI work deferred to Chunk #5, but data is already correct).
- No recommendation appears when `peer_sample_size < 3`.
    
  Approved. Add evidence_urls to recommendation records and add recommendation_novelty_score (or equivalent suppression logic for repeated recommendations). Everything else looks good. Proceed with implementation.