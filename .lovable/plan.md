

# Automated AI Visibility Monitoring (Scheduled Auto-Scans)

## Overview

Automatically monitor your saved domains for AI visibility by running scheduled background scans. The system will periodically query AI platforms (Gemini, Perplexity, Google Search + OpenAI) with industry-relevant prompts and track whether the domain appears in AI-generated answers -- giving users a trend of their visibility over time without manual effort.

## How It Works

1. A database cron job runs daily (e.g., every 24 hours)
2. It calls a new edge function (`scheduled-scan`) which:
   - Fetches all saved domains from paid users
   - For each domain, auto-generates relevant prompts using AI
   - Runs the existing scan logic against those prompts
   - Stores results in the existing `scans` and `scan_results` tables
3. Users see their monitoring results in the dashboard under a new "Monitoring" tab or within the existing Score Trend view
4. Free users see the feature as locked; paid users get it automatically for their saved domains

## Plan Limits

| Plan | Auto-Monitoring |
|------|----------------|
| Free | Not available |
| Pro | 1 domain, daily scans |
| Team | 3 domains, daily scans |
| Agency | Unlimited domains, daily scans |

## Database Changes

1. Add `auto_monitor_limit` column to `plans` table:
```sql
ALTER TABLE plans ADD COLUMN auto_monitor_limit integer NOT NULL DEFAULT 0;
UPDATE plans SET auto_monitor_limit = 0 WHERE id = 'free';
UPDATE plans SET auto_monitor_limit = 1 WHERE id = 'pro';
UPDATE plans SET auto_monitor_limit = 3 WHERE id = 'team';
UPDATE plans SET auto_monitor_limit = -1 WHERE id = 'agency';
```

2. Add `monitoring_prompts` table to store auto-generated prompts per domain:
```sql
CREATE TABLE monitoring_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  prompts text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE monitoring_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read monitoring_prompts" ON monitoring_prompts FOR SELECT USING (true);
CREATE POLICY "Service insert monitoring_prompts" ON monitoring_prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update monitoring_prompts" ON monitoring_prompts FOR UPDATE USING (true);
```

3. Add `is_auto_scan` column to `scans` table to distinguish manual vs automated scans:
```sql
ALTER TABLE scans ADD COLUMN is_auto_scan boolean NOT NULL DEFAULT false;
```

4. Set up `pg_cron` and `pg_net` extensions, then create the cron job (via insert tool, not migration).

## New Edge Function: `scheduled-scan`

**File:** `supabase/functions/scheduled-scan/index.ts`

This function:
1. Fetches all paid users with saved domains (joins `saved_domains` + `subscriptions` + `plans`)
2. For each domain, checks if a monitoring scan has already been done today
3. If not, generates 3-5 relevant prompts using Lovable AI (or retrieves cached prompts from `monitoring_prompts`)
4. Calls the existing scan logic internally (reusing Serper, Gemini, Perplexity analysis)
5. Stores results with `is_auto_scan = true`
6. Respects the `auto_monitor_limit` per plan

Key considerations:
- Rate limiting: Process domains sequentially with delays to avoid API rate limits
- Prompt generation: Use Lovable AI to generate industry-relevant prompts for each domain (cached weekly)
- Deduplication: Skip domains already scanned today

## Frontend Changes

### Dashboard - Score Trend Enhancement
- Update `ScoreTrend.tsx` to show auto-scan data points with a distinct marker/label
- Add a badge like "Auto-monitored" on auto-scan entries

### Dashboard - Monitoring Status
- Update `SavedDomains.tsx` to show monitoring status per domain (active/inactive based on plan)
- Show last auto-scan date and next scheduled scan

### Pricing Page
- Add "AI Visibility Monitoring" as a feature line:
  - Free: "No auto-monitoring"
  - Pro: "1 domain monitored daily"
  - Team: "3 domains monitored daily"
  - Agency: "Unlimited domains monitored daily"

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/scheduled-scan/index.ts` | Create -- new edge function for background scans |
| `supabase/config.toml` | Add scheduled-scan function config |
| `src/components/dashboard/SavedDomains.tsx` | Update -- show monitoring status |
| `src/components/dashboard/ScoreTrend.tsx` | Update -- distinguish auto vs manual scans |
| `src/pages/Pricing.tsx` | Add monitoring feature to plan comparison |
| Database migration | Add `auto_monitor_limit`, `monitoring_prompts` table, `is_auto_scan` column |
| Cron job setup (insert tool) | Schedule daily invocation of `scheduled-scan` |

## Technical Details

### Cron Schedule
- Runs once daily at 2:00 AM UTC
- Uses `pg_cron` + `pg_net` to call the edge function via HTTP

### Prompt Generation Strategy
- First scan: Use Lovable AI to generate 5 prompts based on the domain (e.g., "best [industry] tools", "alternatives to [competitor]")
- Cache prompts in `monitoring_prompts` table, regenerate weekly
- This avoids redundant AI calls for prompt generation

### Auto-Scan vs Manual Scan
- Auto-scans do NOT count against the user's `scans_used` or `prompts_used` quotas
- They are tracked separately with the `is_auto_scan` flag
- This ensures monitoring doesn't eat into the user's manual scan allowance

