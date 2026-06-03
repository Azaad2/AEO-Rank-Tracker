# Phase 1, Chunk #1 — Citation Extraction + Hybrid Classifier (with Asset-Type Intelligence)

## Goal

Evolve the scanner so every AI response yields structured citation rows tagged with **both** a `source_type` (where the URL lives) and an `asset_type` (what kind of page it is). Asset types are the unit the "Why Competitors Win" engine will reason on.

## Scope of this chunk

1. Citation extraction from all engine responses
2. Hybrid classifier (pattern → cache → LLM fallback) for `source_type` AND `asset_type`
3. Persistence into `citations`, `citation_sources`, `content_assets`
4. Integration into the existing `scan` edge function pipeline
5. No dashboard/UI work, no metrics computation, no global_intelligence write — those are later chunks

---

## 1. Citation extraction

New shared module `supabase/functions/_shared/citations.ts`:

- `extractCitationsFromText(text, engine)` → returns `{ url, domain, position }[]`
  - Regex for bare URLs + markdown link syntax
  - Strips trailing punctuation, fragments, tracking params
  - Dedupes per response, preserves first-seen order (`position`)
- `extractDomain(url)` → lowercased eTLD+1 (no `www.`)
- Per-engine adapters:
  - **Gemini**: parse markdown links + bare URLs from response text
  - **Perplexity**: use structured `citations[]` field when present, fall back to text parse
  - **ChatGPT / Claude**: text parse (placeholder; today's pipeline only stores Gemini + search, structural fields added in earlier migration are now populated)
  - **Google Search / AI Overviews**: already structured — map directly

## 2. Hybrid classifier

New edge function `supabase/functions/classify-citation/index.ts` (callable internally; not user-facing). Input: `{ url, title?, snippet? }`. Output: `{ source_type, asset_type, authority_score, method, brand_detected? }`.

### Step A — Domain pattern match (`source_type`)

In-memory regex/host map seeded from the 22 patterns already inserted in `citation_sources` plus a hardcoded fallback set:

- `reddit.com` → reddit
- `news.ycombinator.com`, `*.substack.com` → forum / blog
- `g2.com`, `capterra.com`, `trustradius.com`, `getapp.com`, `softwareadvice.com` → review_site
- `producthunt.com`, `alternativeto.net` → directory
- `youtube.com`, `youtu.be` → youtube
- `github.com` → github
- TLDs & known publishers (`nytimes.com`, `techcrunch.com`, `theverge.com`, `wired.com`, …) → news
- `docs.*`, `*/docs/*`, `developer.*` → official (documentation hint passed to asset classifier)
- Fallback → blog (low confidence, flagged for LLM)

### Step B — URL/path heuristics (`asset_type`, cheap pre-pass)

Before any LLM call, infer asset_type from URL shape + source_type:

- `reddit.com/r/*/comments/*` → reddit_thread
- `news.ycombinator.com/item` → forum_thread
- `g2.com/products/*/reviews`, `capterra.com/p/*/reviews` → review_page
- `g2.com/compare/*`, `*/vs-*`, `*-vs-*`, `*/comparison/*` → comparison_page
- `*/best-*`, `*/top-*`, `*-tools-*`, `*-alternatives*` → listicle
- `*/blog/*`, `*.substack.com/p/*`, `medium.com/*/*` → blog_article
- News domain + article path → news_article
- `docs.*`, `*/docs/*`, `developer.*` → documentation_page
- Categorized directory hosts → directory_listing
- Domain root / shallow path on a brand site → landing_page

### Step C — LLM fallback (`asset_type` only, when heuristics are low-confidence)

- Model: `google/gemini-2.5-flash-lite` via Lovable AI gateway (already configured, `LOVABLE_API_KEY` available)
- Prompt: pass `url`, `title`, `snippet`, and the source_type; ask for `asset_type` from the closed enum + a `brand_detected` field (which brand the page is about / cites)
- Batched: up to 10 URLs per call; one LLM call per scan in the common case
- Result cached into `citation_sources` (`classification_method = 'llm'`) keyed by domain for `source_type`, and into `content_assets` for the asset-level record

### Step D — Authority score

Static lookup table per domain category (Reddit 70, G2 85, NYT 95, generic blog 30, own brand 10, etc.). Stored on the `citation_sources` row; refreshed lazily.

### Caching rules

- `citation_sources` row keyed by domain: stores `source_type`, `authority_score`, `classification_method`, `classified_at`
- Asset-type results are URL-specific, not domain-specific → stored in `content_assets` (not `citation_sources`)
- In-function LRU (Map, ~500 entries) to coalesce within a single scan

## 3. Persistence

Per scan_result, write:

`**citations**` (one row per extracted URL)

- `scan_result_id`, `engine`, `url`, `domain`, `source_type`, `asset_type`, `cites_brand`, `position`

`**citation_sources**` (upsert by domain)

- New domains inserted with `classification_method` and `authority_score`
- Existing rows touched (`classified_at` refreshed if stale)

`**content_assets**` (upsert by `(url)`, or `(url, brand_name)`)

- `url`, `domain`, `asset_type`, `source_type`, `brand_name` (normalized via `normalize_brand`), `industry_id` (from scan), `title`, `authority_score`
- `citation_count` incremented on every re-observation
- `first_seen` set on insert, `last_seen` updated every scan  
confidence_score  
visibility_weight
- This is the table the future "Why Competitors Win" engine reads from

Brand detection for `cites_brand` / `content_assets.brand_name`:

- Primary: scan's own brand + known competitor list (already in `brand_observations` pipeline)
- Secondary: LLM `brand_detected` output when present
- Fallback: NULL (asset still stored, just unattributed)

## 4. Scan pipeline integration

Edit `supabase/functions/scan/index.ts`:

- After each engine response is stored on `scan_results`, call the new shared extractor
- Batch-classify all URLs from this scan in one pass (Step A→B locally, Step C as a single LLM call for leftovers)
- Bulk-insert `citations`, upsert `citation_sources` + `content_assets`
- Wrap in `try/catch` — citation pipeline failures must **not** fail the scan; log and continue
- Added latency budget: target < 1.5s overhead on a scan (LLM fallback is the only network hop and is batched)

No changes to existing scan response shape — additive only.

## 5. What this chunk does NOT do

- No `proprietary_metrics_cache` writes (chunk #2)
- No `global_intelligence` writes (chunk #4)
- No `recommendations` generation (chunk #3)
- No dashboard surfaces (chunk #5)
- No backfill (chunk #6)

---

## Technical details (engineer-facing)

- New file: `supabase/functions/_shared/citations.ts` (extractor + heuristics, pure functions, unit-testable)
- New edge function: `supabase/functions/classify-citation/` with `verify_jwt = false`, internal callers only (called from `scan` via direct import for now; standalone HTTP route kept for chunk #6 backfill reuse)
- Direct import path preferred over HTTP self-call to avoid latency; HTTP entrypoint exists for backfill jobs
- `content_assets` upsert uses `ON CONFLICT (url) DO UPDATE SET citation_count = content_assets.citation_count + 1, last_seen = now(), title = COALESCE(EXCLUDED.title, content_assets.title)`
- `citation_sources` upsert uses `ON CONFLICT (domain) DO UPDATE` only when row is older than 7 days or method upgrades (pattern → llm → manual)
- Confidence threshold for skipping LLM: if Step B returns a non-fallback asset_type AND Step A returned a non-`other` source_type, skip LLM
- LLM prompt returns strict JSON; validate with Zod, drop malformed rows rather than failing the batch
- Cost cap: hard limit of 1 LLM call per scan, max 10 URLs per call; remaining URLs get heuristic-only classification and are flagged `classification_method = 'pattern'` for later upgrade

## Open question (low-risk, can decide during build)

For very long Perplexity/ChatGPT responses with 30+ citations, do we LLM-classify only the **top N by position** (cheaper, biases toward what the model surfaces first) or all of them (more complete, +cost)? Proposal: top 10 by position now, full-pass during backfill in chunk #6.

---

Approve and I'll move to build for this chunk.