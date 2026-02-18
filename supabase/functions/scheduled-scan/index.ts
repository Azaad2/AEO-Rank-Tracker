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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🕐 Starting scheduled auto-scan...');

    // 1. Fetch all paid users with saved domains and their plan limits
    const { data: paidSubs, error: subErr } = await supabase
      .from('subscriptions')
      .select('user_id, plan_id')
      .eq('status', 'active')
      .neq('plan_id', 'free');

    if (subErr) throw subErr;
    if (!paidSubs || paidSubs.length === 0) {
      console.log('ℹ️ No paid subscribers found');
      return new Response(JSON.stringify({ message: 'No paid subscribers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch plan limits
    const { data: plans } = await supabase
      .from('plans')
      .select('id, auto_monitor_limit');

    const planLimits: Record<string, number> = {};
    for (const p of plans || []) {
      planLimits[p.id] = (p as any).auto_monitor_limit ?? 0;
    }

    let totalScanned = 0;
    let totalSkipped = 0;

    for (const sub of paidSubs) {
      const userId = sub.user_id;
      const limit = planLimits[sub.plan_id ?? 'free'] ?? 0;

      if (limit === 0) {
        totalSkipped++;
        continue;
      }

      // 3. Get user's saved domains
      const { data: savedDomains } = await supabase
        .from('saved_domains')
        .select('domain')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!savedDomains || savedDomains.length === 0) continue;

      // Apply limit (-1 = unlimited)
      const domainsToScan = limit === -1 
        ? savedDomains 
        : savedDomains.slice(0, limit);

      for (const { domain } of domainsToScan) {
        // 4. Check if already scanned today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingScan } = await supabase
          .from('scans')
          .select('id')
          .eq('project_domain', domain)
          .eq('is_auto_scan', true)
          .gte('created_at', `${today}T00:00:00Z`)
          .limit(1);

        if (existingScan && existingScan.length > 0) {
          console.log(`⏭️ Already scanned today: ${domain}`);
          totalSkipped++;
          continue;
        }

        // 5. Get or generate prompts
        const prompts = await getOrGeneratePrompts(supabase, domain);
        if (prompts.length === 0) {
          console.log(`⚠️ No prompts generated for: ${domain}`);
          continue;
        }

        // 6. Call the scan function internally
        try {
          const scanUrl = `${supabaseUrl}/functions/v1/scan`;
          const scanResponse = await fetch(scanUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              domain,
              promptsText: prompts.join('\n'),
              market: 'en-US',
              userId,
            }),
          });

          if (!scanResponse.ok) {
            const errText = await scanResponse.text();
            console.error(`❌ Scan failed for ${domain}: ${errText}`);
            continue;
          }

          const scanResult = await scanResponse.json();

          // 7. Mark the scan as auto-scan
          if (scanResult.scanId) {
            await supabase
              .from('scans')
              .update({ is_auto_scan: true })
              .eq('id', scanResult.scanId);
            
            // Auto-scans don't count against user quotas, so reverse the increment
            const { data: subData } = await supabase
              .from('subscriptions')
              .select('id, prompts_used, scans_used')
              .eq('user_id', userId)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (subData) {
              await supabase
                .from('subscriptions')
                .update({
                  prompts_used: Math.max(0, (subData.prompts_used || 0) - prompts.length),
                  scans_used: Math.max(0, (subData.scans_used || 0) - 1),
                })
                .eq('id', subData.id);
            }
          }

          totalScanned++;
          console.log(`✅ Auto-scan complete for ${domain} (score: ${scanResult.score})`);
        } catch (scanErr) {
          console.error(`❌ Scan error for ${domain}:`, scanErr);
        }

        // Rate limiting delay between domains
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    const summary = { totalScanned, totalSkipped, timestamp: new Date().toISOString() };
    console.log('📊 Scheduled scan complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Scheduled scan error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getOrGeneratePrompts(supabase: any, domain: string): Promise<string[]> {
  // Check for cached prompts (regenerate weekly)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: cached } = await supabase
    .from('monitoring_prompts')
    .select('prompts, updated_at')
    .eq('domain', domain)
    .gte('updated_at', oneWeekAgo)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached?.prompts && cached.prompts.length > 0) {
    console.log(`📋 Using cached prompts for ${domain}`);
    return cached.prompts;
  }

  // Generate prompts using Lovable AI
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.log('⚠️ LOVABLE_API_KEY not set, using fallback prompts');
    return generateFallbackPrompts(domain);
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You generate search prompts for AI visibility monitoring. Return ONLY a JSON array of 5 strings. No markdown, no explanation.',
          },
          {
            role: 'user',
            content: `Generate 5 diverse prompts that a user might ask an AI assistant where the website "${domain}" could naturally appear in the answer. Include prompts about: best tools/services in the industry, comparisons, alternatives, recommendations, and how-to guides. Return JSON array only.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('❌ Lovable AI error:', response.status);
      return generateFallbackPrompts(domain);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ Could not parse prompts from AI response');
      return generateFallbackPrompts(domain);
    }

    const prompts: string[] = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return generateFallbackPrompts(domain);
    }

    // Cache the prompts
    const { data: existing } = await supabase
      .from('monitoring_prompts')
      .select('id')
      .eq('domain', domain)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('monitoring_prompts')
        .update({ prompts, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('monitoring_prompts')
        .insert({ domain, prompts });
    }

    console.log(`🤖 Generated ${prompts.length} AI prompts for ${domain}`);
    return prompts.slice(0, 5);
  } catch (err) {
    console.error('❌ Prompt generation error:', err);
    return generateFallbackPrompts(domain);
  }
}

function generateFallbackPrompts(domain: string): string[] {
  const brandName = domain.split('.')[0];
  const capitalBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  return [
    `What is ${capitalBrand} and what does it do?`,
    `Best alternatives to ${capitalBrand}`,
    `Is ${capitalBrand} good for businesses?`,
    `Top tools like ${domain}`,
    `${capitalBrand} review and features`,
  ];
}
