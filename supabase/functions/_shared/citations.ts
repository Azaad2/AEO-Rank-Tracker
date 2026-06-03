// Shared citation extraction + hybrid classifier
// Used by the scan edge function (and later by backfill).
// Pure functions where possible; LLM fallback is the only network hop.

export type Engine = 'gemini' | 'chatgpt' | 'perplexity' | 'claude' | 'overviews' | 'search';

export type SourceType =
  | 'reddit' | 'forum' | 'news' | 'blog' | 'directory'
  | 'review_site' | 'youtube' | 'official' | 'github' | 'social' | 'other';

export type AssetType =
  | 'comparison_page' | 'listicle' | 'directory_listing'
  | 'reddit_thread' | 'forum_thread' | 'review_page'
  | 'blog_article' | 'landing_page' | 'news_article'
  | 'documentation_page' | 'other';

export interface ExtractedCitation {
  url: string;
  domain: string;
  position: number;
  title?: string;
  snippet?: string;
}

export interface ClassifiedCitation extends ExtractedCitation {
  source_type: SourceType;
  asset_type: AssetType;
  authority_score: number;
  classification_method: 'pattern' | 'llm';
  brand_detected?: string;
  confidence: number; // 0..1 for asset_type
}

// ---------------- URL utilities ----------------

const TRACKING_PARAMS = new Set([
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
  'gclid','fbclid','mc_cid','mc_eid','ref','ref_src','source',
]);

export function cleanUrl(raw: string): string | null {
  try {
    const trimmed = raw.replace(/[)\]\.,;:!?'"<>]+$/g, '').trim();
    const u = new URL(trimmed);
    if (!/^https?:$/.test(u.protocol)) return null;
    for (const k of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(k.toLowerCase())) u.searchParams.delete(k);
    }
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

// ---------------- Extraction ----------------

const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BARE_URL_RE = /\bhttps?:\/\/[^\s<>"'`)\]]+/g;

export function extractCitationsFromText(text: string): ExtractedCitation[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: ExtractedCitation[] = [];
  let position = 0;

  // markdown links first so we capture their titles
  let m: RegExpExecArray | null;
  while ((m = MD_LINK_RE.exec(text)) !== null) {
    const url = cleanUrl(m[2]);
    if (!url || seen.has(url)) continue;
    const domain = extractDomain(url);
    if (!domain) continue;
    seen.add(url);
    out.push({ url, domain, position: position++, title: m[1].trim().slice(0, 200) });
  }

  // bare URLs
  const bareMatches = text.matchAll(BARE_URL_RE);
  for (const bm of bareMatches) {
    const url = cleanUrl(bm[0]);
    if (!url || seen.has(url)) continue;
    const domain = extractDomain(url);
    if (!domain) continue;
    seen.add(url);
    out.push({ url, domain, position: position++ });
  }

  return out;
}

// Convert Perplexity-style structured citations (array of URLs or {url,title})
export function extractStructuredCitations(
  arr: Array<string | { url?: string; title?: string; snippet?: string }>
): ExtractedCitation[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: ExtractedCitation[] = [];
  let position = 0;
  for (const item of arr) {
    const rawUrl = typeof item === 'string' ? item : item?.url;
    if (!rawUrl) continue;
    const url = cleanUrl(rawUrl);
    if (!url || seen.has(url)) continue;
    const domain = extractDomain(url);
    if (!domain) continue;
    seen.add(url);
    const title = typeof item === 'object' ? item?.title : undefined;
    const snippet = typeof item === 'object' ? item?.snippet : undefined;
    out.push({ url, domain, position: position++, title, snippet });
  }
  return out;
}

// ---------------- Source-type pattern map ----------------

interface SourcePattern {
  match: RegExp; // matched against hostname
  source: SourceType;
  authority: number;
}

const SOURCE_PATTERNS: SourcePattern[] = [
  { match: /^reddit\.com$|\.reddit\.com$/, source: 'reddit', authority: 70 },
  { match: /^news\.ycombinator\.com$/, source: 'forum', authority: 75 },
  { match: /^(stackoverflow|stackexchange|serverfault|superuser)\.com$/, source: 'forum', authority: 75 },
  { match: /^quora\.com$/, source: 'forum', authority: 55 },
  { match: /^(g2|capterra|trustradius|getapp|softwareadvice|trustpilot)\.com$/, source: 'review_site', authority: 85 },
  { match: /^(producthunt|alternativeto|saashub|slant)\.(com|co)$/, source: 'directory', authority: 70 },
  { match: /^(youtube\.com|youtu\.be)$/, source: 'youtube', authority: 60 },
  { match: /^github\.com$/, source: 'github', authority: 80 },
  { match: /^(twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com|tiktok\.com)$/, source: 'social', authority: 50 },
  { match: /^(nytimes|washingtonpost|theguardian|bbc|reuters|bloomberg|wsj|forbes|wired|theverge|techcrunch|arstechnica|engadget|venturebeat|cnbc|cnn|ft)\.com$/, source: 'news', authority: 90 },
  { match: /^[^.]+\.substack\.com$/, source: 'blog', authority: 45 },
  { match: /^medium\.com$/, source: 'blog', authority: 50 },
  { match: /^dev\.to$|^hashnode\.(com|dev)$/, source: 'blog', authority: 55 },
];

function classifySourceByDomain(domain: string): { source: SourceType; authority: number } {
  for (const p of SOURCE_PATTERNS) if (p.match.test(domain)) return { source: p.source, authority: p.authority };
  // docs.* / developer.* heuristic → official
  if (/^docs\./.test(domain) || /^developer\./.test(domain) || /^api\./.test(domain)) {
    return { source: 'official', authority: 65 };
  }
  return { source: 'blog', authority: 30 }; // low-confidence fallback
}

// ---------------- Asset-type heuristics ----------------

function classifyAssetByUrl(url: string, source: SourceType): { asset: AssetType; confidence: number } {
  let path = '';
  try { path = new URL(url).pathname.toLowerCase(); } catch { return { asset: 'other', confidence: 0 }; }
  const host = extractDomain(url);

  // Reddit / HN
  if (source === 'reddit' && /\/r\/[^/]+\/comments\//.test(path)) return { asset: 'reddit_thread', confidence: 0.95 };
  if (host === 'news.ycombinator.com' && /\/item/.test(path)) return { asset: 'forum_thread', confidence: 0.95 };
  if (source === 'forum') return { asset: 'forum_thread', confidence: 0.8 };

  // Reviews
  if (/\b(reviews?|ratings?)\b/.test(path) && source === 'review_site') return { asset: 'review_page', confidence: 0.9 };
  if (source === 'review_site' && /\/compare\//.test(path)) return { asset: 'comparison_page', confidence: 0.95 };
  if (source === 'review_site') return { asset: 'review_page', confidence: 0.7 };

  // Comparison
  if (/(^|\/)compare(\/|$)|\/comparison(\/|$)|[-/]vs[-/]|-vs-|_vs_/.test(path)) {
    return { asset: 'comparison_page', confidence: 0.9 };
  }

  // Listicle
  if (/(^|\/)(best|top|\d+-best|\d+-top)[-/]|[-/]alternatives(\/|$)|[-/]tools(\/|$)/.test(path)) {
    return { asset: 'listicle', confidence: 0.85 };
  }

  // Directory
  if (source === 'directory') return { asset: 'directory_listing', confidence: 0.9 };

  // Docs
  if (source === 'official' || /(^|\/)(docs|documentation|api|reference|guides?)(\/|$)/.test(path)) {
    return { asset: 'documentation_page', confidence: 0.85 };
  }

  // News
  if (source === 'news') return { asset: 'news_article', confidence: 0.85 };

  // Blog
  if (/(^|\/)(blog|posts?|articles?)(\/|$)|\/p\/|\/\d{4}\/\d{2}\//.test(path)) {
    return { asset: 'blog_article', confidence: 0.8 };
  }
  if (/\.substack\.com$/.test(host) || host === 'medium.com') {
    return { asset: 'blog_article', confidence: 0.8 };
  }

  // Landing page = brand site root / shallow
  if (path === '/' || path.split('/').filter(Boolean).length <= 1) {
    return { asset: 'landing_page', confidence: 0.6 };
  }

  return { asset: 'other', confidence: 0.2 };
}

// ---------------- LLM fallback (batched) ----------------

interface LlmAssetResult {
  url: string;
  asset_type: AssetType;
  brand_detected?: string | null;
}

const ASSET_ENUM: AssetType[] = [
  'comparison_page','listicle','directory_listing','reddit_thread',
  'forum_thread','review_page','blog_article','landing_page',
  'news_article','documentation_page','other',
];

export async function llmClassifyAssets(
  items: Array<{ url: string; title?: string; snippet?: string; source_type: SourceType }>,
  apiKey: string,
): Promise<LlmAssetResult[]> {
  if (items.length === 0) return [];
  const payload = items.slice(0, 10).map((it, i) => ({
    i, url: it.url, title: it.title ?? null, snippet: it.snippet ?? null, source_type: it.source_type,
  }));

  const sys = `You classify web pages by intent. Given a URL (and optional title/snippet/source type), return the asset_type from this closed set: ${ASSET_ENUM.join(', ')}. Also return brand_detected: the primary brand the page is ABOUT or that it favors (lowercase, no TLD), or null if unclear. Output strict JSON: {"results":[{"i":number,"asset_type":string,"brand_detected":string|null}]}.`;

  const user = `Classify these pages:\n${JSON.stringify(payload)}`;

  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    });
    if (!resp.ok) {
      console.error('llmClassifyAssets gateway error', resp.status, await resp.text());
      return [];
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return [];
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed?.results) ? parsed.results : [];
    return arr.flatMap((r: { i?: number; asset_type?: string; brand_detected?: string | null }) => {
      const idx = typeof r.i === 'number' ? r.i : -1;
      const src = payload.find(p => p.i === idx);
      if (!src) return [];
      const at = (ASSET_ENUM as string[]).includes(r.asset_type ?? '') ? (r.asset_type as AssetType) : 'other';
      return [{ url: src.url, asset_type: at, brand_detected: r.brand_detected ?? null }];
    });
  } catch (e) {
    console.error('llmClassifyAssets exception', e);
    return [];
  }
}

// ---------------- Public: classify a batch of citations ----------------

const HIGH_CONF_THRESHOLD = 0.7;

export async function classifyCitations(
  citations: ExtractedCitation[],
  opts: { lovableApiKey?: string; enableLlm?: boolean } = {},
): Promise<ClassifiedCitation[]> {
  // First pass: heuristics
  const pass1: ClassifiedCitation[] = citations.map(c => {
    const src = classifySourceByDomain(c.domain);
    const asset = classifyAssetByUrl(c.url, src.source);
    return {
      ...c,
      source_type: src.source,
      authority_score: src.authority,
      asset_type: asset.asset,
      confidence: asset.confidence,
      classification_method: 'pattern',
    };
  });

  // Identify low-confidence rows for LLM fallback
  const lowConf = pass1
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.confidence < HIGH_CONF_THRESHOLD)
    .slice(0, 10);

  if (!opts.enableLlm || !opts.lovableApiKey || lowConf.length === 0) return pass1;

  const llmResults = await llmClassifyAssets(
    lowConf.map(({ c }) => ({ url: c.url, title: c.title, snippet: c.snippet, source_type: c.source_type })),
    opts.lovableApiKey,
  );
  const byUrl = new Map(llmResults.map(r => [r.url, r] as const));
  for (const { c, i } of lowConf) {
    const r = byUrl.get(c.url);
    if (!r) continue;
    pass1[i] = {
      ...c,
      asset_type: r.asset_type,
      brand_detected: r.brand_detected ?? c.brand_detected,
      classification_method: 'llm',
      confidence: 0.9,
    };
  }
  return pass1;
}
