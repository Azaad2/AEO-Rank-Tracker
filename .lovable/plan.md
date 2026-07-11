# Make Recommendations Visual & Instantly Understandable

You're right — the current cards still lean on paragraphs of text. A non-technical business owner should **see the story in a chart** before they read a single word. This plan adds visual data storytelling to every card, without touching any backend calculation.

## What changes on each recommendation card

### 1. A hero visual at the top of every card
Instead of leading with text, each card leads with a small chart that instantly shows the problem:

- **"AI mentions you" cards** → horizontal bar chart: **You vs Top competitor vs Industry average** (values from `industry_benchmark` + `competitor_examples`)
- **"Gap vs competitors" cards** → gap thermometer: colored bar showing where you sit between 0 and the leaders
- **"Get on more websites" cards** → dot chart: each dot = a website mentioning you today, greyed dots = websites mentioning competitors that don't mention you
- **Fallback (no peer data yet)** → a simple "projected gain" ring showing `+X% more AI visibility`

All charts are pure SVG/divs (no chart library needed) — small, dark-theme, yellow accent.

### 2. A one-sentence plain-English headline above the chart
Auto-generated from the same data, e.g.:

> "AI mentions **Notion** and **Airtable** 4× more than your brand for this topic."

Not "TSD is below peer median."

### 3. Trend arrow when we have previous-scan data
If `evidence` contains prior values, show `↑ improving` / `↓ getting worse` / `→ flat` next to the number, with color.

### 4. Compact "at-a-glance" strip replaces the current 3 badges
One row, 4 tiles:

```text
[ Impact  ★★★★★ ] [ Effort  🟢 Easy ] [ Time  ~2 hrs ] [ Gain  +9% ]
```

Same data, just laid out as scannable tiles instead of prose.

### 5. Rewrite remaining copy for a business owner
- "Why this matters" → 1 sentence max, no metric codes
- "What happens if you skip this" → 1 sentence, plain outcome
- "What you get once it's done" → keep the 3 bullets (already good)
- Remove the "We're still gathering enough industry data to compare you here" empty block when we have zero peer data — replace with the projected-gain ring so the card never looks empty

### 6. Executive summary (AI Growth Brief) gets a mini visualization
- Add a **health gauge** (semicircle 0–100) instead of just a number
- Add a **stacked bar** showing Urgent / Quick wins / Bigger projects at a glance

## What does NOT change
- No backend, edge function, DB, or calculation changes
- `priority_score`, `projected_metric_delta`, `industry_benchmark`, `competitor_examples`, `evidence` all read exactly as today
- No new dependencies — charts are hand-rolled SVG so bundle size stays flat

## Files touched
- `src/components/dashboard/RecommendationCard.tsx` — new visual header, tile strip, trend arrows, tightened copy
- `src/components/dashboard/AIGrowthBrief.tsx` — add health gauge + stacked bar
- `src/components/dashboard/recommendations/RecCharts.tsx` *(new)* — small reusable SVG chart primitives (BarCompare, GapMeter, DotGrid, GainRing, HealthGauge)

## Result
Open the page → within 5 seconds a user sees:
1. A chart showing *why they're losing*
2. A one-line sentence naming *who is beating them*
3. Four tiles telling them *how big, how hard, how long, how much gain*
4. Then, only if they want detail, the text sections below

That's the "AI consultant, not database" feel you asked for.
