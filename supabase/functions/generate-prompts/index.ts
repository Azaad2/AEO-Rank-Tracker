/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  industry: string;
  businessDescription: string;
  targetAudience: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, businessDescription, targetAudience } = (await req.json()) as RequestBody;

    if (!industry || !businessDescription) {
      return new Response(
        JSON.stringify({ error: "Industry and business description are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert in AI search optimization and customer research. Your task is to generate prompts that customers in a specific industry typically ask AI assistants like ChatGPT, Gemini, Claude, and Perplexity.

Generate 15 diverse prompts that potential customers might ask AI assistants when researching products or services in this industry. Each prompt should:
1. Be realistic and commonly asked
2. Represent different stages of the customer journey (awareness, consideration, decision)
3. Include a mix of informational, comparative, and transactional queries

Return your response as a JSON array with objects containing:
- "prompt": The exact prompt a user might type
- "category": One of "Informational", "Comparative", "Transactional", "Problem-Solving", "Research"
- "intent": A brief description of what the user is trying to achieve`;

    const userPrompt = `Industry: ${industry}
Business Description: ${businessDescription}
Target Audience: ${targetAudience}

Generate 15 AI prompts that customers in this industry would ask AI assistants. Focus on prompts where this type of business could potentially be mentioned or recommended.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    let prompts;
    try {
      const parsed = JSON.parse(content);
      prompts = parsed.prompts || parsed;
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify({ prompts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-prompts:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate prompts";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
