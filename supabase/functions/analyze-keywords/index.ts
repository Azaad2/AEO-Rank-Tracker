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
    const { seedKeyword, industry, intent } = await req.json();

    if (!seedKeyword) {
      return new Response(
        JSON.stringify({ error: 'Seed keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an SEO keyword research expert specializing in AI-focused keyword opportunities.

Analyze the seed keyword and generate keyword opportunities that:
1. Have high AI citation potential
2. Are relevant to the industry
3. Cover different search intents
4. Include long-tail variations

Return your response as JSON with this structure:
{
  "seedKeyword": "original keyword",
  "keywords": [
    {
      "keyword": "keyword phrase",
      "type": "primary|secondary|long-tail",
      "intent": "informational|transactional|navigational|commercial",
      "difficulty": "low|medium|high",
      "aiPotential": "low|medium|high",
      "suggestedContent": "Type of content to create"
    }
  ],
  "topicClusters": [
    {
      "pillarTopic": "Main topic",
      "subtopics": ["Subtopic 1", "Subtopic 2"]
    }
  ],
  "contentGaps": ["Gap 1", "Gap 2"],
  "aiOptimizationNotes": "Notes on optimizing for AI"
}`;

    const userPrompt = `Analyze keywords for:
- Seed Keyword: ${seedKeyword}
${industry ? `- Industry: ${industry}` : ''}
${intent ? `- Target Intent: ${intent}` : ''}

Generate 15-20 keyword opportunities.`;

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
      throw new Error('Failed to analyze keywords');
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
