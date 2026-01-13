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
    const { yourDomain, competitors, industry } = await req.json();

    if (!yourDomain) {
      return new Response(
        JSON.stringify({ error: 'Your domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI visibility and competitive analysis expert.

Analyze the competitive landscape for AI visibility and provide insights on:
1. How each domain might appear in AI responses
2. Strengths and weaknesses for AI citation
3. Content strategy recommendations
4. Opportunities to outrank competitors in AI responses

Return your response as JSON with this structure:
{
  "yourDomain": {
    "domain": "domain.com",
    "aiVisibilityScore": 75,
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"]
  },
  "competitors": [
    {
      "domain": "competitor.com",
      "aiVisibilityScore": 80,
      "strengths": ["Strength 1"],
      "weaknesses": ["Weakness 1"],
      "threatLevel": "high|medium|low"
    }
  ],
  "opportunities": [
    {
      "opportunity": "Description",
      "priority": "high|medium|low",
      "effort": "low|medium|high",
      "impact": "Potential impact"
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "contentGaps": ["Gap 1", "Gap 2"]
}`;

    const competitorList = competitors?.length > 0 ? competitors.join(', ') : 'general industry competitors';
    
    const userPrompt = `Analyze AI visibility competitive landscape:
- Your Domain: ${yourDomain}
- Competitors: ${competitorList}
${industry ? `- Industry: ${industry}` : ''}

Provide a comprehensive competitive analysis for AI visibility.`;

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
      throw new Error('Failed to analyze competitors');
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
