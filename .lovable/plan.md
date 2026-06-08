# Unified Post-Scan Experience

Goal: one scan → one coherent Recommendation Intelligence report. Public visitors see a preview + signup gate; signed-up users land directly in the Recommendations dashboard with their scan already attached.

---

## 1. Public scan flow (`src/pages/Index.tsx`)

**Remove the legacy modal entirely.**

- Delete the `ScanResultsModal` import, `<ScanResultsModal />` render, and `showResultsModal` / `setShowResultsModal` state.
- Remove `setShowResultsModal(true)` after scan completion (line ~303). Results render inline only.
- Remove the now-unused `EmailCaptureModal` flow for unlocking (modal-based unlock paths). Keep the component file untouched; just stop opening it.

**Rebuild the public results block (the `{scanData && (() => { ... })()}` section, lines ~919-1194) as a single unified preview, in this order:**

1. **Opportunity Summary hero** (new — primary moment):
  - Headline: `You appeared in {mentionedCount}/{total} prompts`
  - Sub: `{topComp.name} appeared in {topComp.count}/{total} prompts` (only if a top competitor exists)
  - Two chips: `Top Gap: {derived gap label}` and `Top Opportunity: {derived recommendation label}` (derive from existing `compCounts` + `topOppResult` logic already in the file).
2. **Why Competitors Win — one insight** (preview): one sentence naming the top competitor and the asset class they win on (comparison pages / reviews / citations), derived from `topCitedDomains`.
3. **Top 3 Opportunities** (preview): first three gap prompts as compact cards with a one-line action each (reuse the missing-prompt + competitor data already computed).
4. **Small Visibility Score chip** (secondary): inline `Score: {score}/100` pill, not a hero card.
5. **Locked premium sections** (visual blur using existing `LockedOverlay`): stacked teasers for
  - Full Why Competitors Win
  - Full Recommendation Intelligence
  - Industry Benchmark
  - Citation Sources
  - Competitor Asset Breakdown
  - Full Action Plan
6. **Single CTA card**: `Create Free Account to Unlock Full Report` → `/auth?redirect=/dashboard?tab=recommendations&scanId={scanId}`. Keep the dynamic `Let's beat {topComp}` sub-label.

For signed-in users on `/` (rare path), skip the gate and link them straight to `/dashboard?tab=recommendations&scanId={scanId}` instead of re-rendering `IndustryBenchmarkStrip` / `WhyCompetitorsWinPreview` / `ImprovementRoadmap` / `OptimizationHub` inline (those now live in the dashboard).

**Persist scanId across signup**: when a guest scan completes, write `localStorage.setItem('pendingScanId', scanId)` so the dashboard can claim/open it after auth.

## 2. Signup handoff

- `src/pages/Auth.tsx` (or the existing post-auth redirect logic): if `pendingScanId` exists in localStorage after successful signup/login, redirect to `/dashboard?tab=recommendations&scanId={id}` (instead of the default `/dashboard`).
- `src/pages/Dashboard.tsx`: on mount, if `?scanId=` is present and the scan in `scans` table has `user_id IS NULL`, call a small `update` to set `user_id = auth.uid()` (claim it). Then clear `localStorage.pendingScanId`. Default the tab to `recommendations` (already the default — just make sure `?tab=recommendations` is honored, which it is).

## 3. Dashboard navigation (`src/pages/Dashboard.tsx`)

Reorder the primary tabs to match the new positioning:

```text
Recommendations | Why Competitors Win | Industry Benchmark | Citation Intelligence | AI Recommendation Breakdown | Metrics
```

- **Recommendations** → existing `<RecommendationIntelligence />` (unchanged).
- **Why Competitors Win** → existing `<WhyCompetitorsWin />` (unchanged).
- **Industry Benchmark** (new tab): render `<IndustryBenchmarkStrip />` plus a list of how the user's latest scan compares (reuse latest `scans` row).
- **Citation Intelligence** (new tab): pull from `citation_sources` / `citations` tables for the user's scans — grouped by source domain with counts. Simple table, no new edge functions.
- **AI Recommendation Breakdown** (new tab): the per-prompt collapsible block currently inline in `Index.tsx` (lines ~1069-1122), moved to a small component that loads from `scan_results` for the latest scan.
- **Metrics** → existing `<MetricsExplain />` (unchanged).

**Move to a "Legacy" secondary area** (a `<Collapsible>` below the tabs, or a single overflow tab `More ▾`):

- Issues Detected
- Visibility Improvement Roadmap (`ImprovementRoadmap`)
- Optimization Plan (`OptimizationHub`)
- My Domains, Scans, AI Assistant stay where they are (in the overflow `More ▾`).

Update the legacy `tabParam` redirect map so old links (`?tab=auto-fix`, etc.) still resolve.

## 4. Cleanup

- Remove unused imports in `Index.tsx` once the modal and inline gated blocks are gone: `ScanResultsModal`, `IndustryBenchmarkStrip`, `WhyCompetitorsWinPreview`, `ImprovementRoadmap`, `OptimizationHub`, `LockedOverlay` stays (used in blurred teasers), `EmailCaptureModal` stays only if used elsewhere — drop if not.
- Leave `ScanResultsModal.tsx` and `EmailCaptureModal.tsx` files in place (not deleted) to avoid breaking unrelated routes; just stop importing them in `Index.tsx`.

## Technical notes

- All changes are frontend except a one-line `update` on `scans` to claim the guest scan post-signup (uses existing RLS — the user can update their own scan once `user_id` is null and they're authenticated; verify the RLS policy allows `user_id IS NULL → set user_id = auth.uid()`. If not, add a small `claim-scan` edge function or migration to allow it).
- No changes to the `scan` edge function, scoring, or recommendation generation.
- No new dependencies.

## Out of scope

- Redesigning `RecommendationIntelligence` cards.
- Changing scoring weights or recommendation logic.
- Email/PDF export flows (kept as-is inside the dashboard).
- Landing page hero, How AI Chooses Brands, benchmark teaser (already shipped).