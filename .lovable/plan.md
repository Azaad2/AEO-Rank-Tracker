## AI Prompt Intelligence Engine — build on what we already have

Good news: the anonymized data pipeline is already live. Every scan writes into `global_intelligence` (currently 1,715 rows across 2,028 scan contributions) via the `rollup-intelligence` edge function, using `prompt_template_hash` + industry + topic cluster + engine + winning_brand + citation_domain grain. The privacy trigger (`enforce_global_intelligence_privacy`) already strips URLs/emails and enforces the closed asset-type enum. Brand aliases + normalize_brand are in place.

So we don't need to build data collection — we need to **derive intelligence from it and surface it**. That's exactly what this plan does. No mock data anywhere; every number comes from `global_intelligence` / `scans` / `scan_results`.

### 1. Derivation layer (SQL + one edge function)

**New table: `prompt_clusters**` (schema-owned, service_role writes)

- `id`, `cluster_label`, `industry_id`, `topic_cluster_id`, `representative_prompt`, `member_hashes text[]`, `intent`, `commercial_intent_score`, `updated_at`.
- Populated by clustering job (see §3). One row per emergent cluster.

**New table: `prompt_intelligence_daily**` (materialized rollup, one row per prompt_template_hash per day)

- `prompt_template_hash`, `day`, `industry_id`, `scan_count`, `citation_frequency`, `distinct_brands`, `distinct_domains`, `top_engines text[]`, `top_brands jsonb`, `top_domains jsonb`.
- Refreshed nightly from `global_intelligence` + `global_intelligence_scan_contributions`.

**New view: `prompt_intelligence_trending**` (public read)

- Computes for each prompt_template_hash: `scans_7d`, `scans_prev_7d`, `growth_pct`, `citation_freq_7d`, `distinct_industries`, `freshness_days`, and a composite `opportunity_score` (weighted: popularity 30 + growth 30 + citation_freq 15 + commercial_intent 15 + freshness 10, capped 0–100).
- Trend bucket derived: `exploding` (>+50%), `growing` (>+10%), `stable` (±10%), `declining` (<-10%).

**New edge function: `intelligence-refresh**` (verify_jwt=false, admin-callable + nightly cron)

- Rebuilds `prompt_intelligence_daily` for the last 30 days.
- Runs the clustering pass (see §3).
- Scheduled via pg_cron nightly at 03:00 UTC.

### 2. Prompt-text recovery for display

`global_intelligence` intentionally stores only hashes — we can't show a hash to users. We already keep raw prompts in `scan_results.prompt` (per-scan, not anonymized publicly). Approach:

- For every hash, pick a **representative prompt** = the most recent prompt whose hash matches, scrubbed by the same brand-substitution rules used to hash it (reusing `hashPromptTemplate`'s normalization).
- Stored on `prompt_clusters.representative_prompt` and on a small helper table `prompt_hash_display(prompt_template_hash PK, display_text, updated_at)` refreshed nightly. Nothing user-specific ever surfaces — brands are substituted to `<brand>` → then re-templated to "your industry" for display.

### 3. Clustering (embeddings, deterministic)

- One-shot per refresh: pull all hashes seen in last 90 days that lack a cluster.
- Call Lovable AI Gateway `text-embedding-3-small` on each representative prompt.
- Greedy cosine-similarity grouping at 0.82. Assign a cluster label via one Gemini-flash call per cluster (label + intent classification: Commercial / Informational / Comparison / Problem / Buying / How-to).
- Cheap: ~200 hashes × 1 embedding call each = well under 1¢. Only new hashes get called.

### 4. User-facing surfaces

**New dashboard tab "Prompt Intelligence"** (`?tab=intelligence`, placed between Recommendations and Citations, visible after first scan).

Sections on that page, all reading real data:

1. **🔥 Trending in your industry** — top 10 prompts from `prompt_intelligence_trending` filtered by the user's inferred `industry_id` (from their latest scan's classification), showing growth %, opportunity score, trend bucket badge, top engines, top competitors, "Track" button that adds it to their `monitoring_prompts`.
2. **Industry pulse** — small stat strip: total scans in industry this week, fastest-growing cluster, most cited domain, most recommended competitor.
3. **Prompt opportunities** — table sorted by opportunity_score, with filters (Intent, AI Platform, Time 7/30/90d). Row → detail drawer.
4. **Opportunity drawer** — competitors already winning (from `global_intelligence.winning_brand`), pages/domains cited (from `citation_domain`), engines that surface it, per-engine share, "Generate content" buttons that deep-link to existing tools (blog outline, FAQ, comparison) with the prompt pre-filled. No duplicate generators.

**Homepage widget** on `HomeOverview`: "🔥 This Week's AI Opportunities" — top 3 exploding prompts for user's industry, CTA to full page.

### 5. Admin global dashboard

New route `/admin/intelligence` (behind existing `AdminGuard`):

- Most scanned industries / prompts / competitors (7d / 30d).
- Fastest growing clusters.
- Most recommended domains, most cited domains.
- Top emerging topics (clusters with `freshness_days < 14` and `scans_7d > 5`).
- All queries hit `global_intelligence` and the new views.

### 6. Architecture for future providers

The `intelligence-refresh` function reads from a `signal_sources` folder pattern:

- `signals/internal.ts` — our own scans (only source in v1).
- `signals/external/google_autocomplete.ts`, `signals/external/reddit.ts` — stubbed interfaces that return `SignalRow[]`, wired but disabled behind a `provider_enabled` flag row. Adding a provider later means implementing the interface + flipping the flag. Documented in a `README.md` next to the function.

### Files

**Migration** (new):

- `prompt_clusters`, `prompt_intelligence_daily`, `prompt_hash_display` tables (grants + RLS: public read on trending/cluster metadata, service_role writes; no user data anywhere).
- View `prompt_intelligence_trending`.
- pg_cron job → nightly call to `intelligence-refresh`.

**Edge functions** (new):

- `supabase/functions/intelligence-refresh/index.ts` + `signals/*.ts`.
- Registered in `supabase/config.toml`.

**Frontend** (new):

- `src/components/dashboard/PromptIntelligence.tsx`
- `src/components/dashboard/OpportunityDrawer.tsx`
- `src/components/dashboard/TrendingIntelligenceWidget.tsx`
- `src/pages/admin/Intelligence.tsx`

**Edited**:

- `src/pages/Dashboard.tsx` — new tab case.
- `src/components/dashboard/DashboardSidebar.tsx` — new entry.
- `src/components/dashboard/HomeOverview.tsx` — mount widget.
- `src/App.tsx` — register admin route.

### What is explicitly NOT in this build

- No mock/generated prompts. Every prompt shown is one we've actually observed being asked in a scan.
- No external providers wired live (only the pluggable interface + stubs).
- No content auto-generation UI duplicated — drawer deep-links to existing tools.
- No per-user prompt-level PII exposed publicly; only aggregated grain surfaces globally.

### Confirm before I build

1. OK to defer live wiring of external providers (Google Trends / Reddit / Quora / etc.) and only build the pluggable stubs? First-party data is already the moat you described.
2. OK that "Generate Article / FAQ / Comparison" buttons deep-link to the existing tool pages with the prompt pre-filled, instead of embedding new generators inside the drawer?
3. Cadence: nightly refresh (03:00 UTC) enough, or do you want hourly? Nightly is cheap and matches the daily grain we already store.

Reply "go" (with any changes to #1–#3) and I'll ship it.  
  
GO.

This architecture is much closer to the long-term vision.

I especially like that it builds on our existing global_intelligence pipeline instead of generating fake trends.

However, before implementation I want to make the following improvements.

=====================================================

1. THIS IS NOT JUST PROMPT INTELLIGENCE

=====================================================

The page should become our AI Market Intelligence dashboard.

Prompt Intelligence should be only one module.

Future modules should fit naturally without redesign.

Examples:

Prompt Intelligence

Industry Intelligence

Competitor Intelligence

Citation Intelligence

Brand Intelligence

Emerging Topics

AI Platform Intelligence

This page should eventually become the "Bloomberg Terminal" for AI Search.

Design the UI with expandable modules instead of one long prompt page.

=====================================================

2. BUILD A NETWORK EFFECT

=====================================================

Every scan should make the platform smarter.

I want users to immediately understand that.

Add a small card near the top.

Example:

Powered by AI Mention You Intelligence

Updated from

2,143 scans

18 industries

4 AI platforms

31,248 citations

5,126 recommendation opportunities

Anonymous aggregated platform data.

This creates trust and demonstrates the network effect.

As those numbers grow the product becomes more valuable.

=====================================================

3. ADD EMERGING TOPICS

=====================================================

Trending prompts are great.

But I also want:

Emerging Topics

Examples

AI Search Optimization

Agentic Commerce

LLM SEO

Recommendation Engineering

AI Shopping

Answer Engine Optimization

These are topic clusters.

Inside each topic show

Growth

Industries

Top prompts

Top competitors

Opportunity score

This should become a discovery engine.

=====================================================

4. SHOW WHY SOMETHING IS TRENDING

=====================================================

Never only show

Growth +142%

Explain WHY.

Example

Growing because

↑ 42% more scans

↑ 18% more citations

↑ 7 competitors now rank

↑ Seen across ChatGPT and Gemini

This builds trust.

=====================================================

5. ADD FIRST MOVER OPPORTUNITIES

=====================================================

This becomes one of our biggest differentiators.

Section:

First Mover Opportunities

Rules

Very low competition

High growth

Low citation coverage

Recently discovered

Examples

Only 3 companies currently answer this prompt.

Opportunity Score

98

Create this page before competitors.

This becomes addictive.

=====================================================

6. BUILD INDUSTRY BENCHMARKS

=====================================================

Every industry should eventually have:

Top Prompt Clusters

Fastest Growing Topics

Most Recommended Brands

Most Trusted Domains

Average AI Visibility

Average Citation Score

Emerging Competitors

This will become publishable research.

=====================================================

7. CREATE MONTHLY AI INDEX

=====================================================

Automatically generate internal reports.

Examples

Top 100 AI Brands

Top Emerging AI Topics

Most Recommended SaaS Companies

Fastest Growing Prompt Clusters

Most Trusted Citation Domains

Do not build publishing yet.

Design the schema so this is easy later.

=====================================================

8. ADD CONFIDENCE SCORE

=====================================================

Every insight should have confidence.

Example

Trend Confidence

98%

based on

742 scans

18 industries

132 citations

This prevents users thinking we invented data.

=====================================================

9. ADD TIMELINES

=====================================================

Every prompt

Every topic

Every industry

should have

7 Days

30 Days

90 Days

12 Months

The architecture should support historical charts.

=====================================================

10. KEEP THE SYSTEM MODULAR

=====================================================

I love the provider architecture.

Please keep every intelligence source isolated.

Examples

Internal Scan Intelligence

Google Trends

Autocomplete

People Also Ask

Reddit

Quora

News

Competitor Crawlers

Community Prompt Packs

Adding a provider should never require changing the dashboard.

=====================================================

MOST IMPORTANT

We are NOT building another dashboard.

We are building the world's first AI Market Intelligence platform.

Everything should be designed around proprietary first-party intelligence generated by AI Mention You users.

Every scan should improve the intelligence available to every other customer while preserving privacy.

That network effect becomes our competitive moat.