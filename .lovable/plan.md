## Dashboard UX Redesign Plan

Goal: turn the flat 9-tab dashboard into a focused workspace that works for both first-time free users (guided onboarding) and returning paid users (fast access to trends + actions).

### Problems being fixed

1. Header cuts off the "Dashboard" title (pt-32 insufficient at some viewports).
2. 9 sibling tabs = decision paralysis, no hierarchy between "actions" and "insights".
3. No first-run guidance; empty states are silent.
4. Jargon labels ("Prompt Diagnostics", "Citation Intelligence") sound internal.
5. Core action (Scan) is buried at position 8.
6. AI Assistant empty state has no visible suggested prompts above the fold.

---

### New layout: Sidebar shell

```text
┌──────────────────────────────────────────────────────────────┐
│ Top bar: logo · trigger · domain switcher · plan · avatar    │
├──────────┬───────────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN WORKSPACE                                   │
│          │                                                   │
│ HOME     │  [Getting started checklist — dismissible]        │
│  Home    │                                                   │
│          │  KPI strip: Visibility · Trend · Citations · Rank │
│ SCAN     │                                                   │
│  New scan│  Primary panel (contextual to sidebar selection)  │
│  History │                                                   │
│          │                                                   │
│ INSIGHTS │                                                   │
│  Recos   │                                                   │
│  Compete │                                                   │
│  Bench   │                                                   │
│  Cites   │                                                   │
│  Prompts │                                                   │
│  Metrics │                                                   │
│          │                                                   │
│ TOOLS    │                                                   │
│  AI Chat │                                                   │
│  Domains │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

- Sidebar uses shadcn `Sidebar` with `collapsible="icon"` (narrow icon rail when collapsed, never disappears).
- `SidebarTrigger` lives in the top bar so it's always visible.
- Active route highlighted; groups stay expanded when their child is active.

### Information architecture (9 tabs → 4 groups + Home)

| Group | Items | Renamed from |
|---|---|---|
| Home | Overview | (new) |
| Scan | New scan, Scan history | Scans |
| Insights | Recommendations, Competitors, Benchmark, Citations, Prompts, Metrics | Recommendations, Why Competitors Win, Industry Benchmark, Citation Intelligence, Prompt Diagnostics, Metrics |
| Tools | AI Assistant, Domains | AI Assistant, Domains |

Renames prioritize user goals over feature names ("Competitors" > "Why Competitors Win").

### Home overview (new)

Landing panel for both audiences. Bento-style cards:
- **First-time users**: Getting Started checklist takes the top slot; other cards show empty states with primary CTAs.
- **Returning users**: Checklist auto-collapses once complete; cards populate with real data.

Cards:
1. Latest visibility score + 7-day trend spark
2. Top recommendation (single actionable card)
3. Closest competitor gap
4. Recent citations feed (3 rows)
5. Quick action: "Run scan" input inline

### Guided onboarding checklist

Persistent card at top of Home until dismissed or 100% complete:

- [ ] Add your domain
- [ ] Run your first AI visibility scan
- [ ] Add 1–3 competitors
- [ ] Review your top recommendation
- [ ] Explore the AI Assistant

Progress bar; each item deep-links to the right sidebar item. Dismiss state stored in `localStorage` keyed by user id; re-openable from a help menu.

### Empty states

Every Insights panel gets a real empty state instead of a blank tab:
- Icon + one-line explanation + primary CTA that routes to Scan.
- AI Assistant panel: 4 suggested prompt chips visible immediately, no scroll needed.

### Header / layout fixes

- Replace `pt-32` page padding with proper flex shell: sticky top bar (`h-14`) + `flex-1` main; no manual top padding needed inside routes.
- Title "Dashboard" moves into the top bar next to the sidebar trigger, freeing vertical space.

### Responsive

- Desktop (≥1024px): sidebar expanded by default.
- Tablet: sidebar collapsed to icon rail.
- Mobile: sidebar becomes off-canvas sheet, triggered from top bar; KPI strip stacks; bento becomes single column.

### Routing

- Keep `/dashboard` as the entry route.
- Use `?tab=` param for sidebar selection (preserves existing deep-link behavior for `tab=recommendations`, `tab=ai-assistant`, etc.). Add legacy redirect map so old links still work.
- Add `?tab=home` as new default.

---

### Technical notes

- New files:
  - `src/components/dashboard/DashboardSidebar.tsx` — the sidebar (Sidebar + groups above).
  - `src/components/dashboard/DashboardShell.tsx` — SidebarProvider + top bar + Outlet-equivalent.
  - `src/components/dashboard/HomeOverview.tsx` — bento home panel.
  - `src/components/dashboard/OnboardingChecklist.tsx` — dismissible checklist with progress.
  - `src/components/dashboard/EmptyState.tsx` — shared empty-state primitive.
- Rewrite `src/pages/Dashboard.tsx` to use the shell; keep `DashboardContent` data-fetching logic; render the active panel based on `?tab=`.
- Move `UserProfile` info (email, plan, upgrade button) into sidebar footer + top-bar avatar menu.
- Add legacy tab-param redirect map (existing map in `Dashboard.tsx` is extended, not replaced).
- All colors via existing arcade tokens: `bg-black`, `bg-gray-900`, `border-gray-800`, `text-yellow-400`. No hardcoded values changed; shadcn Sidebar styled via wrapper classes.
- Onboarding progress derived from real data (has domain? has scan? has competitors set?) rather than local flags, so re-installs/re-logins don't reset it. Dismissal only hides the card.
- No backend/schema changes. No new tables. No changes to Edge Functions.
- Typecheck + build after each major file addition.

### Out of scope (call out explicitly)

- Redesigning individual panels' internals (RecommendationIntelligence, WhyCompetitorsWin, etc.) — reused as-is.
- Any changes to scan engine, pricing, auth, or Edge Functions.
- Renaming/removing dashboard features — this is IA + shell, not feature cuts.

### Verification

- Typecheck + build pass.
- Playwright: visit `/dashboard`, screenshot desktop (1280) and mobile (390) viewports, verify sidebar renders, checklist visible for empty account, deep-link `?tab=ai-assistant` still lands correctly.

After you approve, I'll implement in this order: shell + sidebar → Home overview + checklist → empty states + label renames → legacy redirects → verification screenshots.