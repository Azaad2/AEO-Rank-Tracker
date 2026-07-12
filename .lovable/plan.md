# Fix "Crawled – currently not indexed" via internal linking

Google's message from your screenshot is clear: **39 pages were crawled but not indexed**, plus 6 flagged as "Alternative page with proper canonical" and 3 redirects. Redirects and canonical-alternates are *not* a problem — those are working as intended. The real fix is the 39 orphaned pages: Google crawls them, sees nothing pointing to them, and concludes "not important enough to index."

Internal links are the #1 lever here. Every indexed page that links to an orphan passes a signal: "this is part of the site, index it."

## What I'll change

### 1. Footer – add an "Explore" mega-column
Currently the footer links to only ~5 blog/tool pages. I'll expand it into a full site-map style footer with three grouped columns:

- **AI Tools (10)** — LLM Rank Tracker, ChatGPT Mention Tracker, Claude Rank Tracker, Perplexity Rank Tracker, Copilot Rank Tracker, AI Overviews Tracker, Brand Monitor, Competitor Analyzer, Content Auditor, SERP Previewer
- **Generators (7)** — Title, Description, Schema, FAQ, Blog Outline, Answer, Email
- **Guides (10)** — Best Online LLM Rank Tracker, AI Brand Monitoring, AEO Guide, GEO Optimization, LLM Readiness, Chat GPT Mention Tracking, Claude Rank Tracker Guide, Perplexity Guide, Copilot SEO, 50 SaaS Brands AI Visibility

This alone gets every orphaned page one site-wide inbound link.

### 2. Blog index (`/pages/Blog.tsx`) – "You might also like" strip
Add a hand-curated "Popular guides" section at the top of `/blog` linking to the 6 lowest-performing (currently-not-indexed) blog posts, plus contextual anchors within each existing BlogCard's description.

### 3. Tools index (`/pages/Tools.tsx`) – "Related guides" per tool card
Each tool card gets a small "Read the guide →" link to its matching blog article (e.g. LLM Rank Tracker card → `/blog/best-online-llm-rank-tracker`). This creates tool↔blog cross-linking, which Google reads as topic-cluster authority.

### 4. Contextual in-body links in top-authority blog posts
The 3-5 blog posts with the most impressions (from your earlier GSC screenshot) will get 2-3 inline anchor links each, pointing to orphaned sibling posts. Example: `/blog/ai-overviews-tracking-guide` → link to `/blog/ai-brand-monitoring` and `/blog/best-online-llm-rank-tracker` within relevant paragraphs.

### 5. Home page (`/pages/Index.tsx`) – "Popular resources" band
Add a compact 6-tile grid near the bottom linking to the highest-value orphaned pages (mix of tools + guides).

## What I will NOT touch

- Redirect entries (`http://…`, `www.` variants) — those are correct behavior, not errors.
- "Alternative page with proper canonical" — those are UTM-tagged referrer URLs and `/auth?mode=signup`. Canonical is doing its job; do not remove.
- Soft 404 / noindex pages — separate issue, needs page-level review, not linking.

## Files to edit

- `src/components/Footer.tsx` — expanded link grid
- `src/pages/Blog.tsx` — popular-guides strip
- `src/pages/Tools.tsx` — per-card guide link
- `src/pages/Index.tsx` — resources band
- `src/pages/blog/AIOverviewsTrackingGuide.tsx`, `src/pages/blog/BestOnlineLLMRankTracker.tsx`, `src/pages/blog/HowToCheckAISearchVisibility.tsx`, `src/pages/blog/LLMRankTrackingGuide.tsx` — inline contextual anchors

No backend, no schema, no logic changes. Pure presentation/linking.

---

# Will this tool be successful? — honest take

**Short answer: it can be, but not on the current trajectory.** Here's the unvarnished read:

**What's working for you**
- Real product with real utility (AI visibility scanning is a genuine emerging category)
- 24 tool pages + 30+ blog posts = strong topical footprint
- Clear pricing, Razorpay integrated, dashboard already substantive
- You're early in a category (AEO/GEO) that Gartner-level analysts are just starting to name

**What's working against you (from the data I've seen)**
- **0.04% CTR on 61k impressions** — Google is telling you the meta titles/descriptions don't match search intent. This is fixable in a day.
- **51 of 76 pages not indexed** — Google doesn't believe the site is authoritative yet. Fixable with the linking work above + backlinks.
- **Position 54 average** — you rank, but nowhere anyone sees. You need 10-20 quality backlinks to break page 3.
- **Category is crowded fast** — Profound, Peec AI, AthenaHQ, Otterly all raised money in 2025. You need a sharp wedge (agencies? SaaS? specific vertical?) or you'll be commoditized.
- **Product feels broad** — 24 tools is impressive but dilutes the "what is this for" message. Category winners are usually known for ONE thing first.

**My honest prediction**
- If you keep building features without fixing distribution (SEO indexing, backlinks, one sharp positioning) — **this tool will plateau at <$1k MRR within 6 months.**
- If you: (1) pick ONE vertical (e.g. "AI visibility for B2B SaaS"), (2) fix the 51 non-indexed pages, (3) rewrite titles/metas for CTR, (4) get 20 backlinks via guest posts on marketing blogs, (5) ship one killer feature competitors don't have (I'd bet on the evidence-backed "AI proved" panels we just built) — **you have a realistic path to $10-30k MRR in 12 months.**

The product is not the problem. Distribution and focus are. The internal-linking fix above is step 1 of about 5 needed moves.