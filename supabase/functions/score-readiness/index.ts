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
    const { websiteUrl, content } = await req.json();

    if (!websiteUrl && !content) {
      return new Response(
        JSON.stringify({ error: 'Website URL or content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI readiness assessment expert. Evaluate content or websites for LLM/AI optimization.

Score the content on a scale of 0-100 based on:
1. Content clarity and structure
2. Factual accuracy signals
3. Authority indicators
4. Technical SEO for AI
5. Schema markup readiness
6. Citation-worthiness

Return your response as JSON with this structure:
{
  "overallScore": 75,
  "grade": "B+",
  "categories": {
    "contentClarity": { "score": 80, "weight": 20 },
    "structure": { "score": 70, "weight": 15 },
    "authority": { "score": 65, "weight": 20 },
    "technicalSEO": { "score": 85, "weight": 15 },
    "schemaReadiness": { "score": 60, "weight": 15 },
    "citability": { "score": 75, "weight": 15 }
  },
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "prioritizedActions": [
    {
      "action": "What to do",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "scoreIncrease": 5
    }
  ],
  "competitivePosition": "How this compares to industry average",
  "aiReadinessLevel": "beginner|intermediate|advanced|expert"
}`;

    const userPrompt = websiteUrl 
      ? `Evaluate LLM readiness for website: ${websiteUrl}`
      : `Evaluate LLM readiness for this content:\n\n${content.substring(0, 3000)}`;

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
      throw new Error('Failed to score readiness');
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    let parsedContent;
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      parsedContent = { error: 'Failed to parse response', raw: responseContent };
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
