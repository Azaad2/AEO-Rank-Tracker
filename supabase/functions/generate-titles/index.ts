import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords, contentType, tone } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a headline writing expert specializing in SEO-optimized, click-worthy titles.

Generate 10 title variations that:
1. Are under 60 characters for SEO
2. Include relevant keywords naturally
3. Are compelling and click-worthy
4. Vary in style (how-to, listicle, question, etc.)
5. Are optimized for AI discovery and citation

Return your response as JSON with this structure:
{
  "titles": [
    {
      "title": "The title text",
      "charCount": 55,
      "style": "how-to|listicle|question|statement|comparison",
      "emotionalTrigger": "curiosity|urgency|value|fear|excitement",
      "seoScore": 85
    }
  ],
  "bestPick": {
    "title": "The recommended title",
    "reason": "Why this title is the best choice"
  },
  "tips": ["Tip 1", "Tip 2"]
}`;

    const userPrompt = `Generate 10 SEO-optimized titles for:
- Topic: ${topic}
${keywords ? `- Target Keywords: ${keywords}` : ''}
${contentType ? `- Content Type: ${contentType}` : ''}
${tone ? `- Tone: ${tone}` : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to generate titles');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsedContent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      parsedContent = { error: 'Failed to parse response', raw: content };
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
