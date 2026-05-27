# Plan: Domain Detail Dashboard (GSC-style command center)

Right now `/dashboard` shows tabs (Overview, My Domains, Action Plan, Competitors, Auto-Fix, AI Assistant) but the user has to hop between them to understand a single domain. We'll add a **per-domain detail view** that consolidates everything a brand owner needs for AI visibility — modeled after Google Search Console's property dashboard.

## What the user gets

When a user clicks a saved domain (or any domain in scan history), they land on a dedicated page at `/dashboard/domain/:domain` showing **one screen with everything for that brand**:

1. **Header strip** — domain, latest visibility score (big number), score delta vs last week, last scan time, "Rescan now" button.
2. **Weekly tracking chart** — line chart of the visibility score over the last 7 / 30 / 90 days (toggle), pulled from `scans` table filtered by `project_domain` + `user_id`. Reuse `ScoreTrend` styling.
3. **Per-engine breakdown** — 3 mini-cards (Gemini / Perplexity / Web Search) showing mention rate and citation count for the latest scan.
4. **Issues to Fix** — the same `deriveIssues` list already used in `ScanResultsModal`, rendered as a checklist with severity badges and a **"Fix it"** button per issue. Clicking calls `audit-fix` and shows the generated content/schema in a dialog with Copy + "Save to Action Plan". Completed issues (matching `optimization_tasks.status = 'completed'`) render with a strikethrough + green check.
5. **Schema health card** — checks the live homepage (via existing `audit-content` edge function) for Article, FAQ, Organization, and Breadcrumb JSON-LD. Each row shows ✓ present / ✗ missing with a one-click "Generate schema" button that pipes into `generate-schema`.
6. **Ranking opportunities** — prompts where competitors ranked but user didn't, pulled from latest `scan_results`. Each row shows the prompt, competitor list, and "Beat them" button (opens the existing competitor strategy panel).
7. **Action Plan slice** — filtered `optimization_tasks` for this domain only, with status toggles.
8. **Competitor snapshot** — top 5 competitors that appeared most often across this domain's scans, with appearance counts.

## Navigation

- `My Domains` cards become clickable → route to `/dashboard/domain/:domain`.
- `ScanHistory` rows get a "View domain" link.
- Breadcrumb back to `/dashboard`.

## Technical details

**New file**: `src/pages/DomainDetail.tsx` (wrapped in `AuthGuard`, uses `useParams` for domain).

**New components** (under `src/components/dashboard/domain/`):
- `DomainHeader.tsx` — score + delta + rescan
- `DomainTrendChart.tsx` — recharts line chart with 7/30/90 toggle
- `EngineBreakdown.tsx` — 3 mini-cards from latest `scan_results`
- `DomainIssues.tsx` — reuses `deriveIssues` helper extracted from `ScanResultsModal` into `src/utils/deriveIssues.ts`, renders Fix buttons wired to `audit-fix`
- `SchemaHealth.tsx` — calls `audit-content` on mount, shows schema checklist
- `DomainOpportunities.tsx` — missed-prompt list (logic already exists in current Overview's Ranking Opportunities — extract to shared component)
- `DomainTasks.tsx` — filtered `optimization_tasks` list with status toggle
- `DomainCompetitors.tsx` — aggregated competitor counts

**Refactor**:
- Extract `deriveIssues` from `ScanResultsModal.tsx` into `src/utils/deriveIssues.ts` so both the modal and the detail page share it.
- Extract Ranking Opportunities widget from `Dashboard.tsx` Overview into `src/components/dashboard/RankingOpportunities.tsx` reused on both Overview and Domain Detail.

**Routing**: add `<Route path="/dashboard/domain/:domain" element={<DomainDetail />} />` in `src/App.tsx`.

**Data queries** (all client-side via supabase-js, no migrations needed):
```
scans:        select * where user_id=auth.uid() and project_domain=:domain order by created_at desc
scan_results: select * where scan_id in (latest scan id)
tasks:        select * from optimization_tasks where user_id=auth.uid() and scan_id in (...)
schema check: supabase.functions.invoke('audit-content', { body: { url } })
fix:          supabase.functions.invoke('audit-fix', { body: { url, fixType, pageMeta } })
```

**No DB migration required** — all needed tables (`scans`, `scan_results`, `optimization_tasks`, `saved_domains`) and edge functions (`audit-content`, `audit-fix`, `generate-schema`) already exist.

## Out of scope (this round)
- Email/Slack weekly digest exports
- PDF export of the domain dashboard
- Editing schema directly on the user's live site (we only generate copy-pasteable snippets)

After approval I'll build it in this order: utils extraction → routing → page shell → header + trend → issues + schema → opportunities + tasks + competitors → wire "My Domains" cards to the new route.
