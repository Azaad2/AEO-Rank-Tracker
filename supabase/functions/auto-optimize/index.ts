import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scanId, userId, domain, scanResults, score } = await req.json();

    if (!scanId || !userId || !domain || !scanResults) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Insert pending record first
    const { data: optRecord, error: insertErr } = await supabase
      .from('auto_optimizations')
      .insert({ scan_id: scanId, user_id: userId, status: 'pending' })
      .select()
      .single();

    if (insertErr) {
      console.error('Insert error:', insertErr);
      throw new Error('Failed to create optimization record');
    }

    // Build context from scan results
    const failedPrompts = scanResults.filter((r: any) => !r.geminiMentioned && !r.cited);
    const weakPrompts = scanResults.filter((r: any) => r.geminiMentioned && !r.geminiCited && !r.cited);
    const allPrompts = scanResults.map((r: any) => r.prompt);

    const promptContext = failedPrompts.length > 0
      ? failedPrompts.map((r: any) => `- "${r.prompt}" (not mentioned, not cited)`).join('\n')
      : weakPrompts.length > 0
        ? weakPrompts.map((r: any) => `- "${r.prompt}" (mentioned but not cited)`).join('\n')
        : allPrompts.map((p: string) => `- "${p}"`).join('\n');

    const systemPrompt = `You are an AI visibility optimization expert. A website "${domain}" was scanned for AI visibility across Gemini, Perplexity, and Google. Their score is ${score}/100.

You must return a JSON object with exactly these keys:
{
  "content_suggestions": [{"prompt": "the query", "title": "suggested content title", "content": "2-3 paragraph content piece optimized for AI citation"}],
  "faq_schema": "complete JSON-LD FAQ schema markup as a string",
  "blog_outlines": [{"title": "blog title", "sections": [{"heading": "h2 heading", "points": ["key point 1", "key point 2"]}]}],
  "meta_rewrites": [{"page": "page description", "title": "optimized title under 60 chars", "description": "optimized meta description under 160 chars"}]
}

Rules:
- content_suggestions: Write 2-3 paragraph content for each failed/weak prompt that would make AI cite this domain. Be specific, factual, authoritative.
- faq_schema: Generate valid JSON-LD FAQ schema with 3-5 Q&As covering the gaps. Must be valid JSON-LD.
- blog_outlines: Create 1-2 blog outlines targeting the weakest areas. Each has 3-5 sections with 2-3 key points each.
- meta_rewrites: Suggest 2-3 optimized meta titles and descriptions for key pages.
- Return ONLY valid JSON, no markdown, no code fences.`;

    const userPrompt = `Domain: ${domain}
Score: ${score}/100
Failed/weak prompts that need optimization:
${promptContext}

Generate a complete optimization package to help this domain rank in AI answers for these queries.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      
      await supabase
        .from('auto_optimizations')
        .update({ status: 'failed' })
        .eq('id', optRecord.id);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Parse the AI response
    let parsed: any;
    try {
      // Strip potential markdown code fences
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr, content.substring(0, 500));
      // Create fallback
      parsed = {
        content_suggestions: failedPrompts.slice(0, 3).map((r: any) => ({
          prompt: r.prompt,
          title: `How ${domain} excels at: ${r.prompt}`,
          content: `Create comprehensive content addressing "${r.prompt}" with specific data, examples, and authoritative insights from ${domain}.`,
        })),
        faq_schema: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": failedPrompts.slice(0, 3).map((r: any) => ({
            "@type": "Question",
            "name": r.prompt,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${domain} provides expert solutions for ${r.prompt}. Visit our website for detailed information.`
            }
          }))
        }, null, 2),
        blog_outlines: [{
          title: `Complete Guide: ${failedPrompts[0]?.prompt || 'AI Visibility'}`,
          sections: [
            { heading: "Understanding the Challenge", points: ["Current landscape", "Key factors"] },
            { heading: "Solutions and Best Practices", points: ["Actionable steps", "Expert recommendations"] },
            { heading: "Implementation Guide", points: ["Step-by-step process", "Tools and resources"] },
          ]
        }],
        meta_rewrites: [{
          page: "Homepage",
          title: `${domain} - Expert Solutions`,
          description: `Discover how ${domain} leads in providing expert solutions. Trusted by professionals worldwide.`
        }],
      };
    }

    // Update the record with results
    const { error: updateErr } = await supabase
      .from('auto_optimizations')
      .update({
        content_suggestions: parsed.content_suggestions || [],
        faq_schema: typeof parsed.faq_schema === 'string' ? parsed.faq_schema : JSON.stringify(parsed.faq_schema, null, 2),
        blog_outlines: parsed.blog_outlines || [],
        meta_rewrites: parsed.meta_rewrites || [],
        status: 'complete',
      })
      .eq('id', optRecord.id);

    if (updateErr) {
      console.error('Update error:', updateErr);
    }

    console.log('✅ Auto-optimization complete for scan:', scanId);

    return new Response(
      JSON.stringify({ success: true, id: optRecord.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Auto-optimize error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
