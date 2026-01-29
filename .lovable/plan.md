

# Headline Refresh & Optimization Funnel Fix

## Problem Summary

After analyzing the current implementation, I found two key issues:

1. **The headline is generic** - Using A/B test variants like "AI Search Visibility Checker" which doesn't communicate the full diagnose + fix value proposition

2. **The optimization funnel is broken** - The `OptimizationHub` is buried at the bottom of the Index page. After users unlock results in the modal, there's no clear next step to get optimization recommendations. They have to close the modal, scroll down, and hope they notice the "Improve Your AI Visibility" section

---

## Solution Overview

### 1. New Compelling Headline

Replace the A/B tested headline with a powerful, value-driven headline that communicates both the problem and solution:

**Primary Headline Options:**

| Option | Headline |
|--------|----------|
| A (Recommended) | "Invisible to AI? Fix It in Minutes." |
| B | "AI Ignoring Your Website? We'll Show You Why — And How to Fix It" |
| C | "From AI Invisible to AI Visible: Scan, Diagnose, Optimize" |

**Supporting Subheadline:**
"Check if ChatGPT, Perplexity, and Gemini mention your brand — then get a personalized plan to boost your visibility."

---

### 2. Funnel Flow Improvements

The new user flow will be:

```text
User enters domain + prompts
            |
            v
    Clicks "Scan"
            |
            v
   Results Modal Opens
   (shows 1 free prompt result)
            |
            v
   User enters email to unlock
            |
            v
   *** NEW: "Get Optimization Plan" CTA appears ***
   prominently inside the modal
            |
            v
   User clicks CTA → Loading state
            |
            v
   *** NEW: Optimization results shown INSIDE modal ***
   OR modal closes with scroll-to OptimizationHub
```

---

## Detailed Changes

### File 1: `src/pages/Index.tsx`

**Change the headline section:**

- Replace A/B test headline with the new compelling headline
- Update subheadline to emphasize the diagnose + fix value
- Keep the CTA button but update text to match

**Before:**
```tsx
<h1 className="text-4xl md:text-5xl font-bold...">
  {headline}  // from A/B test
</h1>
```

**After:**
```tsx
<h1 className="text-4xl md:text-5xl font-bold...">
  Invisible to AI? Fix It in Minutes.
</h1>
<p className="text-muted-foreground...">
  Check if ChatGPT, Perplexity, and Gemini mention your website — 
  then get a personalized optimization plan to boost your visibility.
</p>
```

---

### File 2: `src/components/ScanResultsModal.tsx`

**Add optimization CTA inside the modal** (after email unlock):

This is the critical funnel fix. After users unlock results:

1. Show a prominent "Get Your Optimization Plan" CTA card
2. Include value props: "Prompt-specific fixes", "Quick wins", "Competitor insights"
3. When clicked, either:
   - Generate the plan inline (add loading state + results in modal)
   - OR close modal and scroll to OptimizationHub with auto-trigger

**New section to add after unlocked results (around line 558):**

```tsx
{/* Optimization CTA - Only show when unlocked and score < 70 */}
{isUnlocked && scanData.score < 70 && (
  <div className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 
                  to-transparent border-2 border-primary/30 rounded-xl space-y-4 mt-4">
    <div className="flex items-center gap-2">
      <Wand2 className="h-5 w-5 text-primary" />
      <span className="font-semibold">Your Score Needs Improvement</span>
    </div>
    
    <p className="text-sm text-muted-foreground">
      Your visibility score of <strong>{scanData.score}</strong> means AI assistants 
      aren't recommending you. Get a personalized plan to fix this.
    </p>
    
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <span>Prompt-specific fixes</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span>Quick wins with tools</span>
      </div>
    </div>

    <Button 
      onClick={handleGetOptimizationPlan} 
      className="w-full"
    >
      <Wand2 className="mr-2 h-4 w-4" />
      Get Your Optimization Plan
    </Button>
  </div>
)}
```

**Add handler to close modal and scroll to OptimizationHub:**

```tsx
const handleGetOptimizationPlan = () => {
  onOpenChange(false); // Close modal
  
  // Small delay then scroll to optimization hub
  setTimeout(() => {
    const optimizationHub = document.getElementById('optimization-hub');
    if (optimizationHub) {
      optimizationHub.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};
```

---

### File 3: `src/components/OptimizationHub.tsx`

**Add ID for scroll targeting and auto-generate option:**

- Add `id="optimization-hub"` to the wrapper
- Optionally add `autoGenerate` prop to trigger plan generation immediately when user arrives from modal

**Current:**
```tsx
<Card className="shadow-lg border-2 border-dashed...">
```

**After:**
```tsx
<div id="optimization-hub">
  <Card className="shadow-lg border-2 border-dashed...">
```

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/pages/Index.tsx` | Modify | Replace A/B test headline with compelling fixed headline |
| `src/pages/Index.tsx` | Modify | Update subheadline to emphasize diagnose + fix |
| `src/components/ScanResultsModal.tsx` | Add | Add optimization CTA section after unlock |
| `src/components/ScanResultsModal.tsx` | Add | Add scroll handler to connect modal → hub |
| `src/components/OptimizationHub.tsx` | Modify | Add scroll target ID |

---

## Expected Impact

| Metric | Current State | After Changes |
|--------|---------------|---------------|
| Headline clarity | Generic "checker" | Compelling problem/solution |
| Funnel completion | Users miss OptimizationHub | Clear CTA guides them |
| Optimization plan usage | Low (hidden below fold) | High (prominent in modal) |
| User journey length | Disconnected steps | Seamless scan → optimize flow |

---

## Technical Notes

- The A/B test tracking will be removed from the headline but retained for CTA button variants
- The scroll-to-hub approach is simpler than inline optimization (avoids making modal too complex)
- The OptimizationHub already has all the logic — we just need to connect users to it
- Low-score threshold (70) is already defined in OptimizationHub, keeping it consistent

