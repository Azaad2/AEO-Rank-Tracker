// Pure metric formulas + deterministic explainability engine.
// No Supabase imports here — easily unit-testable.

export type Engine = 'gemini' | 'chatgpt' | 'perplexity' | 'claude';
export type EngineWeights = Partial<Record<Engine, number>>;

export const DEFAULT_ENGINE_WEIGHTS: Record<Engine, number> = {
  chatgpt: 0.4,
  gemini: 0.3,
  perplexity: 0.2,
  claude: 0.1,
};

export interface ScanResultRow {
  id: number;
  prompt: string;
  gemini_mentioned?: boolean | null;
  gemini_cited?: boolean | null;
  chatgpt_mentioned?: boolean | null;
  chatgpt_cited?: boolean | null;
  perplexity_mentioned?: boolean | null;
  perplexity_cited?: boolean | null;
  claude_mentioned?: boolean | null;
  claude_cited?: boolean | null;
  citation_rank?: number | null;
}

export interface CitationRow {
  scan_result_id: number;
  engine: string;
  url: string;
  domain: string;
  source_type?: string | null;
  asset_type?: string | null;
  cites_brand?: string | null;
  position?: number | null;
}

export interface CitationSourceRow {
  domain: string;
  source_type?: string | null;
  authority_score?: number | null;
}

export interface BrandObservationRow {
  scan_result_id: number;
  normalized_name: string;
  is_customer_brand: boolean;
  engine: string;
  cited?: boolean | null;
  position?: number | null;
}

/* ---------------- helpers ---------------- */

function round(n: number, p = 4): number {
  if (!isFinite(n)) return 0;
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

function normalizeWeights(w: EngineWeights): Record<Engine, number> {
  const merged: Record<Engine, number> = { ...DEFAULT_ENGINE_WEIGHTS, ...w };
  const sum = (Object.values(merged) as number[]).reduce((a, b) => a + b, 0);
  if (sum <= 0) return { ...DEFAULT_ENGINE_WEIGHTS };
  const out: Record<Engine, number> = { gemini: 0, chatgpt: 0, perplexity: 0, claude: 0 };
  (Object.keys(merged) as Engine[]).forEach((k) => (out[k] = merged[k] / sum));
  return out;
}

/* ---------------- RSS ---------------- */

export interface RssBreakdown {
  mention_rate: number;
  citation_rate: number;
  position_inv: number;
  tsd: number;
  weighted_components: { mention_rate: number; citation_rate: number; position_inv: number; tsd: number };
  weights: { mention_rate: number; citation_rate: number; position_inv: number; tsd: number };
  per_engine: Record<string, { mention_rate: number; citation_rate: number; samples: number }>;
}

const RSS_WEIGHTS = { mention_rate: 0.35, citation_rate: 0.25, position_inv: 0.25, tsd: 0.15 };

export function computeRss(
  rows: ScanResultRow[],
  tsdValue: number,
  engineWeights: EngineWeights = DEFAULT_ENGINE_WEIGHTS
): { value: number; breakdown: RssBreakdown } {
  const w = normalizeWeights(engineWeights);
  const perEngine: Record<Engine, { ment: number; cit: number; n: number; posSum: number; posN: number }> = {
    gemini: { ment: 0, cit: 0, n: 0, posSum: 0, posN: 0 },
    chatgpt: { ment: 0, cit: 0, n: 0, posSum: 0, posN: 0 },
    perplexity: { ment: 0, cit: 0, n: 0, posSum: 0, posN: 0 },
    claude: { ment: 0, cit: 0, n: 0, posSum: 0, posN: 0 },
  };

  for (const r of rows) {
    (['gemini', 'chatgpt', 'perplexity', 'claude'] as Engine[]).forEach((eng) => {
      const m = (r as any)[`${eng}_mentioned`];
      const c = (r as any)[`${eng}_cited`];
      if (m === null || m === undefined) return;
      perEngine[eng].n += 1;
      if (m) perEngine[eng].ment += 1;
      if (c) perEngine[eng].cit += 1;
    });
    if (typeof r.citation_rank === 'number' && r.citation_rank > 0) {
      // attribute position to all engines equally where possible (citation_rank is aggregate)
      perEngine.gemini.posSum += 1 / r.citation_rank;
      perEngine.gemini.posN += 1;
    }
  }

  let mentionRate = 0;
  let citationRate = 0;
  let positionInv = 0;
  const perEngineOut: Record<string, { mention_rate: number; citation_rate: number; samples: number }> = {};

  (['gemini', 'chatgpt', 'perplexity', 'claude'] as Engine[]).forEach((eng) => {
    const m = safeDiv(perEngine[eng].ment, perEngine[eng].n);
    const c = safeDiv(perEngine[eng].cit, perEngine[eng].n);
    const p = safeDiv(perEngine[eng].posSum, perEngine[eng].posN);
    mentionRate += m * w[eng];
    citationRate += c * w[eng];
    positionInv += p * w[eng];
    perEngineOut[eng] = { mention_rate: round(m), citation_rate: round(c), samples: perEngine[eng].n };
  });

  const tsdNorm = Math.min(1, tsdValue); // already 0..1
  const weightedComponents = {
    mention_rate: round(mentionRate * RSS_WEIGHTS.mention_rate * 100),
    citation_rate: round(citationRate * RSS_WEIGHTS.citation_rate * 100),
    position_inv: round(positionInv * RSS_WEIGHTS.position_inv * 100),
    tsd: round(tsdNorm * RSS_WEIGHTS.tsd * 100),
  };
  const value = round(
    weightedComponents.mention_rate +
      weightedComponents.citation_rate +
      weightedComponents.position_inv +
      weightedComponents.tsd,
    2
  );

  return {
    value,
    breakdown: {
      mention_rate: round(mentionRate),
      citation_rate: round(citationRate),
      position_inv: round(positionInv),
      tsd: round(tsdNorm),
      weighted_components: weightedComponents,
      weights: RSS_WEIGHTS,
      per_engine: perEngineOut,
    },
  };
}

/* ---------------- TSD ---------------- */

export interface TsdBreakdown {
  unique_domains: number;
  total_prompts: number;
  by_source_type: Record<string, number>;
  by_asset_type: Record<string, number>;
  domains_supporting_brand: string[];
}

export function computeTsd(
  citations: CitationRow[],
  ownBrandNorm: string,
  totalPromptsWithBrand: number
): { value: number; breakdown: TsdBreakdown } {
  const supporting = citations.filter((c) => (c.cites_brand || '').toLowerCase() === ownBrandNorm);
  const domains = new Set<string>();
  const bySource: Record<string, number> = {};
  const byAsset: Record<string, number> = {};
  for (const c of supporting) {
    if (c.domain) domains.add(c.domain);
    const s = c.source_type || 'unknown';
    bySource[s] = (bySource[s] || 0) + 1;
    const a = c.asset_type || 'unknown';
    byAsset[a] = (byAsset[a] || 0) + 1;
  }
  const value = round(safeDiv(domains.size, Math.max(1, totalPromptsWithBrand)));
  return {
    value,
    breakdown: {
      unique_domains: domains.size,
      total_prompts: totalPromptsWithBrand,
      by_source_type: bySource,
      by_asset_type: byAsset,
      domains_supporting_brand: Array.from(domains).slice(0, 50),
    },
  };
}

/* ---------------- CAG ---------------- */

export interface CagBreakdown {
  brand_mean_authority: number;
  competitor_mean_authority: number;
  by_competitor: { name: string; mean: number; delta: number; samples: number }[];
  top_gaps: { domain: string; your_auth: number; comp_auth: number }[];
}

export function computeCag(
  citations: CitationRow[],
  sources: CitationSourceRow[],
  ownBrandNorm: string
): { value: number; breakdown: CagBreakdown } {
  const authByDomain = new Map<string, number>();
  for (const s of sources) {
    if (s.domain) authByDomain.set(s.domain, s.authority_score ?? 50);
  }
  const auth = (d: string) => authByDomain.get(d) ?? 50;

  const yours: number[] = [];
  const compByBrand = new Map<string, number[]>();
  const yourDomainAuth = new Map<string, number>();
  const compDomainAuth = new Map<string, number>();

  for (const c of citations) {
    if (!c.cites_brand) continue;
    const a = auth(c.domain);
    if (c.cites_brand.toLowerCase() === ownBrandNorm) {
      yours.push(a);
      yourDomainAuth.set(c.domain, Math.max(a, yourDomainAuth.get(c.domain) ?? 0));
    } else {
      const arr = compByBrand.get(c.cites_brand) ?? [];
      arr.push(a);
      compByBrand.set(c.cites_brand, arr);
      compDomainAuth.set(c.domain, Math.max(a, compDomainAuth.get(c.domain) ?? 0));
    }
  }

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const brandMean = mean(yours);
  const allComp = Array.from(compByBrand.values()).flat();
  const compMean = mean(allComp);

  const byCompetitor = Array.from(compByBrand.entries())
    .map(([name, xs]) => {
      const m = mean(xs);
      return { name, mean: round(m, 2), delta: round(m - brandMean, 2), samples: xs.length };
    })
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10);

  const topGaps = Array.from(compDomainAuth.entries())
    .map(([d, a]) => ({ domain: d, your_auth: round(yourDomainAuth.get(d) ?? 0, 1), comp_auth: round(a, 1) }))
    .filter((x) => x.comp_auth - x.your_auth > 10)
    .sort((a, b) => b.comp_auth - b.your_auth - (a.comp_auth - a.your_auth))
    .slice(0, 10);

  return {
    value: round(compMean - brandMean, 2),
    breakdown: {
      brand_mean_authority: round(brandMean, 2),
      competitor_mean_authority: round(compMean, 2),
      by_competitor: byCompetitor,
      top_gaps: topGaps,
    },
  };
}

/* ---------------- CIS ---------------- */

export interface CisRow {
  domain: string;
  cis: number;
  source_type: string | null;
  sample_size: number;
  wins: number;
  appearances: number;
}

export function computeCis(
  citations: CitationRow[],
  winningBrandPerResult: Map<number, string>
): CisRow[] {
  const byDomain = new Map<string, { wins: number; apps: number; src: string | null }>();
  const seen = new Set<string>(); // (domain|scan_result) dedup
  for (const c of citations) {
    const key = `${c.domain}|${c.scan_result_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rec = byDomain.get(c.domain) ?? { wins: 0, apps: 0, src: c.source_type ?? null };
    rec.apps += 1;
    const winner = winningBrandPerResult.get(c.scan_result_id);
    // win = this scan_result has a winning brand AND the citation cites that brand
    if (winner && (c.cites_brand || '').toLowerCase() === winner) rec.wins += 1;
    byDomain.set(c.domain, rec);
  }
  return Array.from(byDomain.entries())
    .filter(([_, r]) => r.apps >= 2)
    .map(([domain, r]) => ({
      domain,
      cis: round(safeDiv(r.wins, r.apps), 3),
      source_type: r.src,
      sample_size: r.apps,
      wins: r.wins,
      appearances: r.apps,
    }))
    .sort((a, b) => b.cis - a.cis || b.sample_size - a.sample_size)
    .slice(0, 20);
}

/* ---------------- Per-competitor RSS + COI ---------------- */

export interface CoiBreakdown {
  overall: number;
  by_competitor: {
    name: string;
    competitor_rss: number;
    your_rss: number;
    coi: number;
    component_deltas: { mention_rate: number; citation_rate: number; position_inv: number; tsd: number };
  }[];
}

export function computeCompetitorRss(
  observations: BrandObservationRow[],
  scanResultIds: number[],
  citations: CitationRow[],
  engineWeights: EngineWeights = DEFAULT_ENGINE_WEIGHTS
): Map<string, { value: number; breakdown: RssBreakdown }> {
  const w = normalizeWeights(engineWeights);
  // group observations by brand
  const byBrand = new Map<string, BrandObservationRow[]>();
  for (const o of observations) {
    if (o.is_customer_brand) continue;
    const arr = byBrand.get(o.normalized_name) ?? [];
    arr.push(o);
    byBrand.set(o.normalized_name, arr);
  }

  // attempted samples per engine = unique scan_result_ids where engine appeared in scan_results (use all scanResultIds as denominator approximation)
  const totalSamples = scanResultIds.length;

  const out = new Map<string, { value: number; breakdown: RssBreakdown }>();
  for (const [brand, obs] of byBrand.entries()) {
    const perEngine: Record<Engine, { ment: Set<number>; cit: Set<number>; posSum: number; posN: number }> = {
      gemini: { ment: new Set(), cit: new Set(), posSum: 0, posN: 0 },
      chatgpt: { ment: new Set(), cit: new Set(), posSum: 0, posN: 0 },
      perplexity: { ment: new Set(), cit: new Set(), posSum: 0, posN: 0 },
      claude: { ment: new Set(), cit: new Set(), posSum: 0, posN: 0 },
    };
    for (const o of obs) {
      const eng = o.engine as Engine;
      if (!perEngine[eng]) continue;
      perEngine[eng].ment.add(o.scan_result_id);
      if (o.cited) perEngine[eng].cit.add(o.scan_result_id);
      if (typeof o.position === 'number' && o.position > 0) {
        perEngine[eng].posSum += 1 / o.position;
        perEngine[eng].posN += 1;
      }
    }

    let mentionRate = 0,
      citationRate = 0,
      positionInv = 0;
    const perEngineOut: Record<string, { mention_rate: number; citation_rate: number; samples: number }> = {};
    (['gemini', 'chatgpt', 'perplexity', 'claude'] as Engine[]).forEach((eng) => {
      const m = safeDiv(perEngine[eng].ment.size, totalSamples);
      const c = safeDiv(perEngine[eng].cit.size, totalSamples);
      const p = safeDiv(perEngine[eng].posSum, perEngine[eng].posN);
      mentionRate += m * w[eng];
      citationRate += c * w[eng];
      positionInv += p * w[eng];
      perEngineOut[eng] = { mention_rate: round(m), citation_rate: round(c), samples: totalSamples };
    });

    // competitor TSD
    const supportingDomains = new Set<string>();
    let promptsWithBrand = 0;
    const seenResults = new Set<number>();
    for (const c of citations) {
      if ((c.cites_brand || '').toLowerCase() === brand) {
        if (c.domain) supportingDomains.add(c.domain);
        if (!seenResults.has(c.scan_result_id)) {
          seenResults.add(c.scan_result_id);
          promptsWithBrand += 1;
        }
      }
    }
    const tsd = round(safeDiv(supportingDomains.size, Math.max(1, promptsWithBrand)));

    const weightedComponents = {
      mention_rate: round(mentionRate * RSS_WEIGHTS.mention_rate * 100),
      citation_rate: round(citationRate * RSS_WEIGHTS.citation_rate * 100),
      position_inv: round(positionInv * RSS_WEIGHTS.position_inv * 100),
      tsd: round(Math.min(1, tsd) * RSS_WEIGHTS.tsd * 100),
    };
    const value = round(
      weightedComponents.mention_rate +
        weightedComponents.citation_rate +
        weightedComponents.position_inv +
        weightedComponents.tsd,
      2
    );

    out.set(brand, {
      value,
      breakdown: {
        mention_rate: round(mentionRate),
        citation_rate: round(citationRate),
        position_inv: round(positionInv),
        tsd: round(tsd),
        weighted_components: weightedComponents,
        weights: RSS_WEIGHTS,
        per_engine: perEngineOut,
      },
    });
  }
  return out;
}

export function computeCoi(
  ownRss: { value: number; breakdown: RssBreakdown },
  competitorRss: Map<string, { value: number; breakdown: RssBreakdown }>
): CoiBreakdown {
  const by = Array.from(competitorRss.entries()).map(([name, c]) => ({
    name,
    competitor_rss: c.value,
    your_rss: ownRss.value,
    coi: round(c.value - ownRss.value, 2),
    component_deltas: {
      mention_rate: round(c.breakdown.weighted_components.mention_rate - ownRss.breakdown.weighted_components.mention_rate, 2),
      citation_rate: round(c.breakdown.weighted_components.citation_rate - ownRss.breakdown.weighted_components.citation_rate, 2),
      position_inv: round(c.breakdown.weighted_components.position_inv - ownRss.breakdown.weighted_components.position_inv, 2),
      tsd: round(c.breakdown.weighted_components.tsd - ownRss.breakdown.weighted_components.tsd, 2),
    },
  }));
  by.sort((a, b) => b.coi - a.coi);
  const overall = by.length ? round(by.reduce((a, b) => a + b.coi, 0) / by.length, 2) : 0;
  return { overall, by_competitor: by.slice(0, 10) };
}

/* ---------------- Explainability ---------------- */

export interface ExplanationFactor {
  factor: string;
  contribution_pct: number;
  evidence: Record<string, unknown>;
}

export interface ExplanationEntry {
  metric: 'rss' | 'cag' | 'tsd';
  direction: 'up' | 'down' | 'flat';
  magnitude: number;
  prev: number | null;
  curr: number;
  top_drivers: ExplanationFactor[];
}

export interface CurrentMetricsBundle {
  rss: { value: number; breakdown: RssBreakdown };
  cag: { value: number; breakdown: CagBreakdown };
  tsd: { value: number; breakdown: TsdBreakdown };
}

export interface PrevMetricsBundle {
  rss?: { value: number; breakdown: RssBreakdown } | null;
  cag?: { value: number; breakdown: CagBreakdown } | null;
  tsd?: { value: number; breakdown: TsdBreakdown } | null;
}

function dirOf(delta: number): 'up' | 'down' | 'flat' {
  if (Math.abs(delta) < 0.01) return 'flat';
  return delta > 0 ? 'up' : 'down';
}

function diffMap(curr: Record<string, number>, prev: Record<string, number>): { key: string; delta: number; pct_change: number; prev: number; curr: number }[] {
  const keys = new Set([...Object.keys(curr || {}), ...Object.keys(prev || {})]);
  return Array.from(keys).map((k) => {
    const c = curr?.[k] ?? 0;
    const p = prev?.[k] ?? 0;
    return { key: k, delta: round(c - p, 3), pct_change: p > 0 ? round((c - p) / p, 3) : 0, prev: p, curr: c };
  });
}

export function buildExplanation(
  curr: CurrentMetricsBundle,
  prev: PrevMetricsBundle
): { deltas: any; explanation: ExplanationEntry[]; narrative: string } {
  const sourceCurr = curr.tsd.breakdown.by_source_type;
  const sourcePrev = prev.tsd?.breakdown.by_source_type ?? {};
  const assetCurr = curr.tsd.breakdown.by_asset_type;
  const assetPrev = prev.tsd?.breakdown.by_asset_type ?? {};

  const bySource = diffMap(sourceCurr, sourcePrev).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const byAsset = diffMap(assetCurr, assetPrev).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const currDomains = new Set(curr.tsd.breakdown.domains_supporting_brand || []);
  const prevDomains = new Set(prev.tsd?.breakdown.domains_supporting_brand || []);
  const newDomains = Array.from(currDomains).filter((d) => !prevDomains.has(d));
  const lostDomains = Array.from(prevDomains).filter((d) => !currDomains.has(d));

  const deltas = {
    rss: { prev: prev.rss?.value ?? null, curr: curr.rss.value, delta: round(curr.rss.value - (prev.rss?.value ?? 0), 2) },
    cag: { prev: prev.cag?.value ?? null, curr: curr.cag.value, delta: round(curr.cag.value - (prev.cag?.value ?? 0), 2) },
    tsd: { prev: prev.tsd?.value ?? null, curr: curr.tsd.value, delta: round(curr.tsd.value - (prev.tsd?.value ?? 0), 3) },
    by_source_type: bySource,
    by_asset_type: byAsset,
    new_winning_domains: newDomains.slice(0, 10),
    lost_winning_domains: lostDomains.slice(0, 10),
  };

  const explanation: ExplanationEntry[] = [];

  // RSS explanation
  const rssCompCurr = curr.rss.breakdown.weighted_components;
  const rssCompPrev = prev.rss?.breakdown.weighted_components ?? { mention_rate: 0, citation_rate: 0, position_inv: 0, tsd: 0 };
  const rssDelta = curr.rss.value - (prev.rss?.value ?? 0);
  const rssFactorDeltas = (['mention_rate', 'citation_rate', 'position_inv', 'tsd'] as const).map((k) => ({
    factor: k,
    delta: round((rssCompCurr as any)[k] - (rssCompPrev as any)[k], 2),
  }));
  const rssMagnitude = rssFactorDeltas.reduce((a, b) => a + Math.abs(b.delta), 0);
  const rssDrivers: ExplanationFactor[] = rssFactorDeltas
    .filter((f) => Math.abs(f.delta) >= 0.01 || !prev.rss)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)
    .map((f) => {
      const ev: Record<string, unknown> = {
        prev_points: round((rssCompPrev as any)[f.factor], 2),
        curr_points: round((rssCompCurr as any)[f.factor], 2),
      };
      if (f.factor === 'tsd') {
        ev.prev_tsd = prev.tsd?.value ?? null;
        ev.curr_tsd = curr.tsd.value;
        ev.unique_domains_delta = curr.tsd.breakdown.unique_domains - (prev.tsd?.breakdown.unique_domains ?? 0);
        ev.top_source_changes = bySource.slice(0, 3);
        ev.top_asset_changes = byAsset.slice(0, 3);
      }
      return {
        factor: f.factor,
        contribution_pct: rssMagnitude > 0 ? round(Math.abs(f.delta) / rssMagnitude, 3) : 0,
        evidence: ev,
      };
    });
  explanation.push({
    metric: 'rss',
    direction: dirOf(rssDelta),
    magnitude: round(rssDelta, 2),
    prev: prev.rss?.value ?? null,
    curr: curr.rss.value,
    top_drivers: rssDrivers,
  });

  // CAG explanation
  const cagDelta = curr.cag.value - (prev.cag?.value ?? 0);
  const cagDrivers: ExplanationFactor[] = [
    {
      factor: 'brand_mean_authority',
      contribution_pct: 0.5,
      evidence: {
        prev: prev.cag?.breakdown.brand_mean_authority ?? null,
        curr: curr.cag.breakdown.brand_mean_authority,
      },
    },
    {
      factor: 'competitor_mean_authority',
      contribution_pct: 0.5,
      evidence: {
        prev: prev.cag?.breakdown.competitor_mean_authority ?? null,
        curr: curr.cag.breakdown.competitor_mean_authority,
        top_competitors: curr.cag.breakdown.by_competitor.slice(0, 3),
      },
    },
  ];
  explanation.push({
    metric: 'cag',
    direction: dirOf(cagDelta),
    magnitude: round(cagDelta, 2),
    prev: prev.cag?.value ?? null,
    curr: curr.cag.value,
    top_drivers: cagDrivers,
  });

  // TSD explanation
  const tsdDelta = curr.tsd.value - (prev.tsd?.value ?? 0);
  const tsdDrivers: ExplanationFactor[] = [
    {
      factor: 'unique_domains',
      contribution_pct: 0.6,
      evidence: {
        prev: prev.tsd?.breakdown.unique_domains ?? 0,
        curr: curr.tsd.breakdown.unique_domains,
        new_domains: newDomains.slice(0, 5),
        lost_domains: lostDomains.slice(0, 5),
      },
    },
    {
      factor: 'source_type_mix',
      contribution_pct: 0.2,
      evidence: { top_changes: bySource.slice(0, 3) },
    },
    {
      factor: 'asset_type_mix',
      contribution_pct: 0.2,
      evidence: { top_changes: byAsset.slice(0, 3) },
    },
  ];
  explanation.push({
    metric: 'tsd',
    direction: dirOf(tsdDelta),
    magnitude: round(tsdDelta, 3),
    prev: prev.tsd?.value ?? null,
    curr: curr.tsd.value,
    top_drivers: tsdDrivers,
  });

  const narrative = renderNarrative(explanation, curr, prev, bySource, byAsset);

  return { deltas, explanation, narrative };
}

function renderNarrative(
  explanation: ExplanationEntry[],
  curr: CurrentMetricsBundle,
  prev: PrevMetricsBundle,
  bySource: { key: string; delta: number; pct_change: number }[],
  byAsset: { key: string; delta: number; pct_change: number }[]
): string {
  const rss = explanation.find((e) => e.metric === 'rss')!;
  if (!prev.rss) {
    const top = rss.top_drivers[0];
    return `Baseline RSS ${curr.rss.value}. Strongest component: ${top?.factor ?? 'n/a'} (${top?.evidence.curr_points ?? 0} pts). TSD ${curr.tsd.value} across ${curr.tsd.breakdown.unique_domains} unique domains.`.slice(0, 240);
  }
  const dir = rss.direction === 'up' ? 'up' : rss.direction === 'down' ? 'down' : 'flat';
  const parts: string[] = [];
  parts.push(`RSS ${dir} ${Math.abs(rss.magnitude)} pts`);
  const drivers: string[] = [];
  const topSource = bySource.find((s) => s.delta !== 0);
  if (topSource) {
    const pct = topSource.pct_change ? `${topSource.pct_change > 0 ? '+' : ''}${Math.round(topSource.pct_change * 100)}%` : `${topSource.delta > 0 ? '+' : ''}${topSource.delta}`;
    drivers.push(`${topSource.key} citations ${pct}`);
  }
  const topAsset = byAsset.find((a) => a.delta !== 0);
  if (topAsset) drivers.push(`${topAsset.key.replace('_', ' ')} ${topAsset.delta > 0 ? '+' : ''}${topAsset.delta}`);
  if (prev.tsd && curr.tsd.value !== prev.tsd.value) drivers.push(`TSD ${prev.tsd.value}→${curr.tsd.value}`);
  if (drivers.length) parts.push(drivers.join(', '));
  return (parts.join(': ') + '.').slice(0, 240);
}

/* ---------------- Confidence ---------------- */

export function computeConfidence(sample: {
  prompts: number;
  citations: number;
  engines_with_data: number;
}): { score: number; bucket: 'low' | 'medium' | 'high' } {
  // simple monotonic confidence: more prompts/engines/citations => higher
  const p = Math.min(1, sample.prompts / 20);
  const c = Math.min(1, sample.citations / 30);
  const e = Math.min(1, sample.engines_with_data / 4);
  const score = round(0.4 * p + 0.3 * c + 0.3 * e, 3);
  const bucket = score >= 0.7 ? 'high' : score >= 0.4 ? 'medium' : 'low';
  return { score, bucket };
}
