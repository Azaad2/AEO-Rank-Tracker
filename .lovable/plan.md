## Part 1 — Rebuild AI Content Auditor (URL → popup → signup-gated Fix)

### New flow
1. Public page `/tools/ai-content-auditor` shows a single **URL input** + "Scan Website" button (no paste box).
2. Click Scan → edge function fetches the page (Firecrawl) and analyzes it. Guests can run the scan without signing up.
3. Results open in a **modal popup** with:
   - Overall AI-readiness score (0–100) + page meta (title, description, H1, word count).
   - List of detected **issues**, each as a card: severity badge, title, what's broken on their page, and a **"Fix this"** button.
4. **Signup gate on Fix**: clicking any Fix button → if not signed in, redirect to `/auth?redirect=/tools/ai-content-auditor?url=<url>&fix=<issueId>` with toast "Sign up free to apply this fix." After signup/login, user lands back on the auditor; the scan re-runs automatically and the chosen issue's fix modal opens.
5. Signed-in users: Fix opens a second modal with the AI-generated fix (meta tag, FAQ JSON-LD, rewritten H1, suggested paragraph, alt text, etc.) + **Copy** and **Save to Action Plan** (writes to `optimization_tasks`).

### Issues detected (AI/GEO-focused)
From the scraped HTML:
- Weak/missing `<title>` (length, keyword)
- Missing meta description
- Missing or multiple `<h1>`
- No FAQ section / no FAQPage schema
- No Article/Organization JSON-LD
- Thin content (<300 words)
- No answer-style paragraphs (citability)
- Images missing alt text
- No internal links
- Missing canonical / OG tags

### Backend changes
- **Rewrite `supabase/functions/audit-content/index.ts`** to accept `{ url }`, call Firecrawl (`FIRECRAWL_API_KEY`) with `formats: ['markdown','html','links']`, run rule-based checks on the HTML for the issues above (with concrete evidence like "Title is 12 chars — too short"), then call Lovable AI (`google/gemini-2.5-flash`) once for an overall score + human-readable explanations. Returns `{ url, overallScore, pageMeta, issues: [{id, severity, category, title, evidence, fixType}] }`. No auth required (guest scan allowed).
- **New `supabase/functions/audit-fix/index.ts`** — JWT-required. Body `{ url, issueId, fixType, pageContext }`. Routes to the right Lovable AI generator based on `fixType` (`meta`, `faq`, `schema`, `h1`, `content`, `alt`). Returns the fix as text/code.
- Reuse existing CORS pattern, env validation, `corsHeaders` from `npm:@supabase/supabase-js@2/cors`.

### Frontend changes
- **Rewrite `src/pages/tools/ContentAuditor.tsx`**: URL input + Scan button → Dialog with score + issue cards → second Dialog with fix code + Copy + Save to Action Plan.
- Read `?url=` and `?fix=` from query params on mount; if present and user is signed in, auto-run scan and auto-open the matching fix modal (post-signup bounce-back).
- Use existing `useAuth` hook and `useToast`.
- Keep arcade theme (bg-black, yellow-400 accents, Press Start 2P headings).
- Verify `src/pages/Auth.tsx` forwards the full `redirect` query string (including `?url=` and `&fix=`) after signup.

### Firecrawl connector
The `firecrawl` knowledge file expects `FIRECRAWL_API_KEY` env var. If not yet linked, I'll prompt to connect via `standard_connectors--connect` before deploying the audit function.

---

## Part 2 — List the missing blog post

The post `FiftySaaSBrandsAIVisibility` is routed at `/blog/50-saas-brands-ai-visibility-data` but not surfaced anywhere.

- **`src/pages/Blog.tsx`** — add a card entry (title "50 SaaS Brands AI Visibility: The Data", excerpt, date, slug, tag) matching the existing card layout.
- **`public/sitemap.xml`** — add a `<url>` entry for `https://aimentionyou.com/blog/50-saas-brands-ai-visibility-data` (priority 0.8, matching other blog entries) so Google Search Console can index it.

---

## Out of scope (ask separately)
- Multi-page site crawl (this audits one URL per scan).
- Performance/Core Web Vitals/broken-link checks (would need extra APIs).
- Auto-pushing fixes to the user's live site — fixes remain copy/paste or saved to Action Plan.
