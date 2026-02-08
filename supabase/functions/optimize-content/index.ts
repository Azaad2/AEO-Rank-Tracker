import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, targetKeyword } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const keywordContext = targetKeyword ? `\nTarget keyword: "${targetKeyword}"` : '';

    const prompt = `You are an AI visibility optimization expert. Analyze the following content and provide specific recommendations to make it more likely to be cited by AI assistants like ChatGPT, Gemini, and Perplexity.
${keywordContext}

Content to analyze:
---
${content.substring(0, 3000)}
---

Respond with valid JSON only:
{
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", ...],
  "faqRecommendations": ["question that should be added as FAQ 1", "question 2", ...],
  "schemaSnippet": "a JSON-LD schema markup snippet for this content (as a string)",
  "rewrittenContent": "a rewritten version of the first 2-3 paragraphs optimized for AI citability"
}

Focus on:
1. Clear, factual statements that AI can quote
2. Structured formatting (headers, lists, definitions)
3. Authoritative language and data points
4. FAQ-style Q&A format for key topics
5. Schema markup that helps AI understand the content`;

    console.log('Optimizing content, length:', content.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an AI content optimization expert. Always respond with valid JSON only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content in AI response");
    }

    let result;
    try {
      const cleaned = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      result = {
        suggestions: [
          "Add clear, factual statements that AI can easily quote",
          "Structure content with headers and bullet points",
          "Include FAQ sections with common questions",
          "Add schema markup for better AI understanding",
        ],
        faqRecommendations: [
          `What is ${targetKeyword || 'this topic'}?`,
          `How does ${targetKeyword || 'this'} work?`,
        ],
        schemaSnippet: '{"@context":"https://schema.org","@type":"Article"}',
        rewrittenContent: "Unable to generate rewrite. Please try again.",
      };
    }

    console.log('Content optimization complete');

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Content optimization error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
