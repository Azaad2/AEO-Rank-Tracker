

# Replace "Recent Scans" with "Ranking Opportunities"

## What Changes

Remove the "Recent Scans" card entirely from the Overview tab. Replace it with a new **"Ranking Opportunities"** card that shows:

1. **Prompts where the user is NOT ranking** -- pulled from their latest scan's `scan_results`, filtered to prompts where `mentioned = false` or `gemini_mentioned = false`. These are opportunities to improve.
2. **Competitor prompts** -- prompts where competitors ARE ranking (from `gemini_competitors` and `top_cited_domains` data). Shows which competitors appear and on which prompts.

This gives users immediate, actionable insight instead of a boring history table.

## New Card Layout

The card will have two sections:

- **"You're Missing On"** -- List of prompts where the user's domain was NOT mentioned/cited, with red indicators. Each prompt shows which AI engines missed them (Gemini, Perplexity).
- **"Competitors Ranking Here"** -- For each of those prompts, show which competitor domains ARE being cited, so the user knows who to beat.

If no scan data exists yet, show a prompt to run their first scan.

## Technical Details

### File to Modify

**`src/components/dashboard/ScanHistory.tsx`** -- Complete rewrite into a new component

- Rename the component conceptually (keep same file to avoid Dashboard import changes)
- Query: Fetch the user's latest scan, then fetch its `scan_results` with all fields
- Filter results to show prompts where `mentioned = false` OR `gemini_mentioned = false`
- For each prompt, display:
  - The prompt text
  - Status icons: Gemini (mentioned/not), Perplexity (cited/not)
  - Competitors found on that prompt (from `gemini_competitors` array)
- If ALL prompts show mentions, display a success message instead

### Data Query

```text
1. Get latest scan: supabase.from('scans').select('id, project_domain').order('created_at', { ascending: false }).limit(1)
2. Get its results: supabase.from('scan_results').select('*').eq('scan_id', latestScanId)
3. Filter client-side: show prompts where mentioned=false OR gemini_mentioned=false
4. Extract competitors from gemini_competitors and top_cited_domains arrays
```

### UI Structure

```text
+--------------------------------------------------+
| Ranking Opportunities                             |
| Based on your latest scan for youtube.com         |
+--------------------------------------------------+
| "Best video platforms"                            |
|   Gemini: Not mentioned  |  Perplexity: Cited    |
|   Competitors: vimeo.com, dailymotion.com         |
|                                                   |
| "How to share videos online"                      |
|   Gemini: Mentioned      |  Perplexity: Not cited|
|   Competitors: streamable.com                     |
|                                                   |
| "Top streaming services"                          |
|   Gemini: Not mentioned  |  Perplexity: Not cited|
|   Competitors: netflix.com, hulu.com              |
+--------------------------------------------------+
```

### No changes needed to Dashboard.tsx

The `ScanHistory` component import stays the same -- only the internal implementation changes.

