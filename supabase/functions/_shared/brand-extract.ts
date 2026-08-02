// Competitor extraction.
//
// Old behaviour: regex-scrape anything bold / after "such as" / in a numbered
// list, and call it a competitor. That surfaced section headings, review sites
// and brands from a completely different market.
//
// New behaviour: one structured extraction call per prompt covering every
// engine answer, then a hard filter against the target's real category. The
// regex path survives only as a fallback when the model call fails.

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-3.6-flash';

// Places AI cites for information — never "competitors" of a product.
export const NON_COMPETITOR_DOMAINS = new Set([
  'reddit.com', 'quora.com', 'medium.com', 'youtube.com', 'linkedin.com',
  'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'tiktok.com',
  'g2.com', 'capterra.com', 'getapp.com', 'trustpilot.com', 'trustradius.com',
  'softwareadvice.com', 'producthunt.com', 'sourceforge.net', 'slashdot.org',
  'wikipedia.org', 'forbes.com', 'techcrunch.com', 'businessinsider.com',
  'github.com', 'stackoverflow.com', 'news.ycombinator.com', 'indiehackers.com',
  'google.com', 'bing.com', 'apple.com', 'microsoft.com', 'amazon.com',
]);

const NON_COMPETITOR_BRANDS = new Set(
  [...NON_COMPETITOR_DOMAINS].map((d) => d.split('.')[0]),
);

// Words the old regex kept mistaking for brands.
const GENERIC_PHRASES = [
  'the best', 'best', 'top', 'key', 'here', 'note', 'summary', 'conclusion',
  'overview', 'introduction', 'pros', 'cons', 'features', 'pricing', 'price',
  'free', 'paid', 'important', 'consider', 'considerations', 'recommendation',
  'recommendations', 'options', 'option', 'tools', 'tool', 'platforms',
  'platform', 'software', 'solutions', 'solution', 'services', 'service',
  'example', 'examples', 'why', 'how', 'what', 'when', 'which', 'who',
  'disclaimer', 'ai', 'llm', 'seo', 'faq', 'tips', 'step', 'steps',
];

export interface BrandCandidate {
  name: string;
  domain?: string;
}

function normalizeBrandKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\.(com|io|co|net|org|ai|app|dev)$/, '')
    .replace(/\s+(inc|ltd|llc|gmbh|corp|co)\.?$/, '')
    .replace(/[^a-z0-9 .+-]/g, '')
    .trim();
}

export function isPlausibleCompetitor(
  candidate: BrandCandidate,
  targetBrandKey: string,
  targetDomain: string,
): boolean {
  const key = normalizeBrandKey(candidate.name);
  if (!key || key.length < 2 || key.length > 40) return false;
  if (key === targetBrandKey) return false;
  if (key === normalizeBrandKey(targetDomain)) return false;
  if (GENERIC_PHRASES.includes(key)) return false;
  if (NON_COMPETITOR_BRANDS.has(key)) return false;
  if (candidate.domain) {
    const d = candidate.domain.toLowerCase().replace(/^www\./, '');
    if (NON_COMPETITOR_DOMAINS.has(d)) return false;
    if (d === targetDomain) return false;
  }
  // A "brand" made of 4+ words is almost always a sentence fragment.
  if (key.split(' ').length > 3) return false;
  return true;
}

/** Legacy regex path — fallback only. */
export function regexBrandCandidates(response: string): BrandCandidate[] {
  const out: BrandCandidate[] = [];
  const patterns = [
    /([A-Z][a-zA-Z0-9-]+(?:\.com|\.io|\.ai|\.co|\.org|\.net|\.app))/g,
    /\*\*([A-Z][a-zA-Z0-9][a-zA-Z0-9 .&-]{1,28})\*\*/g,
    /(?:^|\n)\s*\d+\.\s+\*?\*?([A-Z][a-zA-Z0-9][a-zA-Z0-9 .&-]{1,28})\*?\*?/gm,
  ];
  for (const pattern of patterns) {
    for (const match of response.matchAll(pattern)) {
      const raw = match[1]?.trim().replace(/[:,.\-–]+$/, '');
      if (raw) out.push({ name: raw });
    }
  }
  return out;
}

function parseJson(content: string): any | null {
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

export interface ExtractionContext {
  targetDomain: string;
  targetBrand: string;
  category: string;
  apiKey: string;
}

/**
 * Extract the brands each engine actually recommended, per engine.
 * `answers` maps engine name -> raw answer text (empty/missing engines are skipped).
 */
export async function extractRecommendedBrands(
  prompt: string,
  answers: Record<string, string>,
  ctx: ExtractionContext,
): Promise<Record<string, string[]>> {
  const engines = Object.entries(answers).filter(([, text]) => text && text.trim().length > 40);
  const result: Record<string, string[]> = {};
  for (const [engine] of engines) result[engine] = [];
  if (engines.length === 0) return result;

  const targetBrandKey = normalizeBrandKey(ctx.targetBrand);

  const finalize = (engine: string, candidates: BrandCandidate[]) => {
    const seen = new Set<string>();
    const kept: string[] = [];
    for (const c of candidates) {
      if (!isPlausibleCompetitor(c, targetBrandKey, ctx.targetDomain)) continue;
      const key = normalizeBrandKey(c.name);
      if (seen.has(key)) continue;
      seen.add(key);
      kept.push(c.name.trim());
      if (kept.length >= 6) break;
    }
    result[engine] = kept;
  };

  try {
    const body = engines
      .map(([engine, text]) => `### ${engine}\n${text.slice(0, 2500)}`)
      .join('\n\n');

    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You read AI assistant answers and list the PRODUCTS OR COMPANIES each answer recommended as a solution.
Reply with JSON only, one key per engine section:
{"gemini":[{"name":"Brand","domain":"brand.com"}],"perplexity":[...]}
Rules:
- Only include named products/companies that compete in the stated category.
- Never include review sites, communities, marketplaces, publishers or search engines (G2, Capterra, Reddit, YouTube, Wikipedia, Forbes...).
- Never include the brand we are testing.
- Never include headings, generic phrases or feature names.
- Omit "domain" if the answer did not state one. Max 6 per engine. If an answer recommends nothing, return an empty array.`,
          },
          {
            role: 'user',
            content: `Category we care about: ${ctx.category || 'unknown'}
Brand we are testing (exclude it): ${ctx.targetBrand} (${ctx.targetDomain})
Question asked: ${prompt}

${body}`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) throw new Error(`extract failed [${res.status}]: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const parsed = parseJson(data.choices?.[0]?.message?.content ?? '');
    if (!parsed) throw new Error('unparseable extraction response');

    for (const [engine, text] of engines) {
      const raw = parsed[engine];
      if (Array.isArray(raw)) {
        finalize(
          engine,
          raw
            .map((item: any) =>
              typeof item === 'string'
                ? { name: item }
                : { name: String(item?.name ?? ''), domain: item?.domain ? String(item.domain) : undefined },
            )
            .filter((c: BrandCandidate) => c.name),
        );
      } else {
        finalize(engine, regexBrandCandidates(text));
      }
    }
    return result;
  } catch (e) {
    console.warn('brand extraction fell back to regex:', e);
    for (const [engine, text] of engines) finalize(engine, regexBrandCandidates(text));
    return result;
  }
}

export interface CompetitorEvidence {
  name: string;
  promptCount: number;
  engines: string[];
}

/** Rank competitors by how many prompts and engines actually named them. */
export function rankCompetitorEvidence(
  rows: Array<{ prompt: string; byEngine: Record<string, string[]> }>,
): CompetitorEvidence[] {
  const map = new Map<string, { name: string; prompts: Set<string>; engines: Set<string> }>();
  for (const row of rows) {
    for (const [engine, brands] of Object.entries(row.byEngine)) {
      for (const brand of brands) {
        const key = normalizeBrandKey(brand);
        if (!key) continue;
        const entry = map.get(key) ?? { name: brand, prompts: new Set<string>(), engines: new Set<string>() };
        entry.prompts.add(row.prompt);
        entry.engines.add(engine);
        map.set(key, entry);
      }
    }
  }
  return [...map.values()]
    .map((e) => ({ name: e.name, promptCount: e.prompts.size, engines: [...e.engines] }))
    .sort((a, b) => b.promptCount * 10 + b.engines.length - (a.promptCount * 10 + a.engines.length))
    .slice(0, 10);
}
