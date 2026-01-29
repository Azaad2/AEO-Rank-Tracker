
# Post-Scan AI Visibility Optimization System

## Current State Analysis

The application already has some optimization infrastructure:
- **ImprovementRoadmap component** - Shows improvement insights based on scan results
- **improvementAnalysis.ts** - Analyzes results and provides basic recommendations
- **Content Auditor tool** - Audits content for AI-friendliness (standalone)
- **LLM Readiness Score tool** - Scores website readiness (standalone)

**Gap Identified**: These tools exist in isolation. After a scan reveals poor visibility, users don't get personalized, actionable guidance on HOW to fix it. They see their score and generic advice but no direct path to improvement.

---

## Proposed Solution: AI Visibility Optimizer

### Core Concept

After scanning, users with low scores (<70%) will see a new "Improve Your Visibility" section that:
1. Analyzes WHY they're not appearing in AI answers
2. Provides prompt-specific optimization suggestions
3. Offers quick-fix tools right in the results flow
4. Generates AI-optimized content snippets they can use

---

## Implementation Plan

### Phase 1: Enhanced Post-Scan Analysis

**New Edge Function: `generate-optimization-plan`**

This function will take scan results and generate personalized, actionable optimization recommendations using AI.

Input:
- Domain name
- Scan results (which prompts failed, competitor data)
- Current score

Output:
- Root cause analysis (why the brand isn't appearing)
- Prompt-specific content suggestions
- Schema markup recommendations
- Quick-win action items with priority scores
- Competitor strategies to emulate

```text
POST /functions/v1/generate-optimization-plan
Body: {
  domain: "example.com",
  score: 35,
  results: [...],
  competitors: [...]
}
```

---

### Phase 2: New UI Component - OptimizationHub

**File: `src/components/OptimizationHub.tsx`**

A new component that appears after scan results, containing:

1. **Score Diagnosis Card**
   - "Why You're Invisible" analysis
   - Root causes identified (missing authority signals, thin content, etc.)

2. **Prompt-Specific Fixes**
   - For each failed prompt, show specific content recommendations
   - "For the prompt 'best project management tools', add this content to your site..."

3. **Quick Action Buttons**
   - "Generate FAQ for this topic" (links to FAQ Generator with pre-filled data)
   - "Create Schema Markup" (links to Schema Generator with context)
   - "Audit Your Content" (links to Content Auditor)
   - "Check LLM Readiness" (links to Readiness Scorer)

4. **Competitor Insights**
   - What competitors are doing right
   - Content gaps to fill
   - Authority signals they have that you don't

---

### Phase 3: AI-Powered Content Suggestions

**Enhancement to `generate-optimization-plan` edge function:**

For each failed prompt, generate:
- A sample paragraph that would make the brand citable
- FAQ questions to add to the site
- Schema markup snippet for the topic
- Meta description optimized for AI visibility

Example output:
```json
{
  "promptFixes": [
    {
      "prompt": "best CRM software for startups",
      "rootCause": "No startup-focused content on pricing or features",
      "contentSuggestion": "Add a dedicated page titled 'CRM for Startups: Affordable Features for Growing Teams' with comparison tables...",
      "faqsToAdd": [
        "What makes a CRM good for startups?",
        "How much does startup CRM software cost?"
      ],
      "schemaType": "SoftwareApplication",
      "priority": "high"
    }
  ],
  "quickWins": [
    {
      "action": "Add FAQ schema to existing product page",
      "impact": "+8 visibility points",
      "effort": "15 minutes"
    }
  ]
}
```

---

### Phase 4: Integration Points

**Modify `ScanResultsModal.tsx`:**
- Add "Get Optimization Plan" button after results display
- For low scores (<70%), show prominent CTA
- After email capture, show optimization section

**Modify `Index.tsx`:**
- Add OptimizationHub below ImprovementRoadmap
- Pass scan data to OptimizationHub component
- Track optimization plan generation events

**New Routes (optional future phase):**
- `/optimize/:scanId` - Dedicated optimization page for a scan
- Shareable and bookmarkable improvement plan

---

## Technical Implementation Details

### New Files to Create:

1. **`supabase/functions/generate-optimization-plan/index.ts`**
   - Edge function that uses Lovable AI to generate optimization recommendations
   - Takes scan results as input
   - Returns structured optimization plan

2. **`src/components/OptimizationHub.tsx`**
   - Main optimization recommendations component
   - Displays diagnosis, prompt-specific fixes, and quick actions

3. **`src/components/PromptOptimizer.tsx`**
   - Per-prompt optimization card
   - Shows content suggestions, FAQs, and schema recommendations

4. **`src/components/QuickActionCards.tsx`**
   - Grid of quick-win action buttons
   - Links to relevant tools with pre-filled context

### Files to Modify:

1. **`src/components/ScanResultsModal.tsx`**
   - Add "Improve Visibility" CTA for low scores
   - Trigger optimization plan generation

2. **`src/pages/Index.tsx`**
   - Import and render OptimizationHub
   - Add state management for optimization data

3. **`src/utils/improvementAnalysis.ts`**
   - Enhance with more detailed analysis functions
   - Add prompt-level recommendation logic

---

## User Flow

```text
User runs scan
        |
        v
Sees Results Modal
(Score: 42%)
        |
        v
Enters email to unlock
        |
        v
Sees full results + prominent
"Get Your Optimization Plan" button
        |
        v
Clicks button - AI generates
personalized plan (2-3 seconds)
        |
        v
OptimizationHub displays:
- Why you're invisible (diagnosis)
- Fix each prompt (specific suggestions)
- Quick wins (one-click improvements)
- Tool links (pre-filled with context)
```

---

## Expected Impact

| Metric | Current | After Implementation |
|--------|---------|---------------------|
| User engagement post-scan | ~20% bounce after results | ~60% engage with optimizer |
| Email capture rate | 20% | 35%+ (optimizer as incentive) |
| Tool usage from scan | ~5% | ~25%+ (contextual links) |
| Time on site | 2 min avg | 5+ min avg |
| Return visits | Low | Higher (check progress) |

---

## Summary of Changes

| Type | File | Description |
|------|------|-------------|
| Create | `supabase/functions/generate-optimization-plan/index.ts` | AI-powered optimization plan generator |
| Create | `src/components/OptimizationHub.tsx` | Main optimization recommendations UI |
| Create | `src/components/PromptOptimizer.tsx` | Per-prompt fix suggestions |
| Create | `src/components/QuickActionCards.tsx` | Quick action buttons with context |
| Modify | `src/components/ScanResultsModal.tsx` | Add optimization CTA |
| Modify | `src/pages/Index.tsx` | Integrate OptimizationHub component |
| Modify | `src/utils/improvementAnalysis.ts` | Enhanced analysis functions |

This approach transforms the tool from a "diagnostic only" scanner into a complete "diagnose + fix" solution, significantly increasing user value and engagement.
