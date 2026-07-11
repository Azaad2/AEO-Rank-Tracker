Replace the generic "Why they're winning" bullets on each competitor card with a real, evidence-backed panel built from the data we already store in `citations` and `scan_results`. No new intelligence — we surface what the scan engine already found.

## What the user will see (per competitor, e.g. hubspot.com)

**Header (unchanged)**: favicon, name, #N threat, "AI recommends 33× more often (33% vs 0%)".

**New: AI Evidence grid — 4 tiles, side-by-side with your numbers**

```
Comparison pages   Review-site citations   Educational pages   Prompt coverage
HubSpot   18       HubSpot   9              HubSpot   247       HubSpot   31%
You        2       You       1              You        13       You        4%
```

Every number is a real count from `citations` for that competitor domain vs the user's domain, scoped to the user's scans.

**New: "Where they're cited" — trusted-source chips**
Real logos/names of the top publisher/review domains that cite the competitor (G2, Capterra, Forbes, HubSpot Blog, …), pulled from `citations.domain` where `source_type` is review/publisher and `cites_brand` matches the competitor. Cap at 8, with a "+N more".

**New: "Topics they own" — cluster chips**
Distinct `prompt` values grouped into topic tags (using the prompt words themselves — no LLM). Shown as "184 pages about CRM · Marketing Automation · Lead Generation", where the count is distinct URLs from citations and the tags are the top-N prompt keywords they win.

**New: "Their top winning pages" list (collapsed by default, opens with "Show me how to beat them")**
Real titles + URLs from `citations` where the competitor is cited, sorted by frequency. Each row shows: `title` · `asset_type` badge (Comparison / Alternative / Guide / Pricing / Review).

**New: "You're missing" gap list + Generate buttons**
Cross-reference the competitor's winning `asset_type` set with what the user has for the same prompts. For each missing asset_type render a one-line gap ("You don't have a **CRM Alternatives** page") plus a Generate button wired to the existing tool that produces that asset (Content Auditor, Blog Outline, FAQ Generator, Schema Generator, Title/Description Generator). No new tools — just deep links pre-filled with the topic string.

## What replaces what

- Remove `defaultReasons()` in `CompetitorWatch.tsx` and the "Why they're winning" bullet list entirely.
- Remove the hardcoded `whyTheyRank` array from `analyze-competitors` beat-strategy prompt. Keep the LLM call, but only for a short 1-sentence natural-language *summary* on top of the evidence — never for the numbers.
- The old "action plan (do these in order)" list is replaced by the concrete gap list + Generate buttons above.

## Where the numbers come from (no new tables, no new calculations)

Query in `CompetitorWatch.fetchCompetitors` after the current scan_results load:

- `citations` joined via `scan_result_id ∈ user's scan_result ids`
- Filter `cites_brand ILIKE '%<competitor>%'` for competitor rows, and normalized user domain for user rows.
- Aggregate per competitor:
  - `comparisonPages` = count distinct `url` where `asset_type = 'comparison'` (fallback: url/title matches `/vs|alternative|comparison|competitors/i`)
  - `reviewCitations` = count distinct `domain` where `source_type IN ('review','publisher')` or domain is in existing `TRUSTED_SOURCE_KEYWORDS`
  - `educationalPages` = count distinct `url` where `asset_type IN ('guide','blog','educational','howto','faq')`
  - `promptCoverage` = distinct prompts where competitor appears / total prompts (we already have this as `percentage`)
  - `topCitingDomains` = top 8 `domain` by frequency (for the chips)
  - `winningPages` = top 10 `{url,title,asset_type}` by frequency (for the collapsed list)
  - `topics` = top 5 prompt keywords they win (naive TF on prompt strings)
- Same aggregation once for the user's own brand → the "You" number in every tile.

All of this runs client-side against Supabase; nothing changes in the recommendations engine, scan pipeline, or metrics cache.

## Files to change

- `src/components/dashboard/CompetitorWatch.tsx` — replace the `whyTheyRank` block with the Evidence grid, trusted-source chips, topics chips, winning-pages list, and gap+Generate section. Extend `fetchCompetitors` with the citation queries above. Drop `defaultReasons`.
- `src/components/dashboard/competitor/CompetitorEvidence.tsx` (new) — small presentational component: `EvidenceTile`, `SourceChips`, `WinningPages`, `GapList`.
- `supabase/functions/analyze-competitors/index.ts` — beat-strategy mode returns only `{summary, howToBeat}`; evidence is no longer LLM-generated. `whyTheyRank` field removed.

## Empty-state rules (evidence-first)

If a tile has zero real evidence, hide the tile — never show fabricated numbers. If the competitor has no citations at all in `citations` (only appeared in `gemini_competitors` arrays), show a single line "AI mentioned them but we haven't crawled their citations yet — re-run the scan for full evidence" and hide the Evidence grid. This preserves the "AI proved, not AI thinks" guarantee.
