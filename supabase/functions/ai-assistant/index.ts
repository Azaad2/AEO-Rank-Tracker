import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an AI SEO assistant for AImentionyou — an AI visibility tracking platform. You help users optimize their brand's presence across AI platforms like ChatGPT, Gemini, and Perplexity.

You can help users with:
1. **Running AI visibility scans** — Analyze how AI assistants mention a domain
2. **Generating SEO titles** — Create optimized titles for web pages
3. **Generating meta descriptions** — Write compelling meta descriptions
4. **Generating FAQs** — Create FAQ content and schema markup
5. **Creating blog outlines** — Plan blog content structure
6. **Analyzing competitors** — Find who competes for AI visibility
7. **General SEO advice** — Answer questions about AI visibility optimization

When a user asks to perform an action, identify the intent and respond helpfully. Format your responses using markdown for readability. Be concise but thorough.

If a user asks to scan a domain, generate content, or analyze competitors, provide helpful guidance and insights directly. You have deep knowledge of SEO, AI visibility, and content optimization.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Service role client for DB operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check usage limits
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("chat_messages_used, plan_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    const chatMessagesUsed = sub?.chat_messages_used || 0;

    const { data: planData } = await supabaseAdmin
      .from("plans")
      .select("chat_limit")
      .eq("id", sub?.plan_id || "free")
      .single();

    const chatLimit = planData?.chat_limit ?? 10;

    if (chatLimit !== -1 && chatMessagesUsed >= chatLimit) {
      return new Response(
        JSON.stringify({
          error: "Chat message limit reached. Please upgrade your plan.",
          limit_reached: true,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { messages } = await req.json();

    // Increment usage
    await supabaseAdmin
      .from("subscriptions")
      .update({ chat_messages_used: chatMessagesUsed + 1 })
      .eq("user_id", userId)
      .eq("status", "active");

    // Save user message
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      await supabaseAdmin.from("chat_messages").insert({
        user_id: userId,
        role: "user",
        content: lastUserMsg.content,
      });
    }

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream response back, and also collect full response to save
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullAssistantResponse = "";

    (async () => {
      const reader = response.body!.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Forward chunk to client
          await writer.write(encoder.encode(chunk));

          // Parse for collecting full response
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullAssistantResponse += content;
            } catch {
              // partial JSON, ignore
            }
          }
        }
      } catch (e) {
        console.error("Stream error:", e);
      } finally {
        await writer.close();
        // Save assistant message
        if (fullAssistantResponse) {
          await supabaseAdmin.from("chat_messages").insert({
            user_id: userId,
            role: "assistant",
            content: fullAssistantResponse,
          });
        }
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
