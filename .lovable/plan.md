

# Add AI Assistant to Dashboard

## Overview

Add an "AI Assistant" tab to the dashboard where users can chat with an AI that can trigger all app features through conversation -- run scans, generate content (titles, descriptions, FAQs, blog outlines), analyze competitors, and provide optimization advice. Usage is tracked with per-plan monthly message limits.

## What Users Will See

- A new **"AI Assistant"** tab in the dashboard with a chat interface
- Users type natural language requests like:
  - "Scan example.com for AI visibility"
  - "Generate SEO titles for my website"
  - "Who are my competitors for 'best CRM software'?"
  - "Create FAQ schema for my landing page"
- The assistant responds with results inline and can trigger the existing edge functions behind the scenes
- A message counter showing remaining messages for the month

## Plan Limits

| Plan     | Messages/Month |
|----------|---------------|
| Free     | 10            |
| Pro      | 100           |
| Team     | 500           |
| Agency   | Unlimited     |

## Implementation

### 1. Database Changes

**Add `chat_messages_used` column to `subscriptions` table:**
```sql
ALTER TABLE subscriptions ADD COLUMN chat_messages_used integer DEFAULT 0;
```

**Add `chat_limit` column to `plans` table:**
```sql
ALTER TABLE plans ADD COLUMN chat_limit integer DEFAULT 10;
```

**Update plan limits:**
- Free: 10, Pro: 100, Team: 500, Agency: -1 (unlimited)

**Create `chat_messages` table** to store conversation history per user:
- `id`, `user_id`, `role` (user/assistant), `content`, `created_at`
- RLS: users can only access their own messages

### 2. New Edge Function: `supabase/functions/ai-assistant/index.ts`

A streaming edge function that:
1. Checks the user's `chat_messages_used` vs `chat_limit` (returns 403 if exceeded)
2. Increments `chat_messages_used` on each user message
3. Receives the conversation history + new message
4. Uses a system prompt that understands all app capabilities
5. Uses tool calling to detect intent (scan, generate titles, analyze competitors, etc.)
6. Calls the appropriate existing edge functions internally when needed
7. Streams the response back to the user

The system prompt will instruct the AI about available actions:
- **Scan**: Extract domain and prompts, call the scan function
- **Generate titles/descriptions**: Extract topic, call generate-titles/generate-description
- **Generate FAQs**: Extract content, call generate-faqs
- **Blog outlines**: Extract topic, call generate-blog-outline
- **Competitor analysis**: Extract domain, call analyze-competitors
- **General advice**: Answer directly from AI knowledge

### 3. New Component: `src/components/dashboard/AIAssistant.tsx`

A chat UI component with:
- Message list with markdown rendering
- Input box at the bottom
- Streaming token-by-token display
- Message counter badge showing "X/Y messages used"
- Upgrade prompt when limit is reached

### 4. Dashboard Update: `src/pages/Dashboard.tsx`

- Add a new "AI Assistant" tab with a bot icon
- Pass subscription data for limit display

### 5. Pricing Page Update: `src/pages/Pricing.tsx`

- Add "AI Assistant messages" to each plan's feature list

## Files to Create/Modify

| File | Action |
|------|--------|
| `subscriptions` table | Add `chat_messages_used` column |
| `plans` table | Add `chat_limit` column + update values |
| `chat_messages` table | Create new table with RLS |
| `supabase/functions/ai-assistant/index.ts` | Create streaming chat function |
| `src/components/dashboard/AIAssistant.tsx` | Create chat UI component |
| `src/pages/Dashboard.tsx` | Add AI Assistant tab |
| `src/pages/Pricing.tsx` | Add chat limits to plan features |
| `supabase/config.toml` | Add ai-assistant function config |

