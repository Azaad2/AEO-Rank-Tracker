// classify-citation: HTTP wrapper around the shared citation classifier.
// Used by backfill jobs; the scan function imports the shared module directly.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  classifyCitations,
  extractCitationsFromText,
  extractStructuredCitations,
  type ExtractedCitation,
} from '../_shared/citations.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    let citations: ExtractedCitation[] = [];

    if (Array.isArray(body?.citations)) {
      // Pre-extracted: [{url,title?,snippet?}] or [string]
      citations = extractStructuredCitations(body.citations);
    } else if (typeof body?.text === 'string') {
      citations = extractCitationsFromText(body.text);
    } else if (typeof body?.url === 'string') {
      citations = extractStructuredCitations([{ url: body.url, title: body.title, snippet: body.snippet }]);
    } else {
      return new Response(JSON.stringify({ error: 'Provide one of: url, text, or citations[]' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const classified = await classifyCitations(citations, {
      lovableApiKey: Deno.env.get('LOVABLE_API_KEY') ?? undefined,
      enableLlm: body?.enableLlm !== false,
    });

    return new Response(JSON.stringify({ results: classified }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('classify-citation error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
