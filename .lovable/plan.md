# Reposition Landing + Scan UX around Recommendation Intelligence

Today's homepage sells "AI Search Visibility Checker" and forces users to pick a business type, then write/edit prompts, before they get a score. The new product is about *opportunities and competitor wins*, not a score. This plan re-frames the landing page, the scan input, and the post-scan experience accordingly. Scope is **frontend only** — no edge function or schema changes.

## 1. Reframe the hero (src/pages/Index.tsx)

Replace the "AI Search Visibility Checker / Stop Being Invisible" hero block with an opportunity-first headline.

- **Headline:** "See Exactly Why ChatGPT, Gemini, and Perplexity Recommend Your Competitors Instead of You"
- **Subhead:** "Recommendation Intelligence shows the asset gaps, content moves, and citation patterns that win in your industry. Built on thousands of AI recommendation observations."
- **Primary CTA:** "Find My Opportunities — Free" (replaces "Check My AI Visibility")
- **Microcopy under CTA:** "No prompt setup. We benchmark you against your industry in under 60 seconds."
- Keep the A/B test hook but switch defaults to the new copy.
- Replace the "Most brands score below 30/100" line with "Average brand is missing 7 of the top 10 citation patterns in their industry."

## 2. Strip prompt creation from the primary path

The current scan card requires: domain → business type → optionally write a description → AI-generate prompts → edit textarea → scan. Replace with a single-field flow:

- New scan card: domain input + big "Run Scan" button, nothing else by default.
- Business type / prompt textarea move behind a single collapsible: **"Advanced: customize prompts"** (closed by default).
- On submit with no prompts: auto-generate via the existing `generate-prompts` edge function using the domain (and inferred business type = "Other"), then immediately call `scan`. Show a single combined progress state ("Analyzing your industry…") rather than two steps.
- Keep all existing limit checks and tracking events; just chain the calls.

## 3. Replace score-first post-scan with opportunity-first

The post-scan card today leads with a giant numeric score. Restructure to lead with opportunities and competitor context. The score becomes a small secondary chip.

New post-scan layout (in `Index.tsx`, replacing the current Results Card header and the early sections of the results body):

1. **Opportunity headline strip** (full-width, yellow accent):
  - "You're missing N high-impact opportunities competitors are using"
  - Computed from `scanData.results` competitor counts + locked recommendation count.
2. **Industry Benchmark strip** (new presentational component `IndustryBenchmarkStrip.tsx`):
  - Three tiles: *Your visibility* / *Industry median* / *Top quartile*, with the score reduced to a small comparative bar. Uses the existing `34/100` industry baseline already referenced.
3. **Why Competitors Win — preview** (new presentational component `WhyCompetitorsWinPreview.tsx`):
  - Anonymized top 3 peer brands from `result.geminiCompetitors` aggregated across prompts.
  - Per brand: name, # prompts they showed up in, "asset advantage" placeholder ("Strong on comparison pages").
  - CTA: "See the full Why Competitors Win breakdown →" linking to `/dashboard?tab=why-win` (signed-in) or `/auth?redirect=/dashboard?tab=why-win` (guest).
4. **Prompt-by-prompt visibility breakdown** moves *below* the above as a collapsible "Per-prompt diagnostics" (closed by default).
5. The score number remains, but as a small badge inside the benchmark strip — not the page focal point.

## 4. Surface Industry Benchmarks + Why Competitors Win on the landing page

Add two new sections between the scan card and existing SEO content:

- **"How your industry is winning right now"** — static teaser of the Why Competitors Win view: 3 example anonymized brand cards with asset-gap chips (Comparison pages, Reddit threads, Listicles). Uses the same visual language as `WhyCompetitorsWin.tsx`. Marketing-only, no live data on this section.
- **"Industry Benchmarks built into every scan"** — three-tile graphic explaining what users see post-scan (Asset-type gap, Competitor leaderboard, Recommendation Intelligence). Each tile links to `/dashboard?tab=recommendations|why-win|metrics`.

Replace the current "Built for Any Website…" and "Why AI SEO Visibility Matters" body copy to lead with competitor/benchmark language (keep the SEO-bearing keywords but reposition: "AI visibility tells you you're losing. Recommendation Intelligence tells you why and what to do.").

## 5. Post-scan upgrade banners

Reword the two upgrade CTAs in `Index.tsx`:

- Post-unlock banner → "Track your gaps weekly. Get new competitor moves the moment they appear."
- Post-optimization plan banner → "Save your action plan and watch competitors lose ground week over week."

## 6. Tracking & A/B safety

- Keep all existing `trackEvent` calls; add `opportunity_cta_click`, `benchmark_strip_view`, `competitor_preview_click` events for the new sections.
- A/B test variant values: extend the existing `headline` and `cta` variants in `useABTest` consumers with new defaults but do not remove old variants — they remain valid alternates.

## Files touched

```
src/pages/Index.tsx                                   (major)
src/components/IndustryBenchmarkStrip.tsx             (new, presentational)
src/components/WhyCompetitorsWinPreview.tsx           (new, presentational)
src/components/LandingBenchmarkTeaser.tsx             (new, marketing section)
```

## Out of scope

- No changes to `scan` edge function, recommendations schema, dashboard tabs, or `WhyCompetitorsWin.tsx`.
- No changes to pricing, auth, or onboarding flows beyond copy.
- No changes to the email-gate / unlock mechanic — only the surrounding presentation.

## Technical notes

- New components are pure presentation; they accept `scanData` props from `Index.tsx`.
- Do not hardcode Industry Median = 34 and Top Quartile = 55. Use estimated benchmarks or real data only
- Auto-prompt path reuses `supabase.functions.invoke('generate-prompts', …)` already imported in `Index.tsx`; on failure we fall back to the existing `BUSINESS_TYPE_PROMPTS.Other` template so the scan never blocks on prompt generation.  
Add an optional Competitor field beside Domain in the primary scan flow.  
  
One Additional Section I'd Add
  Between Hero and Scan:
  ```
  How AI Chooses Brands
  ```
  Visual:
  ```
  AI Question
  ↓
  Competitor Appears
  ↓
  We Show Why
  ↓
  You Fix It
  ↓
  AI Mentions You More
  ```
    


&nbsp;