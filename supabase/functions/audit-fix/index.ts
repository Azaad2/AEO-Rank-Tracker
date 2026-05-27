import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPTS: Record<string, (ctx: any) => string> = {
  meta_title: (c) => `Write an optimized HTML <title> tag (50–60 chars) for this page. Page URL: ${c.url}. Existing title: "${c.pageMeta.title}". H1: "${c.pageMeta.h1}". Return ONLY the full <title>...</title> tag.`,
  meta_description: (c) => `Write an optimized meta description (140–160 chars) for ${c.url}. Title: "${c.pageMeta.title}". H1: "${c.pageMeta.h1}". Return ONLY the full <meta name="description" content="..."> tag.`,
  h1: (c) => `Write an optimized single H1 heading for ${c.url}. Current title: "${c.pageMeta.title}". Return ONLY the <h1>...</h1> tag.`,
  faq_schema: (c) => `Generate a complete FAQPage JSON-LD schema with 5 realistic FAQs for the topic of this page. Page title: "${c.pageMeta.title}". URL: ${c.url}. Return ONLY a complete <script type="application/ld+json">...</script> block.`,
  article_schema: (c) => `Generate Article JSON-LD schema for ${c.url}. Title: "${c.pageMeta.title}". Description: "${c.pageMeta.description}". Return ONLY a complete <script type="application/ld+json">...</script> block.`,
  org_schema: (c) => `Generate Organization JSON-LD schema for the brand at ${c.url}. Title: "${c.pageMeta.title}". Return ONLY a complete <script type="application/ld+json">...</script> block. Include name, url, logo, sameAs (leave placeholders for social URLs).`,
  content_expand: (c) => `Suggest 5 specific sections (with H2 headings and 2-3 sentence summaries) to add to ${c.url} to expand it to 1000+ words. Topic from title: "${c.pageMeta.title}". Format as markdown.`,
  answer_style: (c) => `Write 3 question-and-answer style paragraphs that could be added to ${c.url} to improve AI citability. Topic: "${c.pageMeta.title}". Format as: **Q: ...** then a 2-3 sentence answer.`,
  alt_text: (c) => `Provide 5 example descriptive alt text strings (each under 125 chars) appropriate for images on a page titled "${c.pageMeta.title}". Return as a numbered list.`,
  internal_links: (c) => `Suggest 5 internal link anchor texts and target page ideas to add to ${c.url}. Page title: "${c.pageMeta.title}". Return as a markdown list with anchor text and suggested target URL slug.`,
  canonical: (c) => `Return the exact canonical link tag for ${c.url}. Return ONLY: <link rel="canonical" href="${c.url}" />`,
  og_tags: (c) => `Generate complete Open Graph tags (og:title, og:description, og:url, og:image, og:type) for ${c.url}. Title: "${c.pageMeta.title}". Description: "${c.pageMeta.description}". Return ONLY the meta tags.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sign in required to generate fixes' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { url, fixType, pageMeta } = await req.json();
    if (!url || !fixType || !PROMPTS[fixType]) {
      return new Response(JSON.stringify({ error: 'url and valid fixType required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const prompt = PROMPTS[fixType]({ url, pageMeta: pageMeta || {} });
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an SEO and AI/GEO expert. Return concise, copy-pasteable code or text — no explanations unless asked.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: 'Rate limit, try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (r.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway error ${r.status}`);
    }
    const data = await r.json();
    const fix = data.choices?.[0]?.message?.content?.trim() || '';
    return new Response(JSON.stringify({ fix, userId: user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
