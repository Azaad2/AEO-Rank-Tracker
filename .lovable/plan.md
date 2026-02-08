

# Fix Dashboard Issues: Credits, Action Plan, Header, and Competitor Strategy

## Issue 1: Credit Usage Not Updating After Scan

**Root Cause:** The scan edge function (`supabase/functions/scan/index.ts`) saves the scan to the database but never increments `prompts_used` or `scans_used` in the `subscriptions` table. The QuickScan component also doesn't call any usage increment after a successful scan.

**Fix:**
- Update the scan edge function to increment usage in the `subscriptions` table after a successful scan (when `userId` is provided)
- Add the increment logic directly in the edge function using the service role client:
  - Fetch the user's subscription by `user_id`
  - Update `prompts_used += number_of_prompts` and `scans_used += 1`
- Also refresh the dashboard data after QuickScan completes by passing a callback from `DashboardContent` to `QuickScan`

## Issue 2: Action Plan Not Auto-Generating After Scan

**Root Cause:** The `ActionPlan` component reads from `optimization_tasks` table, but nothing ever inserts tasks into it. The scan edge function creates scan results but never generates optimization tasks.

**Fix:**
- After the scan completes and results are saved, add logic in the scan edge function to auto-generate optimization tasks based on the scan results:
  - If brand is not mentioned by Gemini: create a "high" priority task like "Improve content structure for AI citability" with link to `/tools/content-auditor`
  - If brand is not cited: create a "high" priority task like "Add FAQ schema markup" with link to `/tools/schema-generator`
  - If competitors are found: create a "medium" priority task to analyze competitors with link to `/tools/competitor-analyzer`
  - If score is below 40: create tasks for SEO title optimization, meta description improvements
  - If no Perplexity citations: create task for citation-building content
- Clear previous pending tasks for the same user before inserting new ones (to avoid duplicates)

## Issue 3: Sticky Header Obscuring Dashboard Content

**Root Cause:** The header is `fixed` with `h-14` (56px height) and the Dashboard page uses `pt-24` (96px top padding) which should be enough, but the `Press Start 2P` font with its unique rendering plus the header's background may clip the title. The screenshot shows the "Dashboard" title is hidden behind the header.

**Fix:**
- Increase the top padding on the Dashboard page from `pt-24` to `pt-28` or `pt-32`
- Check all other pages that use the Header component and ensure they have sufficient top padding
- Pages to check and fix: Dashboard, About, Contact, Analytics, Blog, Pricing, Tools, Integrations, Privacy, Terms

## Issue 4: Competitor "Beat" Button Should Show Strategy Instead of Linking to Tool

**Root Cause:** The `CompetitorWatch` component's "Beat" button is a simple `Link` to `/tools/competitor-analyzer?competitor=...`. The user wants an inline strategy display instead.

**Fix:**
- Replace the Link/navigate behavior with an expandable strategy panel
- When user clicks "Beat", call the existing `analyze-competitors` edge function (or create a new `beat-competitor` function) to generate a strategy
- Display the strategy inline below the competitor row, showing:
  - Key factors making the competitor rank (extracted from scan data)
  - Specific actionable steps the user can take
  - Links to relevant tools for each step
- Use a loading state while the strategy is being generated
- Cache the strategy so clicking "Beat" again doesn't re-fetch

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/scan/index.ts` | Add subscription usage increment + auto-generate optimization tasks after scan |
| `src/components/dashboard/QuickScan.tsx` | Accept `onScanComplete` callback to refresh dashboard data |
| `src/pages/Dashboard.tsx` | Pass refresh callback to QuickScan, increase `pt-24` to `pt-32` |
| `src/components/dashboard/CompetitorWatch.tsx` | Replace "Beat" link with expandable inline strategy panel using AI |
| `src/pages/About.tsx` | Fix top padding |
| `src/pages/Contact.tsx` | Fix top padding |
| `src/pages/Analytics.tsx` | Fix top padding |
| `src/pages/Blog.tsx` | Fix top padding |
| `src/pages/Pricing.tsx` | Fix top padding |
| `src/pages/Tools.tsx` | Fix top padding |
| `src/pages/Integrations.tsx` | Fix top padding |
| `src/pages/Privacy.tsx` | Fix top padding |
| `src/pages/Terms.tsx` | Fix top padding |

### Scan Edge Function - New Logic After Saving Results

```text
After scan results are saved:
1. If userId is provided:
   a. Fetch subscription WHERE user_id = userId
   b. Increment: prompts_used += prompts.length, scans_used += 1
   c. Delete existing pending optimization_tasks for this user
   d. Generate new tasks based on results:
      - Score < 40 → "Fix Now" tasks for content/SEO basics
      - Not mentioned by Gemini → "Fix Now" task for AI visibility
      - Not cited → "Improve Soon" task for schema/structured data
      - Competitors found → "Nice to Have" task for competitor analysis
```

### Competitor Strategy Panel Behavior

```text
User clicks "Beat" on competitor row:
  → Show loading spinner
  → Call edge function with competitor name + user's domain + scan context
  → Display expandable panel with:
     - "Why they rank" section (based on scan data analysis)
     - "How to beat them" section (actionable steps)
     - Quick action buttons linking to specific tools
  → Cache result to avoid repeat API calls
```
