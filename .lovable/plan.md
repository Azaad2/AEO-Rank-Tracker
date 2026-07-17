## Why the dashboard is blank

`src/components/dashboard/MetricsExplain.tsx` loads scans with `created_at >= now() - 7 days` by default. Confirmed against the database: the signed-in user's most recent scan is older than 7 days, so:

- `scans` query returns 0 rows → `scanIds` is empty
- No `scan_results`, no `citations`, no `proprietary_metrics_cache` → every derived value collapses to 0
- The KPI deltas (`+8%`, `+18%`, `+22%`, `-0.12`, `+4`) are **hard-coded literals** in the JSX, so they still render on top of the zeros and look like fake data

Nothing is broken in the backend — the tab is simply asking "what happened in the last 7 days?" when the answer is "nothing".

## What to change (presentation layer only, no backend changes)

### 1. Smarter data window
- Keep the `7D / 30D / 90D` selector, but if the selected window returns **0 scans**, automatically fall back to the user's most recent scan (and up to the prior one for comparison) and show a small notice: *"No scans in the last 7 days — showing your latest scan from Jul 9."*
- Add a "All time" pill next to `7D / 30D / 90D` so users can always see their real data.

### 2. Real deltas instead of hard-coded numbers
Replace the literal `delta={8} / 18 / 22 / -0.12 / 4` on the five `<Kpi>` cards with values computed from the **previous scan** already fetched into `prevMetrics` (and, for visibility/prompts/mentions, from a second query bounded to the prior equivalent window). When there is no prior data point, hide the delta line entirely instead of showing a fake `+8%`.

### 3. Honest empty state
When the user genuinely has no scans at all, replace the KPI grid + charts with a single empty-state card:
- Headline: "No scan data yet"
- Sub: "Run your first scan to see your AI visibility metrics here."
- CTA button linking to the Quick Scan tab.

### 4. Sparklines
Today `sparks` fabricates a sine-wave series from a seed when there's no real history. Change it to:
- Use the real `dailyScore` series when available.
- When the series is empty or flat, render a flat baseline (or hide the sparkline) rather than a fake wavy curve.

### 5. Loading vs empty
Right now `loading=false` + empty data drops the user straight into the zero grid. Make sure the empty-state card above wins over the KPI grid whenever `scanIds.length === 0` AND the fallback in step 1 also returns nothing.

## Files touched
- `src/components/dashboard/MetricsExplain.tsx` — all changes live here. No schema, edge function, or query-shape changes.

## Out of scope
- No changes to `scans`, `scan_results`, `citations`, or `proprietary_metrics_cache`.
- No changes to how metrics are computed by `compute-metrics`.
- No new tables, RLS, or edge functions.

## Verification
- Signed-in user with only older scans → sees "showing your latest scan from …" banner + real numbers from that scan, no fake deltas.
- User with zero scans → sees the empty-state card with the Quick Scan CTA.
- User with fresh scans in the last 7 days → sees real values and real deltas vs. the previous scan.
