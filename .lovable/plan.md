# Chunk #5 — Dashboard Rewrite: Recommendation Intelligence First

Reframes the dashboard from "visibility score reporter" to "recommendation intelligence platform." The default landing tab becomes **Recommendation Intelligence**; **Why Competitors Win** becomes the second tab and the hero feature. Metrics, history, and scans move into supporting roles.

## Information architecture

New tab order (replaces current 6 tabs in `src/pages/Dashboard.tsx`):

```text
1. Recommendations         ← default landing, prioritized actions with evidence
2. Why Competitors Win     ← hero view: asset-type intelligence + benchmarks
3. Metrics & Explainability ← RSS/CAG/TSD/CIS/COI with deltas and narratives
4. My Domains              ← existing SavedDomains
5. Scans                   ← QuickScan + ScanHistory + CreditUsage (collapsed)
6. AI Assistant            ← existing
```

`Action Plan` and `Auto-Fix Results` tabs are merged into the new Recommendations tab. `Competitors` is replaced by `Why Competitors Win`. Overview is removed — its widgets relocate.

## Tab 1 — Recommendations (landing)

New component `src/components/dashboard/RecommendationIntelligence.tsx`. Reads from the upgraded `recommendations` table (Chunk #3 columns).

Layout:

- **Header strip** — "X prioritized actions • projected impact +Y RSS pts" pulled from sum of `projected_metric_delta`. One filter chip row: `All / Quick Wins / High Impact / By Metric`.
- **Recommendation cards** (sorted by `priority_score desc`). Each card shows:
  - Title + `target_metric` chip (RSS/CAG/TSD) + difficulty badge + time estimate.
  - **Priority score** as a small numeric badge (e.g. `P 162`).
  - **Why this matters** paragraph (`why_this_matters` field) — always visible, no expansion needed.
  - **Industry benchmark row** — peer median vs user value vs gap, rendered as a tiny inline bar (`industry_benchmark` JSON).
  - **Top competitors strip** — 3 anonymized chips from `competitor_examples` with their value per asset_type.
  - **Evidence drawer** (collapsible) — `evidence_urls` listed as outbound links, plus raw `evidence` JSON key/values rendered as a definition list. "No recommendation without evidence" enforced visually — if a card has empty evidence the card itself isn't rendered.
  - **Recurrence note** — if `recurrence_count > 1`, show "Seen in N scans" + the novelty-decayed priority so users understand why it's not at the top anymore.
  - Actions: `Mark done` (existing toggle), `Generate fix` (only if `execution_payload.generator !== 'manual'`, wired to existing `audit-fix`/`auto-optimize` flows when applicable), `Snooze` (sets `status='snoozed'`).
- Empty state: prompts the user to run a scan; identical to current `ActionPlan` empty state but worded as "Run a scan to surface evidence-bound recommendations."
- Reuses `optimization_tasks` for the old auto-fix items via a small "Legacy tasks" disclosure at the bottom (so nothing the user already had disappears).

## Tab 2 — Why Competitors Win (hero)

New component `src/components/dashboard/WhyCompetitorsWin.tsx`. This is the moat made visible.

Three stacked sections:

1. **Asset-type breakdown** — bar chart per `asset_type` showing `peer_median` vs `user_value`, computed from the latest scan's recommendations' `industry_benchmark` payloads (already grain-aligned to industry). Bars are color-coded by gap severity. Clicking a bar filters the section below.
2. **Competitor leaderboard by asset type** — table of anonymized brands with columns: brand, asset_type, citation_frequency, avg authority_score, avg recommendation_position. Pulled live from `global_intelligence` filtered by the user's scan's `industry_id`/`topic_cluster_id` via a tiny edge function `peer-insights` (returns aggregated, anonymized data — no raw rows leak past RLS).
3. **Narrative summary** — pulled from `proprietary_metrics_cache.narrative` plus a generated sentence "Competitors lead you on: comparison_page (+12), reddit_thread (+8), review_page (+5)" derived client-side from the same benchmark deltas.

Key UX rule: every claim ("competitors lead by X") links to its evidence — either the rec card on Tab 1 or the leaderboard row.

## Tab 3 — Metrics & Explainability

New component `src/components/dashboard/MetricsExplain.tsx`. Replaces the old "Overview" score-first view.

- Five metric tiles: RSS, CAG, TSD, CIS, COI. Each tile shows current value, delta vs previous scan (from `proprietary_metrics_cache.deltas`), and confidence bar from `confidence_score`.
- Click a tile → drawer opens showing `*_breakdown` JSON rendered as factor list ("Reddit citations +12%", "Comparison pages +4", etc.) and the `narrative` string. This is the Chunk #2 explainability payload finally surfacing.
- Sample size shown as a small "n=…" footer per tile from `sample_size`.

## Tab 4 — My Domains

Unchanged. Existing `SavedDomains` component.

## Tab 5 — Scans

Combines `QuickScan` + `ScanHistory` + `CreditUsage` into a single tab so they stop competing with the recommendation surface. `UserProfile` header stays above the tabs.

## Tab 6 — AI Assistant

Unchanged.

## Files

- New: `src/components/dashboard/RecommendationIntelligence.tsx`
- New: `src/components/dashboard/RecommendationCard.tsx` (used by the above)
- New: `src/components/dashboard/WhyCompetitorsWin.tsx`
- New: `src/components/dashboard/MetricsExplain.tsx`
- New: `src/components/dashboard/AssetTypeBenchmarkChart.tsx` (small recharts wrapper used by tabs 2 + 3)
- New edge function: `supabase/functions/peer-insights/index.ts` — returns anonymized peer aggregates filtered by `scan_id`. `verify_jwt = false`, but validates the requesting user owns the scan via service-role read.
- Edited: `src/pages/Dashboard.tsx` — tab order, default tab, removed Overview/Action Plan/Competitors/Auto-Fix tabs.
- Edited: `src/components/dashboard/ActionPlan.tsx` — kept as fallback rendering for `optimization_tasks` only, embedded as the "Legacy tasks" disclosure inside Recommendations.

## Data dependencies (all already exist)

- `recommendations` — Chunk #3 columns: `priority_score`, `why_this_matters`, `industry_benchmark`, `competitor_examples`, `supporting_asset_types`, `evidence_urls`, `novelty_score`, `recurrence_count`, `execution_payload`, `target_metric`, `projected_metric_delta`.
- `proprietary_metrics_cache` — Chunk #2 columns: `rss/cag/tsd/cis_top/coi`, `*_breakdown`, `deltas`, `explanation`, `narrative`, `confidence_score`, `sample_size`.
- `global_intelligence` — Chunk #4 grain: `asset_type`, `authority_score`, `recommendation_position`, `citation_frequency`, `winning_brand` (already anonymized).
- `scans.industry_id` / `topic_cluster_id` — used as the join key throughout.

No new tables. No new migrations.

## What this chunk does NOT do

- No edits to scan engine, citations pipeline, metrics engine, recommendations engine, or rollup writer.
- No new content generation. The "Generate fix" button reuses existing `audit-fix`/`auto-optimize` edge functions only.
- No removal of `optimization_tasks` data; old tasks remain accessible via the Legacy disclosure.
- No backfill (that is Chunk #6).
- No design system changes — sticks to existing arcade-dark tokens (`bg-black`, `bg-gray-900`, `text-yellow-400`, `pt-32` page padding).

## Acceptance

- Loading `/dashboard` lands on **Recommendations** by default.
- Every visible recommendation card shows non-empty evidence (URLs or evidence JSON); cards without evidence are filtered out client-side as a safety net.
- **Why Competitors Win** renders an asset-type chart and a competitor leaderboard for any scan whose `industry_id` is set and has ≥3 peer brands in `global_intelligence`.
- Metric tiles open a drawer with the breakdown narrative — never a raw number without explanation.
- All existing routes/buttons that linked to `?tab=action-plan`, `?tab=competitors`, `?tab=auto-fix` continue to work (redirected to the new tabs).
    
    
  Approved. Build the dashboard around Recommendation Intelligence, not visibility scores. Recommendation Intelligence should be the landing page. Why Competitors Win should be the second major view and treated as the hero feature. Metrics should support decisions rather than lead the experience. Use the explainability data from Chunk #2 and recommendation evidence from Chunk #3 throughout the UI