// Pure helpers for the anonymized global_intelligence rollup writer.
// No Supabase imports — unit-testable.

export const ASSET_ENUM = [
  'comparison_page','listicle','directory_listing','reddit_thread',
  'forum_thread','review_page','blog_article','landing_page',
  'news_article','documentation_page','other',
] as const;
export type AssetTypeEnum = typeof ASSET_ENUM[number];

export interface ScanContext {
  industryId: string | null;
  topicClusterId: string | null;
  ownBrand: string;          // raw (normalized later)
  knownBrands: string[];     // for prompt-template scrubbing
}

export interface CitationInput {
  scan_result_id: number;
  engine: string;
  domain: string;
  source_type: string | null;
  asset_type: string | null;
  position: number | null;
  cites_brand: string | null;
  authority_score?: number | null;
  classification_confidence?: number | null;
}

export interface PromptRow {
  scan_result_id: number;
  prompt: string;
}

export interface GrainRow {
  industry_id: string | null;
  topic_cluster_id: string | null;
  engine: string;
  winning_brand: string | null;
  citation_domain: string;
  source_type: string | null;
  asset_type: string | null;
  prompt_template_hash: string;
  observation_count: number;           // distinct prompts
  citation_frequency: number;          // total citations
  recommendation_position: number | null;
  authority_score: number | null;
  classification_confidence: number | null;
}

// ---------- Brand normalization (mirrors public.normalize_brand) ----------

export function normalizeBrand(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.toLowerCase().trim();
  if (!s) return null;
  s = s.replace(/^https?:\/\//i, '');
  s = s.replace(/^www\./i, '');
  s = s.replace(/\.(com|io|co|net|org|ai|app|dev)(\/.*)?$/i, '');
  s = s.replace(/\s+(inc|ltd|llc|gmbh|corp|co)\.?$/i, '');
  s = s.trim();
  if (!s) return null;
  // Reject anything that still looks like an email or URL — privacy trigger
  // would reject anyway; do it here to drop bad rows before insert.
  if (s.includes('@') || /^https?:\/\//.test(s)) return null;
  return s;
}

// ---------- Prompt template hashing ----------

// Stable across scans & customers: lowercase, strip the customer's brand and
// all known brands → <BRAND>, scrub URLs/emails/numbers, collapse whitespace.
export async function hashPromptTemplate(
  prompt: string,
  ownBrand: string,
  knownBrands: string[] = [],
): Promise<string> {
  let p = (prompt ?? '').toLowerCase();
  // strip URLs and emails
  p = p.replace(/https?:\/\/\S+/g, ' ');
  p = p.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, ' ');

  const brands = [ownBrand, ...knownBrands]
    .map(b => normalizeBrand(b))
    .filter((b): b is string => !!b && b.length >= 2)
    // longest first so "acme corp" replaced before "acme"
    .sort((a, b) => b.length - a.length);
  for (const b of brands) {
    // escape regex specials
    const esc = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    p = p.replace(new RegExp(`\\b${esc}\\b`, 'g'), '<brand>');
  }
  p = p.replace(/\b\d+(\.\d+)?\b/g, '<n>');
  p = p.replace(/\s+/g, ' ').trim();

  const bytes = new TextEncoder().encode(p);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 16);
}

// ---------- Weighted position merge ----------

export function mergeWeightedPosition(
  prev: number | null,
  prevN: number,
  curr: number | null,
  currN: number,
): number | null {
  if (prev == null && curr == null) return null;
  if (prev == null) return curr;
  if (curr == null) return prev;
  const total = prevN + currN;
  if (total <= 0) return curr;
  return Math.round((prev * prevN + curr * currN) / total);
}

// ---------- Grain builder ----------

interface BuildArgs {
  ctx: ScanContext;
  prompts: PromptRow[];                                    // scan_result_id → prompt text
  promptHashes: Map<number, string>;                       // scan_result_id → hash
  citations: CitationInput[];
  ownBrandNormalized: string | null;
}

export function buildGrainRows(args: BuildArgs): GrainRow[] {
  const { ctx, prompts, promptHashes, citations, ownBrandNormalized } = args;
  const promptById = new Map(prompts.map(p => [p.scan_result_id, p]));

  // Bucket key → aggregate
  type Bucket = {
    grain: Omit<GrainRow, 'observation_count' | 'citation_frequency' | 'recommendation_position' | 'authority_score' | 'classification_confidence'>;
    prompts: Set<number>;
    citationCount: number;
    posSum: number; posN: number;
    authMax: number | null;
    confSum: number; confN: number;
  };
  const buckets = new Map<string, Bucket>();

  for (const c of citations) {
    if (!c.domain) continue;
    const promptHash = promptHashes.get(c.scan_result_id);
    if (!promptHash) continue;

    const winnerRaw = c.cites_brand;
    const winner = normalizeBrand(winnerRaw);
    // Drop rows where the "winner" is the customer themselves (privacy: never publish own brand)
    const winningBrand = winner && winner !== ownBrandNormalized ? winner : null;

    const asset = c.asset_type && (ASSET_ENUM as readonly string[]).includes(c.asset_type)
      ? c.asset_type : 'other';
    const src = c.source_type ?? null;

    const key = [
      ctx.industryId ?? '_',
      ctx.topicClusterId ?? '_',
      c.engine,
      winningBrand ?? '_',
      c.domain,
      src ?? '_',
      asset,
      promptHash,
    ].join('|');

    let b = buckets.get(key);
    if (!b) {
      b = {
        grain: {
          industry_id: ctx.industryId,
          topic_cluster_id: ctx.topicClusterId,
          engine: c.engine,
          winning_brand: winningBrand,
          citation_domain: c.domain,
          source_type: src,
          asset_type: asset,
          prompt_template_hash: promptHash,
        },
        prompts: new Set(),
        citationCount: 0,
        posSum: 0, posN: 0,
        authMax: null,
        confSum: 0, confN: 0,
      };
      buckets.set(key, b);
    }
    b.prompts.add(c.scan_result_id);
    b.citationCount += 1;
    if (typeof c.position === 'number' && c.position > 0) {
      b.posSum += c.position; b.posN += 1;
    }
    if (typeof c.authority_score === 'number') {
      b.authMax = b.authMax == null ? c.authority_score : Math.max(b.authMax, c.authority_score);
    }
    if (typeof c.classification_confidence === 'number') {
      b.confSum += c.classification_confidence; b.confN += 1;
    }
  }

  const out: GrainRow[] = [];
  for (const b of buckets.values()) {
    out.push({
      ...b.grain,
      observation_count: b.prompts.size,
      citation_frequency: b.citationCount,
      recommendation_position: b.posN ? Math.round(b.posSum / b.posN) : null,
      authority_score: b.authMax,
      classification_confidence: b.confN ? +(b.confSum / b.confN).toFixed(3) : null,
    });
  }
  return out;
}
