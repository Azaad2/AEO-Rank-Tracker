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

interface GeminiAnalysis {
  response: string;
  brandMentioned: boolean;
  brandCited: boolean;
  competitors: string[];
}

interface RowResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
  debug: { usedResults: string[] };
  // Gemini direct analysis
  geminiMentioned: boolean;
  geminiCited: boolean;
  geminiResponse: string;
  geminiCompetitors: string[];
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

// Analyze with OpenAI (existing - Google Search based)
async function analyzeWithLLM(
  prompt: string,
  targetDomain: string,
  results: SearchResult[]
): Promise<{ analysis: any; usedLLM: boolean; error?: string }> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    console.log('⚠️ OpenAI API key not configured - using heuristic fallback');
    return { analysis: null, usedLLM: false };
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
      const errorText = await response.text();
      if (response.status === 429) {
        console.error('❌ OpenAI rate limit exceeded (429) - using heuristic fallback');
        return { analysis: null, usedLLM: false, error: 'rate_limit' };
      } else if (response.status === 401) {
        console.error('❌ OpenAI authentication failed (401) - check API key');
        return { analysis: null, usedLLM: false, error: 'auth_failed' };
      } else {
        console.error(`❌ OpenAI API error: ${response.status} - ${errorText}`);
        return { analysis: null, usedLLM: false, error: `api_error_${response.status}` };
      }
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('❌ OpenAI returned no content');
      return { analysis: null, usedLLM: false, error: 'no_content' };
    }

    const parsedAnalysis = JSON.parse(content);
    console.log('✅ OpenAI LLM analysis successful for prompt:', prompt.substring(0, 50) + '...');
    return { analysis: parsedAnalysis, usedLLM: true };
  } catch (error) {
    console.error('❌ LLM analysis error:', error);
    return { analysis: null, usedLLM: false, error: 'exception' };
  }
}

// NEW: Direct Gemini AI Analysis
async function analyzeWithGemini(
  prompt: string,
  targetDomain: string
): Promise<GeminiAnalysis | null> {
  const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!GOOGLE_AI_API_KEY) {
    console.log('⚠️ Google AI API key not configured - skipping Gemini analysis');
    return null;
  }

  const brandName = domainToName(targetDomain);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!geminiResponse) {
      console.log('⚠️ Gemini returned empty response');
      return null;
    }

    console.log('✅ Gemini response received for prompt:', prompt.substring(0, 50) + '...');

    // Analyze Gemini's response for brand mentions and citations
    const responseText = geminiResponse.toLowerCase();
    const brandNameLower = brandName.toLowerCase();
    const domainLower = targetDomain.toLowerCase();

    // Check if brand is mentioned (name or domain)
    const brandMentioned = 
      responseText.includes(brandNameLower) || 
      responseText.includes(domainLower) ||
      responseText.includes(domainLower.replace('.', ' '));

    // Check if domain URL is cited
    const brandCited = 
      responseText.includes(targetDomain) ||
      responseText.includes(`https://${targetDomain}`) ||
      responseText.includes(`http://${targetDomain}`) ||
      responseText.includes(`www.${targetDomain}`);

    // Extract competitor brands mentioned in response
    const competitors = extractCompetitorBrands(geminiResponse, targetDomain);

    return {
      response: geminiResponse.substring(0, 1000), // Limit stored response
      brandMentioned,
      brandCited,
      competitors,
    };
  } catch (error) {
    console.error('❌ Gemini analysis error:', error);
    return null;
  }
}

// Helper: Extract competitor brands from Gemini response
function extractCompetitorBrands(response: string, targetDomain: string): string[] {
  const competitors: string[] = [];
  
  // Common patterns for brand mentions in AI responses
  const patterns = [
    /(?:like|such as|including|e\.g\.|for example|try|use|recommend)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)/g,
    /([A-Z][a-zA-Z0-9]+(?:\.com|\.io|\.ai|\.co|\.org))/g,
    /\*\*([A-Z][a-zA-Z0-9\s]+)\*\*/g, // Bold mentions
    /(?:^|\n)\d+\.\s+\*?\*?([A-Z][a-zA-Z0-9\s]+)\*?\*?/gm, // Numbered lists
  ];

  const targetBrand = domainToName(targetDomain).toLowerCase();
  
  for (const pattern of patterns) {
    const matches = response.matchAll(pattern);
    for (const match of matches) {
      const brand = match[1]?.trim();
      if (brand && 
          brand.length > 2 && 
          brand.length < 30 &&
          brand.toLowerCase() !== targetBrand &&
          !competitors.includes(brand)) {
        competitors.push(brand);
      }
    }
  }

  // Return unique competitors (max 5)
  return [...new Set(competitors)].slice(0, 5);
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

// Score calculation - now combines both sources
function scoreFromRow(row: RowResult): number {
  // Google Search + OpenAI analysis (40% weight)
  const searchMentioned = row.mentioned ? 1 : 0;
  const searchCited = row.cited ? 1 : 0;
  const rankBonus = row.citationRank && row.citationRank <= 3
    ? (4 - row.citationRank) / 3
    : 0;
  const searchScore = (searchMentioned + 0.7 * searchCited + 0.3 * rankBonus) / 2;

  // Direct Gemini analysis (60% weight - actual AI response matters more)
  const geminiMentioned = row.geminiMentioned ? 1 : 0;
  const geminiCited = row.geminiCited ? 0.5 : 0;
  const geminiScore = (geminiMentioned + geminiCited) / 1.5;

  // Combined score
  return Math.round(((searchScore * 0.4) + (geminiScore * 0.6)) * 100);
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
    let llmUsedCount = 0;
    let geminiUsedCount = 0;
    let llmErrors: string[] = [];

    for (const prompt of prompts) {
      // 1. Fetch Google Search results
      const searchResults = await fetchSearchResults(prompt, market);
      
      // 2. Analyze with OpenAI (existing)
      const llmResult = await analyzeWithLLM(prompt, targetDomain, searchResults);
      let analysis = llmResult.analysis;
      
      if (llmResult.usedLLM) {
        llmUsedCount++;
      }
      
      if (llmResult.error && !llmErrors.includes(llmResult.error)) {
        llmErrors.push(llmResult.error);
      }
      
      if (!analysis) {
        console.log('ℹ️ Using heuristic analysis for prompt:', prompt.substring(0, 50) + '...');
        analysis = heuristicAnalysis(targetDomain, searchResults);
      }

      // 3. Direct Gemini Analysis (NEW)
      const geminiAnalysis = await analyzeWithGemini(prompt, targetDomain);
      if (geminiAnalysis) {
        geminiUsedCount++;
      }

      const topCitedDomains = (analysis.citations || [])
        .slice(0, 5)
        .map((c: any) => safeHost(c.url))
        .filter((h: string) => h);

      rows.push({
        prompt,
        // OpenAI/Search analysis
        mentioned: analysis.brandMentioned || false,
        cited: analysis.brandCited || false,
        citationRank: analysis.brandCitationRank,
        topCitedDomains,
        debug: {
          usedResults: searchResults.slice(0, 5).map(r => r.url),
        },
        // Gemini direct analysis
        geminiMentioned: geminiAnalysis?.brandMentioned || false,
        geminiCited: geminiAnalysis?.brandCited || false,
        geminiResponse: geminiAnalysis?.response || '',
        geminiCompetitors: geminiAnalysis?.competitors || [],
      });

      await sleep(200); // Slightly longer delay for both APIs
    }

    console.log(`📊 Analysis complete: ${llmUsedCount}/${prompts.length} OpenAI, ${geminiUsedCount}/${prompts.length} Gemini`);
    if (llmErrors.length > 0) {
      console.log('⚠️ LLM errors encountered:', llmErrors.join(', '));
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
      // Gemini columns
      gemini_mentioned: row.geminiMentioned,
      gemini_cited: row.geminiCited,
      gemini_response: row.geminiResponse,
      gemini_competitors: row.geminiCompetitors,
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
        scanId: scan.id,
        project: targetDomain,
        promptsCount: prompts.length,
        score,
        results: rows,
        meta: {
          llmAnalysisUsed: llmUsedCount,
          geminiAnalysisUsed: geminiUsedCount,
          totalPrompts: prompts.length,
          llmErrors: llmErrors.length > 0 ? llmErrors : undefined,
        },
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
