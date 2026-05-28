## Goal

Capture the easiest, highest-volume AI-visibility keywords we just identified in Semrush by (1) retargeting the homepage on-page SEO and (2) shipping the first of four planned blog posts.

## Scope (this turn)

### 1. Homepage on-page SEO rewrite — `index.html` + `src/pages/Index.tsx`

Target keywords:
- Primary: **AI search visibility checker** (260/mo, KDI 30)
- Secondary: **AI visibility platform**, **AI visibility tool** (2,400/mo each, low comp)
- Supporting: **how to track brand mentions in AI search**, **AI search optimization tools**

Changes:
- `index.html` — update `<title>`, `<meta name="description">`, `og:title`, `og:description`, `twitter:title`, `twitter:description` to lead with "AI Search Visibility Checker".
- `src/pages/Index.tsx` — rewrite the hero H1, sub-headline, and the first 100 words to naturally include the primary + secondary keywords. Keep the existing arcade theme (yellow-400, Press Start 2P) and `pt-32` layout standard. No visual redesign.
- Update the existing JSON-LD `SoftwareApplication` / `WebSite` schema `name` + `description` to match.

### 2. New blog post — `src/pages/blog/HowToTrackChatGPTMentions.tsx`

- Target: **chatgpt mention tracker** (260/mo, KDI 16) + the 13 question-format variants (~1,250/mo combined).
- Use existing `BlogLayout` component, 2000+ words, author = Azaad Pandey, with FAQPage + Article JSON-LD consolidated via `@graph` (matches existing blog architecture).
- Internal links to: `/tools/chatgpt-mention-tracker`, `/tools/llm-rank-tracker`, homepage scan.
- Sections: What is ChatGPT mention tracking → Why it matters → 5 methods (manual, prompt sampling, API polling, dedicated tools, dashboards) → Step-by-step with our tool → FAQ (10+ questions pulled directly from Semrush's question keywords).
- Register the route in `src/App.tsx`.
- Add the slug to `public/sitemap.xml` and surface it on `src/pages/Blog.tsx`.

### 3. Memory + finding hygiene

- Update `mem://seo/target-keywords` with the prioritized list (chatgpt mention tracker, llm rank tracker, ai search visibility checker, ai visibility platform).
- After the rewrite, call `seo--list_findings` and mark any title/description-related findings as fixed if they're addressed.

## Out of scope (next batches)

- The other 3 planned blog posts ("How to track brand mentions in AI search", "How to check AI search visibility", "What is GEO" pillar). Ship after this one is reviewed.
- Polishing the 4 tool pages (ChatGPT Mention Tracker, Perplexity Rank Tracker, LLM Rank Tracker, Content Auditor) — separate batch.
- No new components, no design changes, no DB migrations, no edge function changes.

## Technical notes

- `index.html` is the SEO source of truth (Vite stack).
- Keep canonical + og:url absolute on production domain `https://aimentionyou.com` (matches existing pattern).
- Blog post must use the `useEffect` cleanup pattern for JSON-LD to avoid duplicate schemas (per existing blog architecture memory).
- Sitemap entry: `<priority>0.8</priority>`, today's `<lastmod>`.
