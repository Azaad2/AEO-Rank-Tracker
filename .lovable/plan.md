# Landing page polish — pre-publish

Frontend-only refinements in `src/pages/Index.tsx` plus one CTA fix in `src/pages/About.tsx`. No edge function, schema, or backend work.

## 1. Shorter hero headline

`src/pages/Index.tsx` (~L519–528):

- Replace two-line headline with a tighter one:
  - **H1:** "Why AI Recommends Your Competitors — Not You."
  - Yellow accent on "Not You."
- Drop font sizes one step (`text-3xl sm:text-4xl md:text-5xl lg:text-6xl`) so the line fits on one row on desktop and two on mobile.
- Trim subhead to one sentence: "Recommendation Intelligence reveals the asset gaps and citation patterns winning your industry across ChatGPT, Gemini, and Perplexity — in under 60 seconds."

## 2. Replace "500+ brands" social proof with AI-engine trust row

`src/pages/Index.tsx` (~L544–565). The brand count isn't verified, so swap the avatar cluster + "500+ brands" line for an engine-coverage trust indicator:

```
Analyzing recommendations from
[ChatGPT]  [Gemini]  [Perplexity]  [Claude]
Updated continuously · Citation-grade evidence
```

- Render as 4 pill chips (text labels, no logos to avoid trademark issues) with a small check or sparkle icon.
- Keep yellow accent on the engine names.
- Remove the colored letter avatars and "500+ brands" string entirely.

## 3. Concrete examples inside "How AI Chooses Brands"

`src/pages/Index.tsx` (~L569–599). Keep the 5-step flow; add a one-line concrete example under each step so the abstraction lands:


| Step               | Current desc                            | Add example                                                      |
| ------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| AI Question        | Buyers ask ChatGPT, Gemini, Perplexity. | e.g. "best CRM for small agencies"                               |
| Competitor Appears | Someone else gets named — not you.      | Cited via a G2 comparison page                                   |
| We Show Why        | Asset gaps + citation patterns.         | You're missing comparison pages, Reddit threads, review profiles |
| You Fix It         | Evidence-bound action plan.             | Ship a "/vs/competitor" page + claim G2 profile                  |
| AI Names You       | Visibility compounds week over week.    | Mentions appear in Perplexity in ~2 weeks                        |


Render the example as a smaller line below `desc` in a muted yellow (`text-yellow-400/70 text-[10px]`).

## 4. Real competitor intelligence example below the hero

New section inserted between the hero (~L567) and "How AI Chooses Brands" (L569). Static, hard-coded illustrative data so visitors instantly understand the output without scanning.

Layout: a single Card titled **"What you get back — example: project-management.com"** with three stacked rows:

```
Prompt: "best project management software for remote teams"
─────────────────────────────────────────────────────────
Cited:    Asana · Monday · ClickUp        (3 competitors)
You:      Not mentioned
Why they win:
  • Asana  — strong on /alternatives pages + Reddit r/productivity
  • Monday — owns 4 listicles ("Top 10 PM tools 2026")
  • ClickUp — claimed G2/Capterra profiles, active changelog
Your move: Publish "/alternatives/asana" + claim G2 profile  →  +18% projected visibility
```

- Implement inline in `Index.tsx` (no new component file — keep scope tight).
- Use existing `Card`, `Badge`, and yellow accents from the design system.
- Small "Example output" badge in the corner so it's not mistaken for live data.
- CTA at the bottom: "Run this on your domain →" that scrolls to `#scan`.

## 5. Replace remaining "Check My AI Visibility" CTAs

- `src/pages/About.tsx:85` → "Find My Opportunities — Free"
- Audit `src/pages/Index.tsx` for any lingering "Check My AI Visibility" strings; current copy already uses `ctaText` ("Find My Opportunities — Free") so this should just be the About page fix. Verify with a final grep before finishing.
- Leave the blog FAQ string in `AIVisibilityCheckerGuide.tsx` alone — it's an editorial question, not a CTA.

## Out of scope

- A/B test variant catalog (defaults already updated; old variants remain valid).
- `LandingBenchmarkTeaser.tsx`, `WhyCompetitorsWinPreview.tsx`, scan flow, dashboard, edge functions.
- Logo usage for AI engines (text-only chips to avoid trademark risk).

## Files touched

```
src/pages/Index.tsx   (hero copy, trust row, How-AI-Chooses examples, new example card)
src/pages/About.tsx   (one CTA string)
```

Approved.

Two final adjustments before publish:

1. Remove "+18% projected visibility" from the example card and replace it with a non-numeric outcome label such as "Expected Impact: High" or "Top Recommendation".
2. Make the example output card visually dominant and closely resemble an actual report users receive after a scan.

Optional A/B test:  
"Why ChatGPT, Gemini & Perplexity Recommend Your Competitors — Not You"

Everything else is approved for implementation.