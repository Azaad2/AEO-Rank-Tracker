# QA Audit Plan — 7 AI Tools

Goal: audit reliability, correctness, performance, and conversion readiness across the AI tool surface. No new features — only fixes, instrumentation gaps, and polish.

## Scope (tools)

1. AI Visibility Checker (`src/pages/Index.tsx` + `scan` edge fn)
2. LLM Rank Tracker (`src/pages/tools/LLMRankTracker.tsx`)
3. AI Keyword Analyzer (`src/pages/tools/KeywordAnalyzer.tsx` + `analyze-keywords`)
4. AI Overview Tracker (`src/pages/tools/AIOverviewsTracker.tsx`)
5. Competitor Analyzer (`src/pages/tools/CompetitorAnalyzer.tsx` + `analyze-competitors`)
6. Citation Intelligence (`src/components/dashboard/CitationIntelligenceTab.tsx`)
7. Recommendation Intelligence (`src/components/dashboard/RecommendationIntelligence.tsx`)

## Phase 1 — Investigation (read-only)

For each tool, gather:

- Page component + any child components it depends on
- Edge function it invokes (input validation, error returns, CORS)
- Loading / error / empty state branches
- Where (if anywhere) `logScanError`, `trackEvent`, and `account_created`-style analytics fire
- Console/network behavior via Playwright walkthrough on localhost (valid input, empty input, invalid domain, forced API failure)
- Mobile viewport screenshot (375px) for layout/responsiveness

Cross-cutting checks:

- `ErrorBoundary` coverage around each tool's main render tree
- `scan_errors` insert path on failure (currently only wired in `Index.tsx` handleScan)
- Analytics event names actually emitted vs the funnel the dashboard expects (`scan_started`, `scan_completed`, `scan_failed`, `results_viewed`, `signup_cta_clicked`, `account_created`, `upgrade_cta_clicked`)
- React warnings: keys, controlled/uncontrolled inputs, `useEffect` deps, unmount race conditions on async `setState`
- Duplicate logic candidates: per-tool ad-hoc fetch wrappers vs a shared invoker; repeated limit checks (see `QuickScan` pattern)

## Phase 2 — QA Report (deliverable)

Markdown report per tool with:

```text
Tool: <name>
Readiness: <0–100>%
Critical / Medium / Low issues
Perf notes
UX notes
Required fixes (file:line)
```

Plus a cross-cutting section (shared infra gaps: error logging, analytics, ErrorBoundary, retry UX).

## Phase 3 — Fixes (only after report)

Apply, in priority order, only what the report flags. Typical expected edits:

1. Wrap each tool page in `<ErrorBoundary component="<ToolName>">`.
2. Add `try/catch` → `logScanError({ component, domain })` to each tool's submit handler that currently only `toast`s.
3. Add Retry button to error states that currently dead-end (e.g. `AIAnswerGenerator` only toasts).
4. Standardize analytics: emit `tool_scan_started` / `tool_scan_completed` / `tool_scan_failed` with `{ tool, input_hash }` via `useActivityTracking`.
5. Replace generic `Loader2` blocks with `Skeleton` result placeholders where a result card layout is known.
6. Cancel-on-unmount guard (`AbortController` / mounted ref) on long `supabase.functions.invoke` calls to silence "setState on unmounted" warnings.
7. Remove dead code surfaced during review (unused imports, unreachable branches, duplicate limit-check logic).

No new features, no schema changes, no copy rewrites beyond error/retry microcopy.

## Validation

- `tsgo` typecheck after each batch
- Playwright re-run of the same valid/invalid/empty/forced-failure matrix per tool, capture screenshots
- Verify a row lands in `scan_errors` for each forced failure
- Verify funnel events appear in `user_activity` for a happy-path run

## Out of scope

- New tools, redesigns, copy overhauls
- Backend schema changes
- Pricing / gating logic changes
