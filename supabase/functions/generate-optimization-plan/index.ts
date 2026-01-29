import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
  geminiMentioned: boolean;
  geminiCited: boolean;
  geminiResponse: string;
  geminiCompetitors: string[];
  perplexityMentioned?: boolean;
  perplexityCited?: boolean;
  perplexityResponse?: string;
  perplexityCompetitors?: string[];
}

interface RequestBody {
  domain: string;
  score: number;
  results: ScanResult[];
  competitors: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { domain, score, results, competitors }: RequestBody = await req.json();
    
    if (!domain || !results || results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Domain and results are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Analyze failed prompts
    const failedPrompts = results.filter(r => !r.geminiMentioned && !r.geminiCited && !r.mentioned && !r.cited);
    const partiallyVisiblePrompts = results.filter(r => (r.geminiMentioned || r.mentioned) && !r.geminiCited && !r.cited);
    const successfulPrompts = results.filter(r => r.geminiCited || r.cited);

    // Build the analysis prompt
    const analysisPrompt = `You are an AI visibility optimization expert. Analyze why the website "${domain}" has low visibility in AI-generated answers and provide actionable recommendations.

## Current Situation
- Domain: ${domain}
- Overall AI Visibility Score: ${score}/100
- Total prompts analyzed: ${results.length}
- Fully invisible in: ${failedPrompts.length} prompts
- Partially visible in: ${partiallyVisiblePrompts.length} prompts
- Successfully cited in: ${successfulPrompts.length} prompts

## Failed Prompts (Not mentioned or cited):
${failedPrompts.slice(0, 5).map(r => `- "${r.prompt}" (Competitors: ${r.geminiCompetitors?.slice(0, 3).join(', ') || 'N/A'})`).join('\n')}

## Top Competitors Appearing Instead:
${competitors.slice(0, 5).map(c => `- ${c}`).join('\n')}

## Task
Provide a comprehensive optimization plan in the following JSON format:

{
  "diagnosis": {
    "summary": "2-3 sentence summary of why the brand is invisible",
    "rootCauses": ["cause1", "cause2", "cause3"]
  },
  "promptFixes": [
    {
      "prompt": "the exact prompt text",
      "rootCause": "specific reason for invisibility in this prompt",
      "contentSuggestion": "detailed content recommendation (2-3 sentences)",
      "faqsToAdd": ["faq question 1", "faq question 2"],
      "schemaType": "recommended schema type (e.g., FAQPage, HowTo, Product)",
      "priority": "high|medium|low"
    }
  ],
  "quickWins": [
    {
      "action": "specific action to take",
      "impact": "expected improvement (e.g., +5-10 visibility points)",
      "effort": "time estimate (e.g., 15 minutes, 1 hour)",
      "toolLink": "optional tool slug (e.g., faq-generator, schema-generator)"
    }
  ],
  "competitorInsights": [
    {
      "competitor": "competitor domain",
      "strength": "what they're doing right",
      "opportunity": "how to compete with them"
    }
  ],
  "contentStrategy": {
    "topicClusters": ["topic1", "topic2"],
    "authorityBuilding": "recommendation for building authority",
    "technicalSEO": "any technical improvements needed"
  }
}

Respond ONLY with valid JSON, no markdown formatting.`;

    console.log(`Generating optimization plan for ${domain} with score ${score}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an AI visibility and SEO optimization expert. Always respond with valid JSON only." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let optimizationPlan;
    try {
      // Clean up potential markdown formatting
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      optimizationPlan = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a fallback plan
      optimizationPlan = {
        diagnosis: {
          summary: `Your website ${domain} has limited visibility in AI-generated answers. This is likely due to insufficient authority signals and content gaps for the specific queries being analyzed.`,
          rootCauses: [
            "Missing comprehensive content for target queries",
            "Lack of structured data (FAQ, HowTo schemas)",
            "Lower domain authority compared to competitors"
          ]
        },
        promptFixes: failedPrompts.slice(0, 3).map(r => ({
          prompt: r.prompt,
          rootCause: "Content gap - no dedicated content addressing this query",
          contentSuggestion: `Create a comprehensive page or section specifically addressing "${r.prompt}" with detailed information, comparisons, and unique insights.`,
          faqsToAdd: [`What is ${r.prompt}?`, `How does ${domain} help with ${r.prompt}?`],
          schemaType: "FAQPage",
          priority: "high"
        })),
        quickWins: [
          { action: "Add FAQ schema to your main product/service pages", impact: "+5-8 visibility points", effort: "30 minutes", toolLink: "ai-faq-generator" },
          { action: "Create comparison content vs top competitors", impact: "+10-15 visibility points", effort: "2-3 hours", toolLink: "content-auditor" },
          { action: "Implement HowTo schema for tutorial content", impact: "+3-5 visibility points", effort: "20 minutes", toolLink: "schema-generator" }
        ],
        competitorInsights: competitors.slice(0, 3).map(c => ({
          competitor: c,
          strength: "Appears frequently in AI answers for your target queries",
          opportunity: "Analyze their content structure and create more comprehensive alternatives"
        })),
        contentStrategy: {
          topicClusters: failedPrompts.slice(0, 3).map(r => r.prompt.split(' ').slice(0, 3).join(' ')),
          authorityBuilding: "Focus on earning backlinks from industry publications and creating original research or data studies.",
          technicalSEO: "Ensure proper meta tags, fast loading times, and mobile optimization."
        }
      };
    }

    console.log(`Successfully generated optimization plan for ${domain}`);

    return new Response(
      JSON.stringify({
        success: true,
        domain,
        score,
        plan: optimizationPlan
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating optimization plan:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
