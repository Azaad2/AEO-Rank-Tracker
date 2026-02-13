

# Fix: Enforce Subscription Limits Before Scanning

## The Problem

Users on the Free plan (5 prompts, 1 scan) can run unlimited scans because **nothing checks their usage limits** before processing a scan. The limit counters increment but never block further usage.

## The Fix

Add limit enforcement in **two places** for defense in depth:

### 1. Server-Side (Edge Function) -- Primary Guard

**File: `supabase/functions/scan/index.ts`**

Before processing the scan, if a `userId` is provided:
1. Query the user's active subscription to get `prompts_used` and `scans_used`
2. Query the associated plan to get `prompts_limit` and `scans_limit`
3. If `scans_used >= scans_limit` (and limit is not -1 for unlimited), return a 403 error with a clear message
4. If `prompts_used + number_of_prompts > prompts_limit`, return a 403 error

This goes right after the prompts parsing, before any API calls are made.

### 2. Client-Side (QuickScan) -- UX Guard

**File: `src/components/dashboard/QuickScan.tsx`**

Before calling the scan function:
1. Fetch the user's subscription and plan limits
2. If at limit, show a toast error and block the scan
3. Optionally disable the "Run Scan" button when at limit

This prevents unnecessary network calls and gives instant feedback.

### 3. Client-Side (Index Page) -- Guest + Logged-in Guard

**File: `src/pages/Index.tsx`**

The main scan form on the homepage also needs the same check for logged-in users before invoking the scan edge function.

## Technical Details

### Edge Function Change (scan/index.ts)

After parsing prompts and before processing, add:

```text
if (userId) {
  // Fetch subscription + plan
  const { data: sub } = await supabase.from('subscriptions')
    .select('scans_used, prompts_used, plan_id')
    .eq('user_id', userId).eq('status', 'active').single();
  
  if (sub) {
    const { data: plan } = await supabase.from('plans')
      .select('scans_limit, prompts_limit')
      .eq('id', sub.plan_id).single();
    
    if (plan) {
      if (plan.scans_limit !== -1 && sub.scans_used >= plan.scans_limit) {
        return 403 "Scan limit reached. Upgrade your plan."
      }
      if (sub.prompts_used + prompts.length > plan.prompts_limit) {
        return 403 "Prompt limit reached. Upgrade your plan."
      }
    }
  }
}
```

### QuickScan Component Change

Add a pre-scan check that fetches current usage and compares to limits. If at limit, show a toast with an upgrade link instead of running the scan.

### Index Page Change

Same pre-scan check for logged-in users before calling the scan edge function.
