import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, userId } = await req.json();

    if (!domain) {
      return new Response(JSON.stringify({ error: "Domain is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine suggestion limit from user's plan
    let suggestionsLimit = 0;

    if (userId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub?.plan_id) {
        const { data: plan } = await supabase
          .from("plans")
          .select("suggested_prompts_limit")
          .eq("id", sub.plan_id)
          .single();

        suggestionsLimit = plan?.suggested_prompts_limit ?? 0;
      }
    }

    if (suggestionsLimit === 0) {
      return new Response(
        JSON.stringify({ error: "Upgrade to a paid plan to unlock AI-suggested prompts", suggestions: [] }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an SEO and AI visibility expert. Given a website domain, generate search prompts that potential customers might type into AI assistants like ChatGPT, Perplexity, or Gemini. Each prompt should be realistic and relevant to the domain's industry.",
          },
          {
            role: "user",
            content: `Given the website domain "${domain}", generate exactly ${suggestionsLimit} search prompts that a potential customer or user might type into an AI assistant. For each prompt, provide: the prompt text, ranking difficulty (low/medium/high), estimated monthly search volume (low/medium/high), and 2-3 focus keywords.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_suggestions",
              description: "Return the generated prompt suggestions with SEO data.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        prompt: { type: "string", description: "The search prompt text" },
                        difficulty: { type: "string", enum: ["low", "medium", "high"], description: "Ranking difficulty" },
                        volume: { type: "string", enum: ["low", "medium", "high"], description: "Estimated search volume" },
                        keywords: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 focus keywords",
                        },
                      },
                      required: ["prompt", "difficulty", "volume", "keywords"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const suggestions = (parsed.suggestions || []).slice(0, suggestionsLimit);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("suggest-prompts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
