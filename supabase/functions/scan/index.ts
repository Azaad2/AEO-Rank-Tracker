import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  domain: string;
  promptsText: string;
  market?: string;
}

interface SearchResult {
  rank: number;
  url: string;
  name: string;
  snippet: string;
}

interface RowResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
  debug: { usedResults: string[] };
}

// Helper: normalize domain
function normalizeDomain(domain: string): string {
  return domain.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

// Helper: derive brand name from domain
function domainToName(domain: string): string {
  const parts = domain.split('.');
  const name = parts[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Helper: extract hostname without www
function safeHost(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Helper: sleep for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch search results from Serper API
async function fetchSearchResults(prompt: string, market: string): Promise<SearchResult[]> {
  const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY not configured');
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: prompt,
      gl: market.split('-')[1]?.toLowerCase() || 'us',
      hl: market.split('-')[0] || 'en',
      num: 8,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`);
  }

  const data = await response.json();
  const results: SearchResult[] = [];
  
  if (data.organic) {
    data.organic.forEach((item: any, index: number) => {
      results.push({
        rank: index + 1,
        url: item.link || '',
        name: item.title || '',
        snippet: item.snippet || '',
      });
    });
  }

  return results.slice(0, 8);
}

// Analyze with OpenAI
async function analyzeWithLLM(
  prompt: string,
  targetDomain: string,
  results: SearchResult[]
): Promise<any> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    return null;
  }

  const brandName = domainToName(targetDomain);
  const resultsText = results
    .map(r => `#${r.rank} ${r.url}\n${r.name}\n${r.snippet}`)
    .join('\n\n');

  const userPrompt = `Prompt: ${prompt}
Target Brand: ${brandName} (${targetDomain})
Search Results (rank, url, title, snippet):
${resultsText}

TASK:
1) Compose a short assistant-style answer that could be generated using ONLY the URLs above.
2) List 3-5 citation URLs you would use (must be from the list).
3) Determine if the target brand is MENTIONED in the answer and if any target-domain URL is CITED. Give the target-domain citation rank if present.
4) Extract other brand/site domains you detect in the answer (best-effort).
Return JSON with keys:
{
  "answer": string,
  "citations": [{"rank": number, "url": string}],
  "brandMentioned": boolean,
  "brandCited": boolean,
  "brandCitationRank": number | null,
  "brandsDetected": [{"domain": string}]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an impartial analyst that outputs strict JSON only.' },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (error) {
    console.error('LLM analysis error:', error);
    return null;
  }
}

// Heuristic fallback
function heuristicAnalysis(targetDomain: string, results: SearchResult[]): any {
  const matchingResult = results.find(r => safeHost(r.url) === targetDomain);
  const brandCited = !!matchingResult;
  const brandMentioned = brandCited;
  const brandCitationRank = matchingResult ? matchingResult.rank : null;

  return {
    brandMentioned,
    brandCited,
    brandCitationRank,
    citations: results.slice(0, 5).map((r, i) => ({ rank: i + 1, url: r.url })),
  };
}

// Score calculation
function scoreFromRow(row: RowResult): number {
  const mentioned = row.mentioned ? 1 : 0;
  const cited = row.cited ? 1 : 0;
  const rankBonus = row.citationRank && row.citationRank <= 3
    ? (4 - row.citationRank) / 3
    : 0;
  return Math.round(((mentioned + 0.7 * cited + 0.3 * rankBonus) / 2) * 100);
}

function aggregateScore(rows: RowResult[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, row) => acc + scoreFromRow(row), 0);
  return Math.round(sum / rows.length);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, promptsText, market = 'en-US' }: ScanRequest = await req.json();

    if (!domain || !promptsText) {
      return new Response(
        JSON.stringify({ error: 'Missing domain or prompts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDomain = normalizeDomain(domain);
    const prompts = promptsText
      .split(/[\n,]/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .filter((p, i, arr) => arr.indexOf(p) === i)
      .slice(0, 15);

    if (prompts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid prompts provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rows: RowResult[] = [];

    for (const prompt of prompts) {
      const searchResults = await fetchSearchResults(prompt, market);
      
      let analysis = await analyzeWithLLM(prompt, targetDomain, searchResults);
      if (!analysis) {
        analysis = heuristicAnalysis(targetDomain, searchResults);
      }

      const topCitedDomains = (analysis.citations || [])
        .slice(0, 5)
        .map((c: any) => safeHost(c.url))
        .filter((h: string) => h);

      rows.push({
        prompt,
        mentioned: analysis.brandMentioned || false,
        cited: analysis.brandCited || false,
        citationRank: analysis.brandCitationRank,
        topCitedDomains,
        debug: {
          usedResults: searchResults.slice(0, 5).map(r => r.url),
        },
      });

      await sleep(150);
    }

    const score = aggregateScore(rows);

    // Persist to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        project_domain: targetDomain,
        prompts,
        market,
        score,
      })
      .select()
      .single();

    if (scanError || !scan) {
      console.error('Scan insert error:', scanError);
      throw new Error('Failed to save scan');
    }

    const scanResultsData = rows.map(row => ({
      scan_id: scan.id,
      prompt: row.prompt,
      mentioned: row.mentioned,
      cited: row.cited,
      citation_rank: row.citationRank,
      top_cited_domains: row.topCitedDomains,
      used_results: row.debug.usedResults,
    }));

    const { error: resultsError } = await supabase
      .from('scan_results')
      .insert(scanResultsData);

    if (resultsError) {
      console.error('Results insert error:', resultsError);
      throw new Error('Failed to save results');
    }

    return new Response(
      JSON.stringify({
        project: targetDomain,
        promptsCount: prompts.length,
        score,
        results: rows,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scan error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
