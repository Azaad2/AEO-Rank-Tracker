

# Fix: Show Only the Logged-In User's Scan Data

## The Problem

The Ranking Opportunities card currently fetches the latest scan from the **entire** `scans` table without filtering by user. This means a logged-in user sees scan results from other users' domains (e.g., "foxtale.com") instead of their own.

## The Fix

Filter the scans query by the authenticated user's ID so only their own scan data appears.

## Technical Details

### File to Modify

**`src/components/dashboard/ScanHistory.tsx`**

1. Get the current user's ID using `supabase.auth.getUser()` before querying scans
2. Add `.eq('user_id', userId)` filter to the scans query so it only returns the logged-in user's scans
3. If the user has no scans, show the "Run your first scan" empty state (existing behavior)

### Change Summary

The scans query changes from:

```
supabase.from('scans').select('id, project_domain').order('created_at', { ascending: false }).limit(1).single()
```

To:

```
const { data: { user } } = await supabase.auth.getUser()
supabase.from('scans').select('id, project_domain').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single()
```

This is a small but critical fix -- one line added to get the user, one filter added to the query. No UI changes needed.

