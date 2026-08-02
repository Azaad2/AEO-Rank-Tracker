// Shared domain understanding layer.
//
// Before we ask any AI engine about a domain, we actually READ the website so
// prompts and competitor detection are anchored to what the business really
// sells. Without this, a domain string alone makes the model guess (which is
// how an affiliate-marketing SaaS ended up "competing" with WordPress.com).

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-3.6-flash';

export interface DomainProfile {
  domain: string;
  brandName: string;
  category: string;
  description: string;
  icp: string;
  knownCompetitors: string[];
  fetchOk: boolean;
  source: 'cache' | 'fetched' | 'guessed';
}

export function normalizeDomain(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

export function domainToName(domain: string): string {
  const name = normalizeDomain(domain).split('.')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// ---------- 1. Read the site ----------

function stripHtml(html: string): { title: string; description: string; text: string } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ??
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ??
    '';
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return { title, description, text };
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIMentionYouBot/1.0; +https://aimentionyou.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function readSiteContent(domain: string): Promise<{
  ok: boolean;
  title: string;
  description: string;
  text: string;
}> {
  const d = normalizeDomain(domain);
  const homepage = (await fetchPage(`https://${d}`)) ?? (await fetchPage(`http://${d}`));
  if (!homepage) return { ok: false, title: '', description: '', text: '' };

  const home = stripHtml(homepage);
  const extras: string[] = [];
  for (const path of ['/pricing', '/about']) {
    const page = await fetchPage(`https://${d}${path}`);
    if (page) extras.push(stripHtml(page).text.slice(0, 800));
  }

  const text = [home.text.slice(0, 2000), ...extras].join('\n').slice(0, 4000);
  return { ok: text.length > 80, title: home.title, description: home.description, text };
}

// ---------- 2. Classify the business ----------

function parseJson(content: string): any | null {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function classify(
  domain: string,
  site: { title: string; description: string; text: string },
  apiKey: string,
): Promise<Partial<DomainProfile>> {
  const hasContent = site.text.length > 80;
  const userPrompt = hasContent
    ? `Domain: ${domain}
Page title: ${site.title}
Meta description: ${site.description}
Website text (truncated):
"""
${site.text}
"""

Based ONLY on the website text above, describe this business.`
    : `Domain: ${domain}

We could not read this website. Make your best conservative guess about the business and say so by keeping the category broad.`;

  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You classify websites for competitive research. Reply with JSON only:
{
  "brandName": "the brand's own name",
  "category": "the specific product category, e.g. affiliate marketing software for SaaS",
  "description": "one sentence on what the product does and who it is for",
  "icp": "the ideal customer in a few words",
  "knownCompetitors": ["real direct competitor brands in the SAME category"]
}
Rules: list 3-6 competitors that sell the same kind of product to the same buyer. Never list review sites, marketplaces, communities, app stores or general platforms (g2, capterra, reddit, youtube, wordpress, shopify app store, etc.) unless the product itself is one. Never include the brand itself.`,
        },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`classify failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const parsed = parseJson(data.choices?.[0]?.message?.content ?? '') ?? {};
  return {
    brandName: typeof parsed.brandName === 'string' ? parsed.brandName : domainToName(domain),
    category: typeof parsed.category === 'string' ? parsed.category : '',
    description: typeof parsed.description === 'string' ? parsed.description : '',
    icp: typeof parsed.icp === 'string' ? parsed.icp : '',
    knownCompetitors: Array.isArray(parsed.knownCompetitors)
      ? parsed.knownCompetitors.filter((c: unknown) => typeof c === 'string' && c.length > 1).slice(0, 6)
      : [],
  };
}

// ---------- 3. Cached profile ----------

const CACHE_TTL_DAYS = 30;

export async function getDomainProfile(
  supabase: any,
  rawDomain: string,
  apiKey: string,
  opts: { force?: boolean } = {},
): Promise<DomainProfile> {
  const domain = normalizeDomain(rawDomain);
  const fallback: DomainProfile = {
    domain,
    brandName: domainToName(domain),
    category: '',
    description: '',
    icp: '',
    knownCompetitors: [],
    fetchOk: false,
    source: 'guessed',
  };

  if (!opts.force) {
    try {
      const { data } = await supabase
        .from('domain_profiles')
        .select('*')
        .eq('domain', domain)
        .maybeSingle();
      if (data) {
        const ageDays = (Date.now() - new Date(data.fetched_at).getTime()) / 86_400_000;
        if (ageDays < CACHE_TTL_DAYS && data.category) {
          return {
            domain,
            brandName: data.brand_name || domainToName(domain),
            category: data.category || '',
            description: data.description || '',
            icp: data.icp || '',
            knownCompetitors: Array.isArray(data.known_competitors) ? data.known_competitors : [],
            fetchOk: !!data.fetch_ok,
            source: 'cache',
          };
        }
      }
    } catch (e) {
      console.warn('domain_profiles cache read failed:', e);
    }
  }

  const site = await readSiteContent(domain);
  let classified: Partial<DomainProfile> = {};
  try {
    classified = await classify(domain, site, apiKey);
  } catch (e) {
    console.error('domain classification failed:', e);
    return fallback;
  }

  const profile: DomainProfile = {
    ...fallback,
    ...classified,
    domain,
    fetchOk: site.ok,
    source: site.ok ? 'fetched' : 'guessed',
  };

  try {
    await supabase.from('domain_profiles').upsert(
      {
        domain,
        brand_name: profile.brandName,
        category: profile.category,
        description: profile.description,
        icp: profile.icp,
        known_competitors: profile.knownCompetitors,
        fetch_ok: profile.fetchOk,
        source: profile.source,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'domain' },
    );
  } catch (e) {
    console.warn('domain_profiles upsert failed:', e);
  }

  return profile;
}

// ---------- 4. Prompts anchored to the real category ----------

export async function suggestPromptsForProfile(
  profile: DomainProfile,
  apiKey: string,
  count = 6,
): Promise<string[]> {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You write the exact questions real buyers type into ChatGPT, Gemini, Claude and Perplexity when shopping in a product category. Reply with JSON only: {"prompts":["...","..."]}
Rules: every prompt must clearly belong to the given category and buyer. Mix "best X for Y", "A vs B alternatives", and problem-led questions. Never mention the brand we are testing. Keep each prompt under 90 characters.`,
        },
        {
          role: 'user',
          content: `Category: ${profile.category || 'unknown'}
What the product does: ${profile.description || 'unknown'}
Ideal customer: ${profile.icp || 'unknown'}
Competitors in this category: ${profile.knownCompetitors.join(', ') || 'unknown'}
Brand to exclude from prompts: ${profile.brandName}

Write ${count} prompts.`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`prompt suggestion failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const parsed = parseJson(data.choices?.[0]?.message?.content ?? '') ?? {};
  const list = Array.isArray(parsed.prompts) ? parsed.prompts : [];
  return list
    .map((p: any) => (typeof p === 'string' ? p : p?.prompt))
    .filter((p: unknown) => typeof p === 'string' && (p as string).trim().length > 8)
    .map((p: string) => p.trim().slice(0, 140))
    .slice(0, count);
}
