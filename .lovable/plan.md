
# Slack Integration for AI Visibility Reports & Alerts

## Overview

This integration will allow users to connect their Slack workspace and receive automated AI visibility reports directly in their team channels. Users can get instant alerts when scans complete, schedule recurring reports, and set up threshold-based notifications.

---

## Features

### 1. Slack Connection Setup
- Users can connect their Slack workspace via the Lovable Slack connector
- Select which channel(s) to receive reports in
- Configuration stored per-user/team

### 2. Instant Scan Alerts
- Automatically send a summary to Slack when a scan completes
- Rich formatted message with score, key metrics, and quick insights

### 3. Threshold Alerts
- Set up alerts for score drops (e.g., "Alert me if score drops below 40")
- Competitor appearance notifications

### 4. Scheduled Reports
- Daily/weekly visibility summary reports
- Track score trends over time

---

## Architecture

```text
+-------------------+      +----------------------+      +------------------+
|   Frontend        |      |   Edge Functions     |      |   Slack API      |
|   (React UI)      +----->+   send-slack-alert   +----->+   (via Gateway)  |
+-------------------+      +----------------------+      +------------------+
         |                          |
         |                          v
         |                 +------------------+
         +---------------->+   Database       |
                           +------------------+
                           | slack_configs    |
                           | alert_history    |
                           +------------------+
```

---

## Implementation Plan

### Phase 1: Database Schema

Create tables to store Slack configuration:

**Table: `slack_configs`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | User email (links to customers) |
| channel_id | text | Slack channel ID |
| channel_name | text | Channel display name |
| is_active | boolean | Enable/disable notifications |
| notify_on_scan | boolean | Send alert after each scan |
| score_threshold | integer | Alert if score drops below |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update |

**Table: `slack_alert_history`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| config_id | uuid | FK to slack_configs |
| scan_id | uuid | FK to scans |
| alert_type | text | scan_complete, threshold_alert |
| message_ts | text | Slack message timestamp |
| sent_at | timestamp | When sent |

---

### Phase 2: Edge Function - `send-slack-alert`

New edge function that:
1. Accepts scan results and config
2. Formats a rich Slack message with Block Kit
3. Sends to the configured channel via Slack API

**Message Format (Block Kit)**:
```text
+------------------------------------------------+
| AI VISIBILITY REPORT                    Score  |
|                                          75    |
+------------------------------------------------+
| Domain: example.com                            |
| Prompts Analyzed: 10                           |
+------------------------------------------------+
| Platform Breakdown:                            |
| Gemini:     65%                               |
| Perplexity: 80%                               |
| ChatGPT:    72%                               |
+------------------------------------------------+
| Top Competitors Appearing:                     |
| competitor1.com, competitor2.com              |
+------------------------------------------------+
| [View Full Report]                            |
+------------------------------------------------+
```

---

### Phase 3: Frontend UI Components

**A. Slack Settings Card** (on results page)
- Connect to Slack button
- Channel selector dropdown
- Toggle for automatic alerts
- Score threshold input
- Test notification button

**B. Slack Notification Toggle** (in scan flow)
- Quick toggle to send results to Slack after scan
- Remembers preference

---

### Phase 4: Integration Flow

1. **Connect Slack**: Use Lovable Slack connector to authenticate
2. **Select Channel**: Fetch available channels, user selects one
3. **Configure Alerts**: Set preferences (on-scan, thresholds)
4. **Automatic Delivery**: After scan, edge function sends formatted report
5. **Manual Send**: "Share to Slack" button on any report

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-slack-alert/index.ts` | Edge function for Slack API calls |
| `src/components/SlackIntegration.tsx` | Slack settings UI component |

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add send-slack-alert function config |
| `src/pages/Index.tsx` | Add Slack share button to results section |
| `src/components/ScanResultsModal.tsx` | Add "Share to Slack" option |

### Database Migration

```sql
-- Create slack_configs table
CREATE TABLE public.slack_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  is_active boolean DEFAULT true,
  notify_on_scan boolean DEFAULT true,
  score_threshold integer DEFAULT 40,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create slack_alert_history table
CREATE TABLE public.slack_alert_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id uuid REFERENCES public.slack_configs(id) ON DELETE CASCADE,
  scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  message_ts text,
  sent_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.slack_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_alert_history ENABLE ROW LEVEL SECURITY;

-- Public insert/select for now (no auth required)
CREATE POLICY "Allow public insert on slack_configs" 
ON public.slack_configs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on slack_configs" 
ON public.slack_configs FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on slack_configs" 
ON public.slack_configs FOR UPDATE 
USING (true);

CREATE POLICY "Allow public insert on slack_alert_history" 
ON public.slack_alert_history FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on slack_alert_history" 
ON public.slack_alert_history FOR SELECT 
USING (true);
```

---

## Edge Function: send-slack-alert

The function will:

1. **Accept payload** with scan data and channel info
2. **Format message** using Slack Block Kit for rich formatting
3. **Call Slack API** via connector gateway
4. **Log result** to alert_history table

**Key Features**:
- Score color coding (green/yellow/red based on thresholds)
- Platform breakdown with visual indicators
- Competitor list
- Direct link to full report
- Handles errors gracefully

---

## User Experience Flow

1. User completes a scan
2. Results modal shows with new "Share to Slack" button
3. First time: Prompts to connect Slack workspace
4. User selects channel from dropdown
5. Click "Send to Slack" to share report
6. Optional: Enable auto-send for future scans

---

## Summary of Changes

| Category | Items |
|----------|-------|
| Database | 2 new tables (slack_configs, slack_alert_history) |
| Edge Functions | 1 new function (send-slack-alert) |
| Components | 1 new component (SlackIntegration.tsx) |
| Modified Files | Index.tsx, ScanResultsModal.tsx, config.toml |

---

## Prerequisites

- Slack connector needs to be connected to the project
- SLACK_API_KEY and LOVABLE_API_KEY environment variables required

