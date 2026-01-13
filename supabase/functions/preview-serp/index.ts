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
    const { title, description, url } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an SEO expert specializing in SERP optimization.

Analyze the provided title, description, and URL for search appearance and provide:
1. Character count analysis
2. Truncation warnings
3. Optimization suggestions
4. Click-through rate predictions
5. How it might appear in AI responses

Return your response as JSON with this structure:
{
  "preview": {
    "displayTitle": "Title as it would appear (truncated if needed)",
    "displayDescription": "Description as it would appear",
    "displayUrl": "URL path display"
  },
  "analysis": {
    "title": {
      "length": 55,
      "maxLength": 60,
      "isTruncated": false,
      "hasKeywords": true,
      "rating": "good"
    },
    "description": {
      "length": 150,
      "maxLength": 160,
      "isTruncated": false,
      "hasCallToAction": true,
      "rating": "good"
    },
    "url": {
      "isClean": true,
      "hasKeywords": true,
      "rating": "good"
    }
  },
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ],
  "ctrPrediction": {
    "score": "above-average",
    "factors": ["Factor 1", "Factor 2"]
  },
  "aiAppearance": "How this might appear when cited by AI assistants"
}`;

    const userPrompt = `Analyze this SERP appearance:
- Title: ${title}
- Description: ${description || 'Not provided'}
- URL: ${url || 'Not provided'}`;

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
      throw new Error('Failed to preview SERP');
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
