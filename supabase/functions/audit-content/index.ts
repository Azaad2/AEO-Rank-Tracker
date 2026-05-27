import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Severity = 'critical' | 'high' | 'medium' | 'low';
type FixType = 'meta_title' | 'meta_description' | 'h1' | 'faq_schema' | 'article_schema' | 'org_schema' | 'content_expand' | 'answer_style' | 'alt_text' | 'internal_links' | 'canonical' | 'og_tags';

interface Issue {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  evidence: string;
  fixType: FixType;
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
  return m ? m[1].trim() : null;
}

function analyze(url: string, html: string): { pageMeta: any; issues: Issue[] } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const description = extractMeta(html, 'description') || '';
  const ogTitle = extractMeta(html, 'og:title');
  const ogImage = extractMeta(html, 'og:image');
  const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1] || '';
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => stripTags(m[1])).filter(Boolean);
  const text = stripTags(html);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  const imgsWithoutAlt = imgTags.filter(t => !/\balt=/i.test(t) || /\balt=["']\s*["']/i.test(t)).length;
  const internalLinks = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m => m[1]).filter(h => h.startsWith('/') || (h.startsWith('http') && new URL(h, url).host === new URL(url).host));
  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const jsonLdJoined = jsonLdBlocks.join('\n').toLowerCase();
  const hasFaqSchema = /"@type"\s*:\s*"faqpage"/i.test(jsonLdJoined);
  const hasArticleSchema = /"@type"\s*:\s*"(article|blogposting|newsarticle)"/i.test(jsonLdJoined);
  const hasOrgSchema = /"@type"\s*:\s*"organization"/i.test(jsonLdJoined);
  const lower = html.toLowerCase();
  const hasFaqSection = /faq|frequently asked/i.test(lower);
  const questionParas = (text.match(/\?\s/g) || []).length;

  const issues: Issue[] = [];

  if (!title) {
    issues.push({ id: 'title-missing', severity: 'critical', category: 'Meta', title: 'Missing page title', evidence: 'No <title> tag found.', fixType: 'meta_title' });
  } else if (title.length < 30 || title.length > 65) {
    issues.push({ id: 'title-length', severity: 'high', category: 'Meta', title: 'Title length is suboptimal', evidence: `Your title is ${title.length} chars ("${title}"). Aim for 50–60.`, fixType: 'meta_title' });
  }

  if (!description) {
    issues.push({ id: 'desc-missing', severity: 'critical', category: 'Meta', title: 'Missing meta description', evidence: 'No meta description tag found.', fixType: 'meta_description' });
  } else if (description.length < 80 || description.length > 170) {
    issues.push({ id: 'desc-length', severity: 'medium', category: 'Meta', title: 'Meta description length is off', evidence: `Description is ${description.length} chars. Aim for 140–160.`, fixType: 'meta_description' });
  }

  if (h1s.length === 0) {
    issues.push({ id: 'h1-missing', severity: 'high', category: 'Structure', title: 'No H1 heading', evidence: 'Page is missing an <h1>. AI engines use H1 to understand topic.', fixType: 'h1' });
  } else if (h1s.length > 1) {
    issues.push({ id: 'h1-multiple', severity: 'medium', category: 'Structure', title: 'Multiple H1 headings', evidence: `Found ${h1s.length} H1 tags. Use only one per page.`, fixType: 'h1' });
  }

  if (!hasFaqSchema) {
    issues.push({ id: 'faq-schema', severity: 'high', category: 'Schema', title: 'Missing FAQ schema', evidence: hasFaqSection ? 'Page mentions FAQs but has no FAQPage JSON-LD schema.' : 'No FAQ section or schema found. FAQ schema boosts AI citability.', fixType: 'faq_schema' });
  }
  if (!hasArticleSchema) {
    issues.push({ id: 'article-schema', severity: 'medium', category: 'Schema', title: 'Missing Article/BlogPosting schema', evidence: 'No Article JSON-LD found. Helps AI engines attribute the content.', fixType: 'article_schema' });
  }
  if (!hasOrgSchema) {
    issues.push({ id: 'org-schema', severity: 'medium', category: 'Schema', title: 'Missing Organization schema', evidence: 'No Organization JSON-LD found. Helps establish brand entity for AI.', fixType: 'org_schema' });
  }

  if (wordCount < 300) {
    issues.push({ id: 'thin-content', severity: 'high', category: 'Content', title: 'Thin content', evidence: `Page has only ~${wordCount} words. AI engines favor comprehensive content (700+).`, fixType: 'content_expand' });
  }
  if (questionParas < 2) {
    issues.push({ id: 'answer-style', severity: 'medium', category: 'Content', title: 'Few answer-style passages', evidence: 'Content lacks question/answer-style passages that AI assistants prefer to quote.', fixType: 'answer_style' });
  }

  if (imgsWithoutAlt > 0) {
    issues.push({ id: 'alt-text', severity: 'low', category: 'Accessibility', title: 'Images missing alt text', evidence: `${imgsWithoutAlt} of ${imgTags.length} images have no alt text.`, fixType: 'alt_text' });
  }

  if (internalLinks.length < 3) {
    issues.push({ id: 'internal-links', severity: 'low', category: 'Structure', title: 'Few internal links', evidence: `Only ${internalLinks.length} internal links. Add contextual links to related pages.`, fixType: 'internal_links' });
  }

  if (!canonical) {
    issues.push({ id: 'canonical', severity: 'medium', category: 'Meta', title: 'Missing canonical tag', evidence: 'No <link rel="canonical"> found.', fixType: 'canonical' });
  }
  if (!ogTitle || !ogImage) {
    issues.push({ id: 'og-tags', severity: 'low', category: 'Meta', title: 'Incomplete Open Graph tags', evidence: `Missing ${!ogTitle ? 'og:title' : ''}${!ogTitle && !ogImage ? ' and ' : ''}${!ogImage ? 'og:image' : ''}.`, fixType: 'og_tags' });
  }

  return {
    pageMeta: { title, description, h1: h1s[0] || '', wordCount, canonical, imgCount: imgTags.length, internalLinkCount: internalLinks.length },
    issues,
  };
}

function score(issues: Issue[]): number {
  const weights: Record<Severity, number> = { critical: 18, high: 12, medium: 6, low: 3 };
  const penalty = issues.reduce((s, i) => s + weights[i.severity], 0);
  return Math.max(10, Math.min(100, 100 - penalty));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { url: rawUrl } = await req.json();
    if (!rawUrl || typeof rawUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const url = normalizeUrl(rawUrl);
    let html = '';
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIMentionYouBot/1.0; +https://aimentionyou.com)' },
        redirect: 'follow',
      });
      if (!r.ok) throw new Error(`Fetched ${url} returned ${r.status}`);
      html = await r.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: `Could not fetch ${url}. The site may be blocking bots. (${(e as Error).message})` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { pageMeta, issues } = analyze(url, html);
    const overallScore = score(issues);

    return new Response(JSON.stringify({ url, overallScore, pageMeta, issues }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
