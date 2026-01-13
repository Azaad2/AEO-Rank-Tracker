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
    const { pageContent, title, targetKeyword } = await req.json();

    if (!pageContent && !title) {
      return new Response(
        JSON.stringify({ error: 'Page content or title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an SEO expert specializing in meta descriptions that drive clicks and AI citations.

Generate 5 meta description variations that:
1. Are 150-160 characters for optimal display
2. Include a clear value proposition
3. Have a call-to-action
4. Include the target keyword naturally
5. Are optimized for AI discovery

Return your response as JSON with this structure:
{
  "descriptions": [
    {
      "text": "The meta description text",
      "charCount": 155,
      "hasKeyword": true,
      "hasCTA": true,
      "style": "benefit-focused|question|direct|emotional"
    }
  ],
  "bestPick": {
    "text": "The recommended description",
    "reason": "Why this is the best choice"
  },
  "aiOptimized": "Version specifically optimized for AI citation",
  "tips": ["Tip 1", "Tip 2"]
}`;

    const userPrompt = `Generate 5 meta descriptions for:
${title ? `- Page Title: ${title}` : ''}
${targetKeyword ? `- Target Keyword: ${targetKeyword}` : ''}
${pageContent ? `- Page Content Summary: ${pageContent.substring(0, 500)}` : ''}`;

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
      throw new Error('Failed to generate descriptions');
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
