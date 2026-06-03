AI Mention You → AI Recommendation Intelligence

Architecture Document (no code in this phase)

This document is the deliverable. It defines the system we'll build over the next phases. Today's scanner becomes a data collection engine; the moat becomes the dataset, the proprietary metrics, and the competitor/citation intelligence layered on top.

---

1. Strategic Frame

**Old positioning**: "Track if AI mentions your brand."
**New positioning**: "Know *why* AI recommends brands — and what to do about it."

Three product surfaces, in order of moat strength:

**Private intelligence** (paid app) — per-customer Why-They-Win answers.

**Proprietary metrics** (defensible IP) — formulas competitors can't recreate without our dataset.

**Public AI Visibility Index** (SEO + lead gen) — category leaderboards, updated continuously.

All three feed from one shared, privacy-safe global dataset.

---

2. Four-Layer System Architecture

+-------------------------------------------------------------+
|  Layer 4 — Recommendation Engine                            |
|  Prioritized actions w/ expected impact, confidence, effort |
+-------------------------------------------------------------+
                          ^
+-------------------------------------------------------------+
|  Layer 3 — Competitor Intelligence Engine                   |
|  Why Competitor A wins: missing pages, citations, clusters  |
+-------------------------------------------------------------+
                          ^
+-------------------------------------------------------------+
|  Layer 2 — Citation Intelligence Engine                     |
|  Classify every source URL. Compute proprietary metrics.    |
+-------------------------------------------------------------+
                          ^
+-------------------------------------------------------------+
|  Layer 1 — Data Collection Engine (today's scanner, evolved)|
|  Raw responses, citations, competitors, prompts, industries |
+-------------------------------------------------------------+
                          |
                          v
              +------------------------------+
              |  Global Anonymized Dataset    |
              |  (the moat — see Section 5)   |
              +------------------------------+
                          |
                          v
              +------------------------------+
              |  Public AI Visibility Index   |
              +------------------------------+

---

3. Database Schema (new + extended)

Extend existing

`scans` → add `industry_id`, `topic_cluster_id`, `language`.

`scan_results` → add `perplexity_response`, `perplexity_cited`, `chatgpt_*`, `claude_*` columns (today only Gemini/search are first-class). Add `citation_urls jsonb[]` (full URLs, not just domains).

New tables

`**industries**` — canonical taxonomy (CRM, PM, Email, Ecom platforms, …). Slug, name, parent_id, prompt_seed_pack.

`**topic_clusters**` — sub-categories within industries (e.g. "CRM for agencies", "open-source PM tools"). Used for index pages.

`**citation_sources**` *(domain registry — the lookup cache)*

`domain` (PK), `domain_type` enum: reddit | forum | news | blog | directory | review_site | youtube | official | github | other

`authority_score` int (we compute; updated weekly)

`classified_at`, `classification_method` (pattern | llm | manual)

`is_pattern_matched` bool

`**citations**` *(per-scan-result extracted citations)*

`id`, `scan_result_id`, `engine` (gemini/chatgpt/perplexity/claude/overviews), `url`, `domain`, `source_type` (denormalized from citation_sources), `cites_brand` text (which brand the citation supports), `position` int   
content_assets

Purpose:

Track which content assets are repeatedly cited and associated with winning recommendations.

Fields:

id

brand_name

url

asset_type

comparison_page

listicle

directory_listing

reddit_thread

forum_thread

review_page

blog_article

landing_page

news_article

industry_id

citation_count

authority_score

first_seen

last_seen

This table powers future recommendations such as:

"Competitor appears in 17 comparison pages."

"Competitor is cited by 24 Reddit discussions."

"Competitor owns 12 industry listicles."

`**brand_observations**` *(every brand seen across every scan, normalized)*

`id`, `scan_result_id`, `brand_name` (normalized), `is_customer_brand` bool, `position` int, `cited` bool, `engine`

`**global_intelligence**` *(the moat — anonymized rollup, see Section 5)*

`id`, `industry_id`, `topic_cluster_id`, `engine`, `winning_brand`, `citation_domain`, `source_type`, `prompt_template_hash`, `observation_count`, `period_start`, `period_end`

No customer identifiers. No raw prompts. No private domains.

`**industry_leaderboard**` *(materialized; powers the public index)*

`industry_id`, `period`, `brand`, `visibility_score`, `citation_authority_score`, `trust_source_density`, `recommendation_strength`, `rank`, `delta_vs_previous`

`**proprietary_metrics_cache**` *(per scan)*

`scan_id`, metrics jsonb (CAG, CIS, TSD, RSS — defined Section 4), `computed_at`

`**recommendations**` *(replaces/augments `optimization_tasks`)*

`id`, `scan_id`, `user_id`, `title`, `evidence` jsonb (citation IDs, competitor IDs that produced this rec), `expected_impact` int (visibility points), `confidence` int (0-100), `difficulty` enum, `time_estimate_minutes`, `category` (citation | content | authority | comparison | technical), `status`  
recommendation_outcomes

Purpose:

Track whether recommendations actually improved visibility.

Fields:

recommendation_id

baseline_rss

rss_after_14_days

rss_after_30_days

actual_impact

success_flag

measured_at

This enables future learning:

"Recommendations involving comparison pages increase RSS by an average of 11 points."

This becomes another proprietary dataset.

Privacy rules (enforced at insert)

`global_intelligence` writes use a trigger that drops `customer_brand` rows when `is_customer_brand = true`, replacing with hashed slug.

`prompt_template_hash` = sha256 of normalized prompt template (stopwords stripped, brand tokens removed). Raw prompts never leave `scans`.

Industry-level aggregation requires `observation_count >= 5` before exposure to public index (k-anonymity).

---

4. Proprietary Metrics — Formulas

These are the defensible IP. Each is computable only with our aggregated dataset.

Engine Weighting Layer

Not all AI engines should contribute equally.

Add:

engine_weights

engine

weight

last_updated

Default example:

ChatGPT = 40%

Gemini = 30%

Perplexity = 20%

Claude = 10%

All recommendation metrics should support weighted calculations so visibility reflects real-world AI market share.  
Citation Authority Gap (CAG)

`CAG(brand) = mean(authority_score of competitor citations) − mean(authority_score of brand citations)`
Positive = competitors are cited by stronger sources. Drives "go earn citations on G2, Reddit, NYT-tier" recommendations.

Citation Influence Score (CIS)

For each citation domain `d` in industry `i`:
`CIS(d, i) = (# prompts where d appears AND a brand it cites wins) / (# prompts where d appears)`
Tells us which domains *actually move* AI recommendations vs. just appear.

Trust Source Density (TSD)

`TSD(brand) = unique citation domains supporting brand / total prompts where brand appeared`
Low = brand depends on 1-2 sources (fragile). High = diversified trust.

Recommendation Strength Score (RSS)

Composite per brand per industry:
`RSS = 0.35*mention_rate + 0.25*citation_rate + 0.25*mean_position_inv + 0.15*TSD`
Drop-in replacement for today's 60/20/20 visibility score, but cross-engine and source-aware.

Competitor Outperformance Index (COI)

`COI(you, competitor) = RSS(competitor) − RSS(you)` decomposed by component, so the UI can say *"You lose 8 points on citation_rate, 3 on TSD"*.

All five are computed in `proprietary_metrics_cache` after each scan and exposed through the dashboard and API.

---

5. Global Anonymized Dataset (the moat)

**What we store per scan (anonymous):**

industry_id, topic_cluster_id

engine

prompt_template_hash (never the raw prompt)

winning brands (top 3 mentioned, top 3 cited) — public/well-known brands only; customer's own brand is hashed

citation domains + source_type

positions

timestamp bucketed to day

**What we never store:**

Customer's own domain or brand identity

Raw prompts

Uploaded content

API keys

Any PII

**Why it compounds:**

Every paying customer's scans enrich the industry benchmarks all other customers see.

After N months we can answer: "Across 12,000 CRM prompts, Reddit citations correlate with winning at r=0.62" — no competitor without our scan volume can claim that.

Same dataset powers the public index (Section 7) which drives SEO which drives more signups which drives more data. Flywheel.

---

6. Dashboard Structure (revised IA)

Current dashboard has 5 tabs (Overview, My Domains, Action Plan, Competitors, Auto-Fix). Replace with 4 intelligence-first views:

**Recommendation Intelligence** *(landing)*

RSS score + COI decomposition vs. top 3 competitors

"Top 5 actions, ranked by expected impact" (from `recommendations` table)

One-line headline: *"You'd gain ~14 visibility points by closing 3 citation gaps."*

**Why Competitors Win** *(replaces Competitors tab)*

Per competitor: their CIS-weighted citation map, content cluster footprint, prompt categories where they dominate

Evidence panel: "Competitor X appears in 43% of CRM prompts because they're cited by [G2, Reddit r/CRM, TechCrunch]. You're cited by [own blog]."

**Citation Map** *(new)*

Sankey: prompts → citation domains → brands recommended

Filter by engine, industry, topic cluster

Per-domain drilldown: authority, CIS, which competitors use it

**Scans & History** *(retains today's My Domains + Scan History + Auto-Fix outputs, demoted)*

Action Plan disappears as a tab; recommendations surface contextually inside views 1–3.

---

7. Public AI Visibility Index — Architecture

**URL pattern**: `/index/[industry-slug]` and `/index/[industry-slug]/[cluster-slug]`
Examples:

`/index/crm`

`/index/project-management/for-agencies`

`/index/email-marketing`

**Page content (generated from `industry_leaderboard`):**

Top 20 brands ranked by RSS

Per-brand: CIS top sources, TSD, week-over-week delta

"How we measure" → links to methodology page (also SEO content)

Embed widget (`<iframe>` snippet) so brands link to us → backlinks

Methodology page per metric → topical authority cluster

**Generation pipeline:**

Weekly cron runs seed prompts per industry (we own the prompt seed packs), aggregates results into `industry_leaderboard`, regenerates static pages, pings sitemap.

Each leaderboard page emits JSON-LD `Dataset` + `ItemList` schema.

**Distribution:**

Sitemap entries for every industry/cluster

Weekly "Movers & Shakers" email digest (uses email infra already built)

Public API endpoint `/api/index/[industry]` for press/research citations → more backlinks

---

8. Competitive Intelligence Workflow (per scan)

scan submitted  
    -> Layer 1: query all engines, store raw in scan_results  
    -> extract citations (URL parser) -> citations table  
    -> classify domains: pattern match -> citation_sources cache  
       miss -> LLM classify -> upsert cache (hybrid as chosen)  
    -> normalize brand mentions -> brand_observations   
 extract content assets comparison pages

directory listings

review profiles

reddit threads

forum discussions

blog articles

news mentions

-> content_assets table  
    -> compute proprietary metrics -> proprietary_metrics_cache  
    -> write anonymized rollup -> global_intelligence (privacy trigger)  
    -> generate recommendations (evidence = citation_ids + competitor_ids)  
    -> refresh affected industry_leaderboard rows (async)

Every recommendation is tied to observed competitor data — no generic SEO advice allowed in the `recommendations` table (validated by a `evidence IS NOT NULL` check constraint).

---

9. Citation Intelligence Workflow

new citation URL
    -> extract domain
    -> lookup citation_sources
         hit -> use cached source_type + authority_score
         miss -> pattern match (regex set for reddit/g2/capterra/news TLDs/...)
              hit -> insert cache (method=pattern)
              miss -> LLM classify (gemini-flash) -> insert cache (method=llm)
    -> compute CIS contribution for this (domain, industry, prompt_hash)
    -> if domain authority_score stale (>7 days) -> async refresh

---

10. Revenue Model (revised)

Keep current tiers, reposition value:


| Tier        | Today               | New positioning                                                                                            |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Free        | 1 scan, basic score | Score + 1 competitor decomposition (taste of COI)                                                          |
| Pro $19     | Scans + suggestions | + full Recommendation Intelligence, CAG/TSD, weekly auto-scans                                             |
| Team $49    | More scans          | + Citation Map, competitor watchlist, industry benchmark access                                            |
| Agency $149 | Bulk scans          | + multi-client workspaces, API access to global_intelligence (aggregated), white-label public index embeds |


**New revenue lines:**

**Industry Reports** ($199 one-off): PDF deep-dive per industry, generated from `industry_leaderboard` + LLM narrative. Same engine as today's $9 premium PDF, scaled up.

**Data API** (enterprise, custom): query `global_intelligence` aggregates. This monetizes the moat directly.

**Sponsored Index methodology pages**: long-term, low-priority.

Outcomes-based pricing experiment (Phase 3): "+10 RSS in 30 days or refund" — only viable once recommendations engine is proven.

---

11. Features that get more valuable with more customers

These are the network-effect flywheel features:

**Industry RSS benchmarks** — accuracy improves with sample size.

**Citation Influence Score** — only meaningful with cross-customer prompt volume.

**Public AI Visibility Index** — more data → more categories covered → more SEO traffic → more signups.

**"Brands like you" cohort** — once we have ≥50 brands per industry, suggest peer comparisons.

**Prompt seed pack auto-discovery** — clustering customer prompts within an industry reveals canonical question patterns nobody hand-curated.

**Authority decay tracking** — observing CIS drift over time tells us when a source (e.g. a subreddit) is losing influence with AI engines. Unique to us.

---

12. Phasing (no code yet — this is the build order once approved)

**Phase 1 (architecture-aligned MVP, ~3 weeks)**

Schema migration: industries, topic_clusters, citation_sources, citations, brand_observations, global_intelligence (with privacy trigger), proprietary_metrics_cache, recommendations

Scan pipeline rewrite: citation extraction + hybrid classification

Compute CAG, CIS, TSD, RSS, COI

Dashboard: ship "Recommendation Intelligence" and "Why Competitors Win" views

Backfill: re-process existing `scan_results` to seed citations + global_intelligence

**Phase 2 (~2 weeks)**

Public AI Visibility Index pages + leaderboard cron + JSON-LD + sitemap + embed widget

Citation Map view

Weekly digest email

**Phase 3 (~2 weeks)**

Evidence-bound recommendation engine v2 with impact/confidence/difficulty

Industry Reports (paid PDF)

Data API (aggregated) for Agency tier

**Phase 4 (post-validation)**

WordPress / Shopify / Webflow integrations and one-click publishing — only after Phase 1–3 prove the intelligence layer holds users.

---

13. Open questions to resolve before Phase 1 build

**Industry taxonomy source** — do we hand-seed the first 20 industries, or auto-cluster from existing `scans.project_domain` history?

**Brand normalization** — same brand appears as "HubSpot", "Hubspot", "hubspot.com". Fuzzy match threshold? (proposal: trigram + manual alias table)

**Public index launch breadth — launch 10 high-value industries first.**

**Recommended launch categories:**

**CRM**

**Email Marketing**

**Project Management**

**Ecommerce Platforms**

**Help Desk**

**Website Builders**

**Marketing Automation**

**AI Writing Tools**

**Accounting Software**

**Team Communication**

**Expand after validating index traffic and citation quality.**

**Backfill cost** — re-classifying historic citations through hybrid pipeline has an LLM bill. Cap at N most-recent scans?

---

14. Technical details (for the engineer, not the founder)

Privacy trigger on `global_intelligence` insert: `BEFORE INSERT` plpgsql that null-checks identifiers and enforces `prompt_template_hash IS NOT NULL`.

Brand normalization function: `public.normalize_brand(text) RETURNS text` — lowercase, strip TLDs, strip "Inc/Ltd", trigram-resolve against `brand_aliases`.

All new public-schema tables get `GRANT` blocks + RLS in the same migration.

`industry_leaderboard` is a materialized table refreshed by a Supabase cron edge function (not a Postgres MATERIALIZED VIEW, so we can refresh per-industry).

Citation classifier edge function: `classify-citation` with in-memory regex set + LRU cache + LOVABLE_API_KEY fallback to gemini-2.5-flash-lite.

Recommendations engine is a new edge function `generate-recommendations` that replaces `generate-optimization-plan`; old function stays as fallback until Phase 1 validation passes.

---

This is the architecture. Approve it (or push back on sections) and we move to Phase 1 build.