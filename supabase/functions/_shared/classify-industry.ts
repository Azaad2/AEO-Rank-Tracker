// Lightweight industry/topic-cluster classifier using Lovable AI gateway.
// Returns slugs + UUIDs + confidence + reasoning. Always safe — falls back to
// heuristic on any LLM/parsing failure.

export interface IndustryRow { id: string; slug: string; name: string }
export interface TopicClusterRow { id: string; industry_id: string; slug: string; name: string }

export interface ClassificationResult {
  industry_id: string | null;
  industry_slug: string | null;
  topic_cluster_id: string | null;
  topic_cluster_slug: string | null;
  confidence: number;            // 0..1
  reasoning: string;
  method: 'llm' | 'heuristic' | 'none';
}

interface ClassifyArgs {
  domain: string;
  prompts: string[];
  industries: IndustryRow[];
  clusters: TopicClusterRow[];
  lovableApiKey?: string;
}

const MODEL = 'google/gemini-3-flash-preview';

export async function classifyIndustry(args: ClassifyArgs): Promise<ClassificationResult> {
  const { domain, prompts, industries, clusters, lovableApiKey } = args;

  // Heuristic fallback first (used if LLM fails)
  const heuristic = heuristicMatch(domain, prompts, industries, clusters);

  if (!lovableApiKey || industries.length === 0) {
    return heuristic;
  }

  const industryList = industries.map(i => `- ${i.slug}: ${i.name}`).join('\n');
  const clusterList = [
    'best-of: Best Of / Top Lists',
    'comparisons: Comparisons & Alternatives',
    'pricing: Pricing & Plans',
    'use-cases: Use Cases & How-To',
  ].join('\n');

  const sample = prompts.slice(0, 8).map((p, i) => `${i + 1}. ${p}`).join('\n');

  const sys = `You classify a brand's AI-search scan into ONE industry and ONE topic cluster from fixed taxonomies. Respond ONLY with strict JSON.`;
  const user = `Domain: ${domain}
Sample user prompts:
${sample}

Industries (pick one slug):
${industryList}

Topic clusters (pick one slug):
${clusterList}

Return JSON exactly:
{"industry_slug":"<slug>","topic_cluster_slug":"<slug>","confidence":0.0,"reasoning":"<one short sentence>"}`;

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': lovableApiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) {
      console.warn('classifyIndustry: gateway non-200', res.status);
      return heuristic;
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';
    const json = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const industrySlug = String(json.industry_slug || '').toLowerCase().trim();
    const clusterSlug = String(json.topic_cluster_slug || '').toLowerCase().trim();
    const confidence = clamp01(Number(json.confidence ?? 0));
    const reasoning = String(json.reasoning || '').slice(0, 500);

    const ind = industries.find(i => i.slug === industrySlug) ?? null;
    const tc = ind
      ? clusters.find(c => c.industry_id === ind.id && c.slug === clusterSlug) ?? null
      : null;

    if (!ind) return heuristic;

    return {
      industry_id: ind.id,
      industry_slug: ind.slug,
      topic_cluster_id: tc?.id ?? null,
      topic_cluster_slug: tc?.slug ?? null,
      confidence,
      reasoning: reasoning || `Matched ${ind.name} based on domain and prompt context.`,
      method: 'llm',
    };
  } catch (e) {
    console.warn('classifyIndustry: error', e);
    return heuristic;
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function heuristicMatch(
  domain: string,
  prompts: string[],
  industries: IndustryRow[],
  clusters: TopicClusterRow[],
): ClassificationResult {
  const hay = `${domain} ${prompts.join(' ')}`.toLowerCase();
  let best: { ind: IndustryRow; hits: number } | null = null;
  for (const ind of industries) {
    const tokens = ind.name.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const hits = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
    if (hits > 0 && (!best || hits > best.hits)) best = { ind, hits };
  }
  // Cluster heuristic
  let clusterSlug: string | null = null;
  if (/\bvs\.?\b|alternative|compared|comparison/i.test(hay)) clusterSlug = 'comparisons';
  else if (/best\b|top\b|recommend/i.test(hay)) clusterSlug = 'best-of';
  else if (/price|pricing|cost|cheap|free/i.test(hay)) clusterSlug = 'pricing';
  else if (/how to|use case|example/i.test(hay)) clusterSlug = 'use-cases';

  if (!best) {
    return {
      industry_id: null, industry_slug: null,
      topic_cluster_id: null, topic_cluster_slug: null,
      confidence: 0, reasoning: 'No industry match from domain or prompts.',
      method: 'none',
    };
  }
  const tc = clusterSlug
    ? clusters.find(c => c.industry_id === best!.ind.id && c.slug === clusterSlug) ?? null
    : null;
  return {
    industry_id: best.ind.id,
    industry_slug: best.ind.slug,
    topic_cluster_id: tc?.id ?? null,
    topic_cluster_slug: tc?.slug ?? null,
    confidence: Math.min(0.5, 0.2 + best.hits * 0.1),
    reasoning: `Heuristic match on "${best.ind.name}" keywords in domain/prompts.`,
    method: 'heuristic',
  };
}
