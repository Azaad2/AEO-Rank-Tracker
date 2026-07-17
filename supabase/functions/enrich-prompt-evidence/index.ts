// Enrich a prompt with real evidence: search Google + review sites,
// extract & classify citations, cache globally, and persist per scan_result.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  classifyCitations,
  extractDomain,
  cleanUrl,
  type ExtractedCitation,
} from '../_shared/citations.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function normalize(p: string): string {
  return p.toLowerCase().replace(/\s+/g, ' ').trim();
}
async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

interface SerperResult { title?: string; link?: string; snippet?: string }

async function serperSearch(q: string, num = 10): Promise<SerperResult[]> {
  if (!SERPER_API_KEY) return [];
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, num }),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.organic || []) as SerperResult[];
  } catch { return []; }
}

// Ask Gemini which brand each URL is "about" / favors
async function detectBrands(items: { url: string; title?: string; snippet?: string }[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!LOVABLE_API_KEY || items.length === 0) return out;
  const payload = items.slice(0, 20).map((it, i) => ({ i, url: it.url, title: it.title ?? '', snippet: it.snippet ?? '' }));
  const sys = `For each web result, identify the PRIMARY brand/product the page recommends or is about (lowercase, no TLD, no spaces if brandname). Return {"results":[{"i":number,"brand":string|null}]}. Only pick a brand if clearly present in title/snippet.`;
  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: JSON.stringify(payload) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    });
    if (!r.ok) return out;
    const data = await r.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || '{}');
    for (const row of (parsed.results || [])) {
      const src = payload.find(p => p.i === row.i);
      if (src && row.brand) out.set(src.url, String(row.brand).toLowerCase().trim());
    }
  } catch { /* ignore */ }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const { scan_result_id, prompt, brand, force } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const norm = normalize(prompt);
    const hash = await sha256(norm);

    // 1) Check cache
    const { data: cached } = await supabase
      .from('prompt_evidence_cache')
      .select('*')
      .eq('prompt_hash', hash)
      .maybeSingle();

    const isFresh = cached && (Date.now() - new Date(cached.updated_at).getTime()) < CACHE_TTL_MS;

    let citations: any[] = [];
    let sources: string[] = [];
    let winner: string | null = null;
    let competitors: Array<{ name: string; count: number }> = [];

    if (isFresh && !force) {
      citations = cached.citations || [];
      sources = cached.sources || [];
      winner = cached.winner;
      competitors = cached.competitors || [];
    } else {
      // 2) Multi-source search
      const queries = [
        prompt,
        `${prompt} site:reddit.com`,
        `${prompt} site:g2.com OR site:capterra.com OR site:trustradius.com`,
        `best ${prompt}`,
      ];
      const buckets = await Promise.all(queries.map(q => serperSearch(q, 8)));
      const merged: SerperResult[] = buckets.flat();

      // Dedup URLs
      const seen = new Set<string>();
      const extracted: ExtractedCitation[] = [];
      const rawMeta = new Map<string, SerperResult>();
      let pos = 0;
      for (const r of merged) {
        const u = r.link ? cleanUrl(r.link) : null;
        if (!u || seen.has(u)) continue;
        seen.add(u);
        const d = extractDomain(u);
        if (!d) continue;
        extracted.push({ url: u, domain: d, position: pos++, title: r.title, snippet: r.snippet });
        rawMeta.set(u, r);
      }

      const classified = await classifyCitations(extracted, {
        lovableApiKey: LOVABLE_API_KEY,
        enableLlm: true,
      });

      // 3) Detect brand per URL
      const brandMap = await detectBrands(extracted.map(e => ({ url: e.url, title: e.title, snippet: e.snippet })));

      // 4) Tally competitors
      const brandCounts = new Map<string, number>();
      for (const c of classified) {
        const b = brandMap.get(c.url);
        if (b) brandCounts.set(b, (brandCounts.get(b) || 0) + 1);
      }
      competitors = [...brandCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
      winner = competitors[0]?.name ?? null;

      citations = classified.map(c => ({
        url: c.url,
        domain: c.domain,
        title: c.title ?? null,
        snippet: c.snippet ?? null,
        asset_type: c.asset_type,
        source_type: c.source_type,
        position: c.position,
        cites_brand: brandMap.get(c.url) ?? null,
      }));
      sources = [...new Set(classified.map(c => c.domain))].slice(0, 20);

      // 5) Save cache
      await supabase.from('prompt_evidence_cache').upsert({
        prompt_hash: hash,
        prompt,
        winner,
        competitors,
        citations,
        sources,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'prompt_hash' });
    }

    // 6) Persist to per-scan citations table (dedup by url)
    if (scan_result_id && citations.length) {
      const { data: existing } = await supabase
        .from('citations')
        .select('url')
        .eq('scan_result_id', scan_result_id);
      const have = new Set((existing || []).map(r => r.url));
      const rows = citations.filter(c => !have.has(c.url)).map(c => ({
        scan_result_id,
        engine: 'search' as const,
        url: c.url,
        domain: c.domain,
        title: c.title,
        asset_type: c.asset_type,
        source_type: c.source_type,
        position: c.position,
        cites_brand: c.cites_brand,
      }));
      if (rows.length) await supabase.from('citations').insert(rows);
    }

    return new Response(JSON.stringify({
      ok: true,
      cached: !!isFresh,
      winner,
      competitors,
      citations,
      sources,
      brand,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('enrich-prompt-evidence error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
