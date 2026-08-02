// domain-profile: reads a website, works out what it actually sells, and
// returns category-anchored prompts to test. Called before a scan so we never
// guess the market from the domain string alone.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  getDomainProfile,
  normalizeDomain,
  suggestPromptsForProfile,
} from '../_shared/domain-profile.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawDomain = typeof body?.domain === 'string' ? body.domain.trim() : '';
    const withPrompts = body?.withPrompts !== false;
    const force = body?.force === true;
    const promptCount = Math.min(Math.max(Number(body?.promptCount) || 6, 3), 10);

    if (!rawDomain || rawDomain.length < 3 || !rawDomain.includes('.')) {
      return new Response(JSON.stringify({ error: 'A valid domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const domain = normalizeDomain(rawDomain);
    const profile = await getDomainProfile(supabase, domain, apiKey, { force });

    let prompts: string[] = [];
    if (withPrompts) {
      try {
        prompts = await suggestPromptsForProfile(profile, apiKey, promptCount);
      } catch (e) {
        console.error('prompt suggestion failed:', e);
      }
    }

    return new Response(
      JSON.stringify({
        profile: {
          domain: profile.domain,
          brandName: profile.brandName,
          category: profile.category,
          description: profile.description,
          icp: profile.icp,
          knownCompetitors: profile.knownCompetitors,
          readable: profile.fetchOk,
          source: profile.source,
        },
        prompts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('domain-profile error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
