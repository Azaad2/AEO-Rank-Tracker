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
    const { currentTitle, currentDescription, pageContent, targetKeyword } = await req.json();

    if (!pageContent && !currentTitle) {
      return new Response(
        JSON.stringify({ error: 'Page content or current title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an SEO expert specializing in meta tag optimization for both traditional search engines and AI systems.

Analyze the provided content and generate optimized meta tags that:
1. Are within character limits (title: 60 chars, description: 160 chars)
2. Include target keywords naturally
3. Are compelling and click-worthy
4. Are optimized for AI citation and discovery

Return your response as JSON with this structure:
{
  "optimizedTitle": "New optimized title",
  "optimizedDescription": "New optimized meta description",
  "titleAnalysis": {
    "length": 55,
    "hasKeyword": true,
    "improvements": ["Improvement 1"]
  },
  "descriptionAnalysis": {
    "length": 155,
    "hasKeyword": true,
    "improvements": ["Improvement 1"]
  },
  "alternativeTitles": ["Alternative 1", "Alternative 2"],
  "alternativeDescriptions": ["Alternative 1", "Alternative 2"],
  "ogTags": {
    "ogTitle": "Open Graph title",
    "ogDescription": "Open Graph description"
  }
}`;

    const userPrompt = `Optimize meta tags for:
${currentTitle ? `- Current Title: ${currentTitle}` : ''}
${currentDescription ? `- Current Description: ${currentDescription}` : ''}
${targetKeyword ? `- Target Keyword: ${targetKeyword}` : ''}
${pageContent ? `- Page Content: ${pageContent.substring(0, 1000)}` : ''}`;

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
      throw new Error('Failed to optimize meta tags');
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
