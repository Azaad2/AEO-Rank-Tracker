

# Auto-Suggest Prompts with SEO Intelligence

## Overview

When a user enters a domain in the scan form, the system will automatically analyze that domain and suggest relevant prompts (search queries) along with SEO intelligence data: ranking difficulty, estimated search volume, and keywords to focus on. Free users see only the prompt textarea (no suggestions), while paid users get suggestions that scale with their tier.

## How It Works

1. User types a domain and clicks a "Suggest Prompts" button (or it triggers on blur/enter)
2. A new edge function (`suggest-prompts`) uses Lovable AI to analyze the domain and generate relevant prompts with metadata
3. Suggestions appear below the domain input as clickable cards showing: prompt text, difficulty badge, volume indicator, and focus keywords
4. Clicking a suggestion adds it to the prompts textarea
5. Free plan: feature is locked with an upgrade nudge. Paid plans get increasing suggestion counts:
   - Free: 0 (locked)
   - Pro: 5 suggestions
   - Team: 10 suggestions
   - Agency: 20 suggestions

## Database Changes

Add a `suggested_prompts_limit` column to the `plans` table:

```sql
ALTER TABLE plans ADD COLUMN suggested_prompts_limit integer NOT NULL DEFAULT 0;
UPDATE plans SET suggested_prompts_limit = 0 WHERE id = 'free';
UPDATE plans SET suggested_prompts_limit = 5 WHERE id = 'pro';
UPDATE plans SET suggested_prompts_limit = 10 WHERE id = 'team';
UPDATE plans SET suggested_prompts_limit = 20 WHERE id = 'agency';
```

## New Edge Function: `suggest-prompts`

**File:** `supabase/functions/suggest-prompts/index.ts`

- Accepts: `{ domain, userId }`
- Checks user subscription to determine how many suggestions to return (0 for free = returns 403)
- Calls Lovable AI (`google/gemini-3-flash-preview`) with a prompt like:
  > "Given the website domain [domain], generate [N] search prompts that a potential customer or user might type into an AI assistant. For each prompt, provide: the prompt text, ranking difficulty (low/medium/high), estimated monthly search volume (low/medium/high), and 2-3 focus keywords."
- Uses tool calling for structured JSON output
- Returns array of suggestions

## New Frontend Component: `SuggestedPrompts`

**File:** `src/components/dashboard/SuggestedPrompts.tsx`

Displays suggested prompts as a list of cards. Each card shows:
- Prompt text
- Difficulty badge (color-coded: green=low, yellow=medium, red=high)
- Volume indicator (Low / Medium / High)
- Focus keywords as small badges
- "Add" button to append prompt to the textarea

For free users: shows a locked state with "Upgrade to unlock AI-suggested prompts"

## UI Integration

### Index.tsx (Homepage scan form)
- Add "Suggest Prompts" button next to the domain input (visible only for logged-in paid users)
- When clicked, calls the edge function and displays `SuggestedPrompts` component
- Free/guest users see a subtle "Upgrade to get AI-suggested prompts" hint

### QuickScan.tsx (Dashboard scan widget)
- Same integration: "Suggest Prompts" button after domain input
- Gated by plan

### Pricing.tsx
- Add "AI Prompt Suggestions" as a feature line item:
  - Free: "No AI prompt suggestions"
  - Pro: "5 AI prompt suggestions per scan"
  - Team: "10 AI prompt suggestions per scan"
  - Agency: "20 AI prompt suggestions per scan"

## Technical Details

### Edge Function Structure
```
supabase/functions/suggest-prompts/index.ts
```
- CORS headers
- Validate userId and check subscription plan
- Call Lovable AI gateway with tool calling for structured output
- Return suggestions array capped at plan limit
- Handle 429/402 errors from AI gateway

### Structured Output Schema (via tool calling)
```json
{
  "suggestions": [
    {
      "prompt": "best alternative to [competitor]",
      "difficulty": "medium",
      "volume": "high",
      "keywords": ["alternative", "competitor name", "comparison"]
    }
  ]
}
```

### Config Update
Add to `supabase/config.toml`:
```toml
[functions.suggest-prompts]
verify_jwt = false
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/suggest-prompts/index.ts` | Create - new edge function |
| `src/components/dashboard/SuggestedPrompts.tsx` | Create - UI component for displaying suggestions |
| `supabase/config.toml` | Add suggest-prompts function config |
| `src/pages/Index.tsx` | Add suggest button and suggestions display |
| `src/components/dashboard/QuickScan.tsx` | Add suggest button and suggestions display |
| `src/pages/Pricing.tsx` | Add prompt suggestions to feature lists |
| Database migration | Add `suggested_prompts_limit` column to plans |

