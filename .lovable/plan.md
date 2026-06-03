# Phase 1, Chunk #4 — Anonymized Rollup Writer (the Moat)

## Goal

After every scan, write privacy-safe, aggregated citation intelligence into `global_intelligence` so the future Recommendation Engine and AI Visibility Index can answer industry-level questions like *"which asset types correlate with winning recommendations in SaaS CRM?"* — without ever storing a customer domain, prompt, content, or identifiable business data.

Per the user's explicit instruction: **asset-type intelligence is the moat**. We preserve `asset_type` as a first-class grouping dimension, not an aggregated-away attribute.

## Scope

1. Extend `global_intelligence` schema with asset-type + authority + position + frequency + temporal fields
2. Privacy trigger update to validate the new fields
3. New shared module: rollup grain + aggregation logic (pure, testable)
4. New edge function `rollup-intelligence` (called from `scan` after `compute-metrics`)
5. Integration hook in `scan/index.ts` (fire-and-forget, non-fatal)
6. No dashboard, no recommendation engine, no backfill in this chunk

## 1. Schema additions to `global_intelligence`

New columns:

- `asset_type text` — from Chunk #1's closed enum (comparison_page, listicle, reddit_thread, review_page, directory_listing, blog_article, news_article, forum_thread, landing_page, documentation_page, other)
- `authority_score smallint` — domain authority at observation time (0–100), from `citation_sources`
- `recommendation_position smallint` — avg position of the citation in the AI answer (1 = first, lower = better)
- `citation_frequency integer` — total citations rolled into this row (distinct from `observation_count`, which counts unique prompts)
- `first_observed_at timestamptz not null default now()`
- `last_observed_at timestamptz not null default now()`

Rollup grain (the unique key for upsert):

```
(industry_id, topic_cluster_id, engine, winning_brand, citation_domain,
 source_type, asset_type, prompt_template_hash, period_start)
```

This grain is intentional: it keeps asset_type as a separate dimension so queries like *"top 10 asset_types that win in industry X this month"* are a single GROUP BY — no de-normalization needed later.

Migration adds:

- New columns above
- `UNIQUE` constraint on the grain (for `ON CONFLICT … DO UPDATE`)
- Indexes: `(industry_id, asset_type)`, `(industry_id, source_type, asset_type)`, `(winning_brand, asset_type)`, `(last_observed_at)`
- Update `enforce_global_intelligence_privacy` trigger to:
  - Validate `asset_type` against the closed enum (or NULL)
  - Clamp `authority_score` to 0–100
  - Clamp `recommendation_position` to 1–50
  - Re-assert no URLs/emails leak into `winning_brand` (existing rule)

## 2. What gets written (and what does NOT)

For every classified citation from the scan, we derive an **anonymized observation**:


| Field                                    | Source                                                 | Notes                        |
| ---------------------------------------- | ------------------------------------------------------ | ---------------------------- |
| `industry_id`                            | scan's resolved industry                               | nullable if unresolved       |
| `topic_cluster_id`                       | scan_result's topic cluster                            | nullable                     |
| `engine`                                 | scan_result.engine                                     | required                     |
| `winning_brand`                          | normalized via `public.normalize_brand()`              | NULL if not a winning brand  |
| `citation_domain`                        | citation.domain (no path, no query)                    | required                     |
| `source_type`                            | citation.source_type                                   | from Chunk #1                |
| `asset_type`                             | citation.asset_type                                    | **new — the moat dimension** |
| `authority_score`                        | citation_sources.authority_score                       | snapshot                     |
| `recommendation_position`                | citation.position averaged per grain                   | smaller = better             |
| `prompt_template_hash`                   | sha256(normalized_prompt_template)                     | privacy-safe                 |
| `observation_count`                      | distinct prompts in this scan that produced this grain | &nbsp;                       |
| `citation_frequency`                     | total citations matching this grain                    | &nbsp;                       |
| `first_observed_at` / `last_observed_at` | now() on insert; last updated on upsert                | &nbsp;                       |
| `period_start` / `period_end`            | day-truncated bucket                                   | &nbsp;                       |


**Never written** (explicit privacy guarantees, repeated from architecture doc):

- Customer's own domain
- Raw prompts or prompt text
- User IDs, scan IDs, project IDs
- Uploaded content
- API keys
- Any field that would let an outsider reverse-engineer who ran the scan

The privacy trigger enforces these constraints at the DB layer so a buggy writer cannot accidentally leak data.

## 3. Prompt template hashing

`prompt_template_hash` must be **stable across scans and customers** so the moat compounds:

- Normalize prompt: lowercase, collapse whitespace, strip the customer's own brand name, strip URLs/emails/numbers
- Replace recognized brand mentions with `<BRAND>` placeholder
- `sha256(normalized)` → first 16 hex chars

Shared helper `hashPromptTemplate(prompt, ownBrand, knownBrands[])` in `_shared/intelligence.ts`, fully deterministic.

## 4. Rollup pipeline

New edge function `rollup-intelligence` (verify_jwt = false, internal):

- Input: `{ scanId }`
- Loads via service-role: scan + scan_results + citations + citation_sources + brand_observations + the scan's industry + topic_clusters
- For each `(scan_result, citation)` pair:
  - Build a grain tuple per the unique key above
  - Aggregate `observation_count`, `citation_frequency`, average `recommendation_position`
  - Determine `winning_brand` per grain: the brand the citation favored, normalized via `brand_detected` (Chunk #1) joined with `brand_observations` for confirmation; NULL if no clear winning brand
- Batch upsert into `global_intelligence` using `ON CONFLICT (<grain>) DO UPDATE SET`:
  - `observation_count = global_intelligence.observation_count + EXCLUDED.observation_count`
  - `citation_frequency = global_intelligence.citation_frequency + EXCLUDED.citation_frequency`
  - `recommendation_position = weighted_avg(prev, prev_count, new, new_count)`
  - `authority_score = max(prev, EXCLUDED)` (authority only grows in practice)
  - `last_observed_at = now()`
  - `first_observed_at` untouched
- Failures logged; never break the scan.

Shared helpers in `supabase/functions/_shared/intelligence.ts`:

- `buildGrainRows(scanContext, citations, brandObs)` → `GrainRow[]` (pure)
- `hashPromptTemplate(prompt, ownBrand, knownBrands)` → string (pure)
- `mergeWeightedPosition(prev, prevN, curr, currN)` → number (pure)

All pure, unit-testable; only the edge function touches Supabase.

## 5. Scan integration

In `scan/index.ts`, after `compute-metrics` is invoked, fire-and-forget invoke `rollup-intelligence`. Same fault model as `auto-optimize` and `compute-metrics` — non-fatal, background, logged on failure.

Ordering: `citations pipeline` → `compute-metrics` → `rollup-intelligence`. The rollup depends on classified citations (Chunk #1) being persisted, which they already are by the time it runs.

## 6. What this chunk does NOT do

- No recommendation engine (Chunk #3 will read this table)
- No dashboard surfaces (Chunk #5)
- No backfill of historic scans (Chunk #6 — will re-use the same rollup function with a `{scanIds: [...]}` batch input)
- No cross-scan competitor RSS yet (open question from Chunk #2 — lands when this dataset has enough volume)

## 7. Future queries this unlocks (validation of the design)

The user's explicit ask — *"which asset types correlate with winning recommendations in this industry?"* — becomes:

```sql
SELECT asset_type,
       SUM(citation_frequency) AS total_citations,
       SUM(observation_count)  AS unique_prompts,
       AVG(recommendation_position) AS avg_position,
       COUNT(DISTINCT winning_brand) AS winning_brand_diversity
FROM   public.global_intelligence
WHERE  industry_id = $1
  AND  winning_brand IS NOT NULL
  AND  last_observed_at > now() - interval '30 days'
GROUP  BY asset_type
ORDER  BY total_citations DESC;
```

Other queries this design supports out-of-the-box:

- *"Top source_types per engine for industry X"* — GROUP BY engine, source_type
- *"Which brands dominate comparison_pages vs reddit_threads in SaaS CRM?"* — GROUP BY asset_type, winning_brand
- *"Authority distribution by asset_type"* — AVG(authority_score) GROUP BY asset_type
- *"Asset-type momentum"* — compare period_start buckets

Because the grain keeps `asset_type` separate, none of these require a schema change.

## Technical details (engineer-facing)

- All writes go through service-role client; RLS already allows public SELECT and service INSERT
- Upsert uses Postgres `INSERT … ON CONFLICT (<grain>) DO UPDATE`; the unique constraint we add is the conflict target
- Weighted position merge: `(prev * prevN + curr * currN) / (prevN + currN)` rounded to nearest int
- `period_start` truncated to UTC day so the same scan run never spans buckets
- `prompt_template_hash` is 16 hex chars (collision risk negligible for industry-scoped queries; full sha256 is overkill and bloats indexes)
- Brand normalization reuses existing `public.normalize_brand()` SQL function for consistency with `brand_observations`
- Idempotency: re-running `rollup-intelligence` for the same `scanId` would double-count; we guard by tracking `rolled_up_at timestamptz` on the `scans` table and short-circuiting if set
- Batch size: upserts chunked at 500 rows per statement to stay under request limits

## Open question (low-risk)

For citations where Chunk #1 left `asset_type = 'other'` with low confidence, do we still write them to `global_intelligence`? Proposal: yes, because absence is also signal — but tag them so future queries can exclude them. Implemented by simply storing `asset_type = 'other'`; no extra column needed.  
Approved. Add classification_confidence to the rollup, preserve momentum calculations (or enough data to compute them later), and ensure winning_brand_diversity can be queried efficiently. Keep asset_type='other' in the dataset. Proceed with the build.

---

Approve and I'll build this chunk (one migration + one new edge function + one shared module + `scan/index.ts` hook).