
# Fix: Upgrade Unlocks More Scans + Personalized Competitor Insights

## Issue 1: Upgraded Users Can't Scan More

**Root cause**: When a user upgrades via Razorpay, the webhook creates a new subscription row but does NOT deactivate the old "free" subscription. Both remain `status = 'active'`. While the scan function picks the latest one (which should be the paid one), stale data or race conditions can cause the old free sub to be picked.

**Fix**: In the `razorpay-webhook` edge function, when `subscription.activated` fires, deactivate ALL other active subscriptions for that user before creating the new one.

### File: `supabase/functions/razorpay-webhook/index.ts`

In the `subscription.activated` case (around line 99-131), before the upsert, add:

```
// Deactivate old subscriptions for this user
if (userId) {
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');
}
```

This ensures only the new paid subscription is active, so the scan limit check picks the correct plan limits.

---

## Issue 2: "Beat" Button Shows Generic/Same Response for All Competitors

**Root cause (3 bugs)**:

1. `CompetitorWatch.tsx` calls the `analyze-competitors` edge function with `{ domain, competitor, mode: 'beat-strategy' }`, but the edge function expects `{ yourDomain, competitors, industry }` -- parameter mismatch, so the call fails silently.
2. The fallback strategy (lines 129-148) is hardcoded generic text, identical for every competitor.
3. `parseStrategy()` (lines 155-178) completely ignores the AI response and returns hardcoded text.

**Fix**: Rewrite the "Beat" flow to send the correct data (including the specific prompts where that competitor ranks) and properly use the AI response.

### File: `supabase/functions/analyze-competitors/index.ts`

Update the edge function to accept a `beat-strategy` mode that takes:
- `yourDomain`: the user's domain
- `competitor`: single competitor domain name
- `promptsWhereTheyRank`: list of specific prompts where this competitor was cited

Update the AI prompt to ask for a personalized analysis of WHY this specific competitor ranks on those specific prompts and HOW to beat them.

Return structured JSON:
```json
{
  "whyTheyRank": ["Specific reason based on their prompts..."],
  "howToBeat": ["Specific actionable step..."],
  "tools": [{ "name": "...", "link": "..." }]
}
```

### File: `src/components/dashboard/CompetitorWatch.tsx`

1. Store the prompts where each competitor appears (already available from `scan_results` data -- `gemini_competitors` and `top_cited_domains`).
2. Pass correct params to the edge function: `{ yourDomain, competitor, promptsWhereTheyRank, mode: 'beat-strategy' }`.
3. Replace `parseStrategy()` with proper JSON parsing of the AI response so the actual personalized insights are displayed.
4. Keep the fallback strategy only as a last resort if the API call truly fails.

### Data Flow Change

Currently:
```
Click "Beat" -> wrong params -> API fails -> generic fallback shown
```

After fix:
```
Click "Beat" -> send domain + competitor + their prompts -> AI analyzes WHY they rank on those specific prompts -> personalized strategy shown
```

### Example of Personalized Output

For competitor "vimeo.com" ranking on prompts ["best video hosting", "video sharing platforms"]:

- **Why They Rank**: "Vimeo appears in 'best video hosting' queries because they offer dedicated hosting with no ads, which AI models cite as a differentiator. For 'video sharing platforms', their professional-grade tools get mentioned alongside YouTube."
- **How to Beat**: "Create a comparison page titled 'YouTube vs Vimeo for Business' targeting the exact queries where they appear. Add FAQ schema covering hosting features."
