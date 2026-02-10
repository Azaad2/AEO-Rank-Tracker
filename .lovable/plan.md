

# Make the Tool Fully Automatic: Auto-Optimize After Every Scan

## The Problem

Right now, after a scan completes, users get scores and tasks but still have to manually:
- Go to Action Plan and figure out what to do
- Go to Content Optimizer and paste their content
- Go to individual tools (FAQ Generator, Schema Generator, etc.) and run them separately
- Understand which prompts failed and why

The tool should **do all the heavy lifting automatically** after a scan.

## What Changes

After every scan, the system will automatically generate a complete optimization package for the user -- no manual steps required.

### 1. Auto-Generate Full Optimization Report (New Edge Function)

A new backend function `auto-optimize` that runs immediately after every scan. It takes the scan results and produces:

- **Rewritten content suggestions** for each failed prompt (what to publish to get cited)
- **Ready-to-use FAQ schema markup** based on the prompts the user is invisible for
- **Blog outline drafts** targeting the exact queries where they're missing
- **Meta title and description rewrites** optimized for AI citation

This runs automatically inside the scan function -- the user never has to trigger it.

### 2. New Database Table: `auto_optimizations`

Stores the auto-generated optimization outputs linked to each scan:

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| scan_id | UUID | Which scan triggered this |
| content_suggestions | JSONB | AI-written content for each failed prompt |
| faq_schema | TEXT | Ready-to-paste FAQ JSON-LD |
| blog_outlines | JSONB | Article outlines targeting weak prompts |
| meta_rewrites | JSONB | Optimized titles and descriptions |
| status | TEXT | pending/complete/failed |
| created_at | TIMESTAMP | When generated |

### 3. New Dashboard Tab: "Auto-Fix Results"

Replaces the manual Content Optimizer tab with an automatic results view:

- Shows the latest auto-generated optimization package
- **Copy-paste ready**: Each section has a "Copy" button
- **FAQ Schema**: Ready JSON-LD code the user just pastes into their site
- **Content Suggestions**: AI-written paragraphs targeting each failed prompt
- **Blog Outlines**: Full outlines they can hand to a writer or use directly
- **Meta Rewrites**: Title and description suggestions for key pages

### 4. Updated Scan Flow

```
User enters domain + prompts → clicks "Scan"
        |
        v
Scan runs (existing: Gemini, Perplexity, Google analysis)
        |
        v
Results saved + Credits updated + Tasks generated (existing)
        |
        v
[NEW] Auto-optimize function runs automatically
        |
        v
Generates: content suggestions, FAQ schema,
           blog outlines, meta rewrites
        |
        v
Saves to auto_optimizations table
        |
        v
Dashboard "Auto-Fix Results" tab shows everything ready to use
```

### 5. QuickScan Enhancement

After the QuickScan widget completes, it shows a notification: "Your optimization package is ready!" with a button to jump to the Auto-Fix Results tab.

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/auto-optimize/index.ts` | New edge function that generates the full optimization package using Lovable AI |
| `src/components/dashboard/AutoFixResults.tsx` | New dashboard component showing auto-generated optimizations |

### Files to Modify

| File | Change |
|------|---------|
| `supabase/functions/scan/index.ts` | After scan completes, trigger the `auto-optimize` function |
| `src/pages/Dashboard.tsx` | Replace "Content Optimizer" tab with "Auto-Fix Results" tab |
| `src/components/dashboard/QuickScan.tsx` | Show notification when optimization package is ready |

### Auto-Optimize Edge Function Logic

The function receives the scan results and generates everything in one AI call:

1. Takes all failed/weak prompts from scan results
2. Sends them to Lovable AI with a detailed prompt asking for:
   - Content paragraph for each failed prompt (what to write to get cited)
   - FAQ questions and answers covering the gaps
   - Complete FAQ JSON-LD schema markup
   - Blog outline targeting the weakest areas
   - Optimized meta titles and descriptions
3. Saves structured output to `auto_optimizations` table

### Database Migration

```
- Create auto_optimizations table with RLS policies
- Policy: users can only read their own optimizations
```

### Dashboard Auto-Fix Results Component

Shows four collapsible sections:
1. **Content to Add** - AI-written paragraphs for each failed prompt with copy buttons
2. **FAQ Schema** - Ready JSON-LD code block with copy button
3. **Blog Outlines** - Expandable outlines with titles, sections, and key points
4. **Meta Rewrites** - Table of suggested title/description changes

Each section has a status indicator showing if it was generated from the latest scan or an older one.
