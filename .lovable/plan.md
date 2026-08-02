## Short answer

No — right now the tool does **not** really understand the domain it's scanning, and "competitors" are not verified competitors. That's why affonso.io (affiliate-marketing software for SaaS) got compared against WordPress.com.

## How the workflow actually works today (verified in code)

```text
1. User enters a domain, leaves the prompt box empty        (src/pages/Index.tsx)
2. Frontend calls generate-prompts with:
      industry: "general"
      businessDescription: "Website affonso.io"
      targetAudience: "general"
   -> The site is NEVER fetched. The AI only sees the domain string
      and guesses a category. For affonso.io it guessed "website builders".
3. scan function asks Gemini / Perplexity (+ ChatGPT / Claude on paid)
   those guessed prompts and checks whether your brand name appears.
4. Competitors = regex scrape of the raw answer text
      (supabase/functions/scan/index.ts, extractCompetitorBrands)
   Patterns grab anything after "such as / like", any **bold** phrase,
   any numbered-list item, any Word.com token — max 5, first-come.
   There is no check that the extracted name is a company, is in your
   category, or is even a competitor. Section headings and generic
   phrases pass through too.
```

So the chain is: wrong prompt guess -> AI answers about a different market -> the brands in that answer get labelled "your competitors". Both ends need fixing.

## What to change

**1. Actually read the domain before generating prompts**
- New shared step in the scan flow: fetch the homepage (plus `/pricing` and `/about` when present), strip HTML, keep title, meta description and the first ~2,000 chars of text.
- Pass that real text to the prompt generator, plus a classification step that returns: what the product does, its category, its ICP, and 3-6 named real competitors.
- Cache this profile per domain (a `domain_profiles` row) so repeat scans skip the fetch.
- If the fetch fails (blocked/JS-only site), say so in the UI and ask the user to confirm their category instead of silently guessing.

**2. Generate prompts from the real profile**
- Replace `industry: 'general'` / `businessDescription: "Website x"` with the fetched profile.
- Prompts must be category-anchored (for affonso.io: "best affiliate program software for SaaS", "Rewardful vs Tapfiliate alternatives", etc.).
- Show the user the prompts that will be tested, with an edit-before-scan option, so a bad guess is visible rather than buried.

**3. Rewrite competitor detection**
- Drop the regex-only approach as the source of truth. Instead, for each engine answer, ask the model to return the brands it recommended in that answer as structured data (name + domain when stated), keeping the regex as a fallback only.
- Then filter each candidate against the domain profile's category: reject the target brand itself, generic nouns/headings, review sites and platforms that aren't in the category (wordpress.com, reddit.com, g2.com, youtube.com…), and anything appearing in only one answer when better-supported candidates exist.
- Rank by how many prompts and how many engines named them, and store that count so the UI can say "named in 4 of 6 prompts across Gemini + Perplexity" instead of an unranked list of 5.
- Keep review-site/citation domains in a separate "where AI got its information" bucket — that's what the screenshot's "AI relied on these websites" panel should use. They are not competitors.

**4. UI honesty**
- On the results/diagnostics card, show the detected category and let the user correct it.
- Competitor chips get their evidence count; anything low-confidence is labelled "possible" rather than presented as fact.
- When "why AI chose them" has no citation evidence, keep the existing honest empty state instead of inventing reasons.

## Technical notes

- Files: `src/pages/Index.tsx` (prompt bootstrap + prompt preview), `supabase/functions/generate-prompts/index.ts` (accept a real profile), `supabase/functions/scan/index.ts` (`extractCompetitorBrands` -> structured extraction + category filter + evidence counts), new `supabase/functions/_shared/domain-profile.ts` for fetch/classify/cache.
- New table `domain_profiles` (domain, category, description, icp, known_competitors jsonb, fetched_at) with RLS + GRANTs; public read is not needed, so scope to `authenticated` and `service_role`.
- Structured extraction uses the existing Lovable AI gateway with a small flat schema (no length/enum bounds), guarded with a text-parse fallback.
- Scoring, engine weights, credits/limits and existing tables stay untouched.
