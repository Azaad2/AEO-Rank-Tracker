

# Enhance User Dashboard with AI Optimization Features

## Overview

Add powerful AI optimization features inside user accounts to help them improve their AI visibility and rank higher in AI answers. These features build on the existing scan data and tools to create a personalized optimization workspace.

## New Features

### 1. Saved Domains & Tracking Dashboard

A section where users can save their domains and track visibility scores over time.

- **Domain Manager**: Save multiple domains to monitor
- **Score Trend Chart**: Visual chart showing how their AI visibility score changes across scans (using Recharts, already installed)
- **Comparison View**: See which prompts improved and which declined between scans

### 2. AI Content Optimizer (Dashboard Widget)

A built-in content optimization tool accessible directly from the dashboard.

- **Paste your content** → get AI suggestions on how to make it more citable by ChatGPT, Gemini, Perplexity
- Uses the existing `generate-optimization-plan` edge function pattern
- Provides actionable rewrites, FAQ suggestions, and schema markup recommendations

### 3. Personalized Action Plan

An auto-generated, prioritized to-do list based on their latest scan results.

- Pulls data from scan_results table for the user's scans
- Groups actions into: "Fix Now" (high impact), "Improve Soon" (medium), "Nice to Have" (low)
- Each action links directly to the relevant tool (FAQ Generator, Schema Generator, etc.)
- Progress tracking: mark items as done

### 4. Competitor Watch

A persistent competitor tracking panel.

- Based on `gemini_competitors` and `top_cited_domains` from scan results
- Shows which competitors appear most frequently across their prompts
- "Beat this competitor" button that links to the Competitor Analyzer tool with pre-filled data

### 5. Quick Scan Widget

A lightweight scan input directly on the dashboard (no need to go back to homepage).

- Reuses existing scan edge function
- Shows inline results summary
- Automatically links to full results

## Database Changes

### New Table: `saved_domains`

```sql
CREATE TABLE saved_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, domain)
);

ALTER TABLE saved_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own domains"
  ON saved_domains FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### New Table: `optimization_tasks`

```sql
CREATE TABLE optimization_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES scans(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  tool_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE optimization_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON optimization_tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Modify `scans` table

Add a `user_id` column so scans can be linked to authenticated users:

```sql
ALTER TABLE scans ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

## Code Changes

### New Components

| Component | Purpose |
|-----------|---------|
| `src/components/dashboard/ScoreTrend.tsx` | Recharts line chart showing score history per domain |
| `src/components/dashboard/SavedDomains.tsx` | Domain manager with add/remove and quick-scan |
| `src/components/dashboard/ActionPlan.tsx` | Prioritized optimization tasks with progress tracking |
| `src/components/dashboard/CompetitorWatch.tsx` | Competitor frequency analysis from scan results |
| `src/components/dashboard/QuickScan.tsx` | Inline scan widget for dashboard |
| `src/components/dashboard/ContentOptimizer.tsx` | AI-powered content optimization suggestions |

### Modified Files

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add tab navigation for all new sections |
| `src/pages/Index.tsx` | Pass `user.id` when creating scans for authenticated users |
| `supabase/functions/scan/index.ts` | Accept optional `userId` and save to scans table |

## Dashboard Layout

The enhanced dashboard will use a tabbed layout:

- **Overview** (default): Score summary, credit usage, quick scan
- **My Domains**: Saved domains with score trends
- **Action Plan**: Prioritized optimization tasks
- **Competitors**: Competitor tracking and analysis
- **Content Optimizer**: AI content optimization tool

## Implementation Order

1. Database migrations (tables + RLS policies + scans user_id column)
2. Update scan flow to save user_id for authenticated users
3. Build SavedDomains component with score trend chart
4. Build ActionPlan component with task management
5. Build CompetitorWatch component
6. Build ContentOptimizer component
7. Build QuickScan widget
8. Restructure Dashboard.tsx with tabs
9. Test end-to-end flow

