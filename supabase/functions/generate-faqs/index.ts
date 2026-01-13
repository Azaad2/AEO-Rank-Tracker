/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  businessDescription: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessDescription } = (await req.json()) as RequestBody;

    if (!businessDescription) {
      return new Response(
        JSON.stringify({ error: "Business description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert in SEO and content optimization for AI search engines. Your task is to generate FAQ content that AI assistants are likely to cite when answering related queries.

Generate 12 high-quality FAQs that:
1. Address common questions potential customers would ask
2. Provide clear, concise, and authoritative answers
3. Include relevant keywords naturally
4. Are optimized for AI assistants to extract and cite
5. Cover different aspects: features, pricing, comparisons, how-to, troubleshooting

Each answer should be 2-4 sentences, providing enough detail to be helpful but concise enough to be easily cited.

Return your response as a JSON object with a "faqs" array containing objects with:
- "question": The FAQ question
- "answer": The detailed answer`;

    const userPrompt = `Business/Product Description: ${businessDescription}

Generate 12 FAQs that AI assistants would want to cite when users ask about this type of business/product.`;

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
        max_tokens: 3000,
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

    let faqs;
    try {
      const parsed = JSON.parse(content);
      faqs = parsed.faqs || parsed;
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify({ faqs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-faqs:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate FAQs";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
