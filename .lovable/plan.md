## What you're asking for (and what's currently wrong)

You want the **homepage domain scan** popup (the "AI Visibility Results" modal in your screenshots) to show **what's broken** on the scanned site, with a **Fix it** button next to each issue. Clicking any Fix button as a guest should send the user to signup, then come back and open the fix.

Right now that lives only on `/tools/ai-content-auditor` (a separate page). The main homepage scan modal (`ScanResultsModal.tsx`) only shows visibility scores + per-prompt mentions/citations — **no issues list, no Fix buttons**. That's the gap.

## Plan — add an "Issues to Fix" section to `ScanResultsModal`

### 1. Derive issues from the scan data already returned

The scan modal already has `scanData.results` (Gemini/Perplexity/Search mentions + citations + competitors) and `scanData.score`. Translate those into actionable AI-visibility issues — no extra API call needed for the list itself:

- **Not cited on Gemini** (if any `geminiCited === false`) → fix: `faq_schema` + `answer_style`
- **Not cited on Perplexity** (if any `perplexityCited === false`) → fix: `article_schema`
- **Not mentioned on ChatGPT/Search** (if any `mentioned === false`) → fix: `content_expand` + `internal_links`
- **Competitors outranking you** (if `geminiCompetitors`/`perplexityCompetitors` non-empty) → fix: `answer_style` (citability content)
- **Low overall score (<50)** → fix: `meta_title` + `meta_description`
- **No citations anywhere** (all `cited`/`geminiCited`/`perplexityCited` false) → fix: `org_schema`

Each issue: `{ id, severity (high/med/low), title, evidence (e.g. "Cited in 0/3 Perplexity responses"), fixType, category }`.

### 2. Render an "Issues to Fix" card list in the modal

New section in `ScanResultsModal.tsx`, placed **above** the per-prompt detailed results (so it's visible immediately after the score):

```text
┌─ Issues Detected (4) ────────────────────────┐
│  [HIGH] Not cited on Perplexity              │
│  Cited in 0/3 Perplexity responses           │
│                                  [ Fix it → ]│
├──────────────────────────────────────────────┤
│  [MED] Competitors outranking you            │
│  qbstores.com + 4 others mentioned instead   │
│                                  [ Fix it → ]│
└──────────────────────────────────────────────┘
```

Styling matches existing arcade theme (`bg-gray-800`, `border-gray-700`, yellow-400 accents, severity badges in red/yellow/blue).

**Guests** see all issue cards (titles + evidence visible — not locked, so they understand the value), but the **Fix it button** is the gate.

### 3. Wire the Fix it button → signup gate

On click:
- **If guest** (no session): persist scan context to `localStorage` (`pendingFix = { domain, fixType, issueId, scanId }`), then `navigate('/auth?mode=signup&redirect=/dashboard?fix=<fixType>&domain=<domain>')`. Toast: "Sign up free to apply this fix."
- **If signed in**: call existing `supabase.functions.invoke('audit-fix', { body: { url: domain, fixType, pageMeta: { title: domain } } })` and show the result in a second nested Dialog (Copy button + Save to Action Plan via `optimization_tasks` insert).

### 4. Post-signup bounce-back

In `Dashboard.tsx` (or wherever `redirect` lands), on mount check for `pendingFix` in localStorage. If present + user authed, auto-open the same Fix dialog with the generated content, then clear localStorage. (`Auth.tsx` already forwards `redirect` from earlier work.)

### 5. Files touched

- **`src/components/ScanResultsModal.tsx`** — add `deriveIssues(scanData)` helper, render Issues section, add Fix dialog state, signup-gate logic.
- **`src/pages/Dashboard.tsx`** — small `useEffect` to consume `localStorage.pendingFix` on mount and auto-open the fix.
- **No backend changes** — reuses existing `audit-fix` edge function.

### Out of scope
- HTML scraping of the user's site (homepage scan is prompt-based, not page-based — issues come from prompt results, not from parsing their HTML). If you want page-level issues (missing meta, no H1, etc.) on the homepage scan too, that's a bigger change — say the word and I'll add a Firecrawl call to the `scan` edge function.
- Removing the standalone `/tools/ai-content-auditor` page — keeping it as a dedicated URL-input tool.

## Part 2 — clarify the blog post question

The "50 SaaS Brands AI Visibility" post is **already listed** on `/blog` and in `sitemap.xml` from the previous turn. If it's still not showing for you, tell me what you see at `/blog` and I'll investigate — no plan needed for that yet.
