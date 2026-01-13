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
    const { brandName, industry, products } = await req.json();

    if (!brandName) {
      return new Response(
        JSON.stringify({ error: 'Brand name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a brand monitoring expert specializing in AI visibility and mentions.

Analyze how a brand might appear in AI responses and provide:
1. Common queries where the brand might be mentioned
2. Sentiment analysis predictions
3. Brand association analysis
4. Recommendations for improving AI mentions

Return your response as JSON with this structure:
{
  "brandOverview": {
    "name": "Brand Name",
    "industry": "Industry",
    "aiPresenceScore": 70
  },
  "likelyMentions": [
    {
      "queryType": "Type of query",
      "exampleQuery": "Example question users might ask",
      "mentionLikelihood": "high|medium|low",
      "context": "How brand might be mentioned"
    }
  ],
  "sentimentPrediction": {
    "overall": "positive|neutral|negative",
    "factors": ["Factor 1", "Factor 2"]
  },
  "brandAssociations": {
    "positive": ["Association 1", "Association 2"],
    "negative": ["Association 1"],
    "neutral": ["Association 1"]
  },
  "competitorMentions": ["Competitor often mentioned alongside"],
  "recommendations": [
    {
      "action": "What to do",
      "priority": "high|medium|low",
      "expectedImpact": "Impact description"
    }
  ],
  "monitoringQueries": ["Query 1 to monitor", "Query 2 to monitor"]
}`;

    const userPrompt = `Analyze AI visibility for brand:
- Brand Name: ${brandName}
${industry ? `- Industry: ${industry}` : ''}
${products ? `- Key Products/Services: ${products}` : ''}

Provide comprehensive brand monitoring insights for AI visibility.`;

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
      throw new Error('Failed to monitor brand');
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
