// Evidence-first recommendation rule library.
// Pure functions, no I/O. The edge function loads context and runs every rule.

export const ENGINE_VERSION = "rec-engine-v1.0.0";

export type AssetType =
  | "comparison_page"
  | "listicle"
  | "directory_listing"
  | "reddit_thread"
  | "forum_thread"
  | "review_page"
  | "blog_article"
  | "landing_page"
  | "news_article"
  | "documentation_page"
  | "other";

export type TargetMetric = "RSS" | "CAG" | "TSD" | "CIS" | "COI";
export type Difficulty = "easy" | "medium" | "hard";

export interface PeerAssetStats {
  asset_type: AssetType;
  peer_sample_size: number;       // distinct winning_brand count
  peer_avg: number;               // mean citation_frequency per peer brand
  peer_median: number;
  peer_max: number;
  top_brands: Array<{ brand: string; value: number; asset_type: AssetType }>;
  avg_authority: number | null;
  avg_position: number | null;
}

export interface CitationRow {
  domain: string;
  url: string;
  asset_type: AssetType | null;
  source_type: string | null;
  cites_brand: string | null;
  title?: string | null;
  classification_confidence?: number | null;
}

export interface MetricsSnapshot {
  rss: number | null;
  cag: number | null;
  tsd: number | null;
}

export interface RecommendationContext {
  scan_id: string;
  user_id: string;
  domain: string;
  industry_id: string | null;
  topic_cluster_id: string | null;
  userCitations: CitationRow[];        // citations whose cites_brand === user brand
  allCitations: CitationRow[];         // all citations from this scan
  metrics: MetricsSnapshot;
  prevMetrics: MetricsSnapshot;
  peerStats: PeerAssetStats[];
  // Map of recommendation_type -> { recurrence_count, last_seen_scan_id }
  history: Record<string, { recurrence_count: number; last_seen_scan_id: string | null }>;
}

export interface RecommendationCandidate {
  recommendation_type: string;
  title: string;
  description: string;
  why_this_matters: string;
  category: string;
  target_metric: TargetMetric;
  projected_metric_delta: number;
  expected_impact: number;     // 0-100
  confidence: number;          // 0-100
  difficulty: Difficulty;
  difficulty_weight: 1 | 3 | 5;
  time_estimate_minutes: number;
  evidence: Record<string, unknown>;
  evidence_urls: string[];
  industry_benchmark: {
    metric: string;
    peer_avg: number;
    peer_median: number;
    user_value: number;
    gap: number;
  };
  competitor_examples: Array<{ brand: string; value: number; asset_type: AssetType }>;
  supporting_asset_types: AssetType[];
  execution_payload: Record<string, unknown>;
}

const DIFFICULTY_WEIGHT: Record<Difficulty, 1 | 3 | 5> = {
  easy: 1,
  medium: 3,
  hard: 5,
};

const MIN_PEER_SAMPLE = 3;

function countUserAssets(ctx: RecommendationContext, asset: AssetType): { count: number; urls: string[] } {
  const urls = ctx.userCitations
    .filter((c) => c.asset_type === asset)
    .map((c) => c.url);
  return { count: urls.length, urls: Array.from(new Set(urls)).slice(0, 20) };
}

function peerFor(ctx: RecommendationContext, asset: AssetType): PeerAssetStats | null {
  return ctx.peerStats.find((p) => p.asset_type === asset && p.peer_sample_size >= MIN_PEER_SAMPLE) ?? null;
}

function confidenceFromSample(sample: number, classificationConf = 0.8): number {
  // Saturating curve: 3 samples -> ~50, 10 -> ~80, 30+ -> 95
  const base = 100 * (1 - Math.exp(-sample / 8));
  return Math.round(Math.min(95, base * classificationConf));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function avgClassificationConf(cits: CitationRow[], asset: AssetType): number {
  const xs = cits.filter((c) => c.asset_type === asset && typeof c.classification_confidence === "number");
  if (xs.length === 0) return 0.7;
  return xs.reduce((s, c) => s + (c.classification_confidence ?? 0), 0) / xs.length;
}

// ----- Rules -----

function assetGapRule(
  ctx: RecommendationContext,
  asset: AssetType,
  cfg: {
    type: string;
    title: (gap: number, peerAvg: number) => string;
    description: (gap: number, peerAvg: number, userVal: number) => string;
    target: TargetMetric;
    impactPerUnit: number; // metric pts per asset added
    difficulty: Difficulty;
    time: number;
    category: string;
    generator: string;
  },
): RecommendationCandidate | null {
  const peer = peerFor(ctx, asset);
  if (!peer) return null;
  const user = countUserAssets(ctx, asset);
  const gap = Math.max(0, peer.peer_median - user.count);
  if (gap < 1) return null;

  const projected = clamp(gap * cfg.impactPerUnit, 1, 20);
  const expected_impact = clamp(Math.round(projected * 5), 5, 95);
  const conf = confidenceFromSample(peer.peer_sample_size, avgClassificationConf(ctx.allCitations, asset));
  const dw = DIFFICULTY_WEIGHT[cfg.difficulty];

  return {
    recommendation_type: cfg.type,
    title: cfg.title(gap, peer.peer_avg),
    description: cfg.description(gap, peer.peer_avg, user.count),
    why_this_matters: `Top ${peer.peer_sample_size} competitors in your industry average ${peer.peer_avg.toFixed(1)} ${asset.replace("_", " ")}s. You have ${user.count}. Closing this gap projects +${projected.toFixed(1)} ${cfg.target}.`,
    category: cfg.category,
    target_metric: cfg.target,
    projected_metric_delta: Number(projected.toFixed(2)),
    expected_impact,
    confidence: conf,
    difficulty: cfg.difficulty,
    difficulty_weight: dw,
    time_estimate_minutes: cfg.time,
    evidence: {
      user_value: user.count,
      peer_sample_size: peer.peer_sample_size,
      peer_avg: peer.peer_avg,
      peer_median: peer.peer_median,
      peer_max: peer.peer_max,
      gap,
      source_grain: { asset_type: asset, industry_id: ctx.industry_id, topic_cluster_id: ctx.topic_cluster_id },
    },
    evidence_urls: user.urls,
    industry_benchmark: {
      metric: `${asset}_count`,
      peer_avg: peer.peer_avg,
      peer_median: peer.peer_median,
      user_value: user.count,
      gap,
    },
    competitor_examples: peer.top_brands.slice(0, 3),
    supporting_asset_types: [asset],
    execution_payload: {
      action: `generate_${asset}`,
      generator: cfg.generator,
      inputs: {
        topic_cluster_id: ctx.topic_cluster_id,
        industry_id: ctx.industry_id,
        target_count: Math.max(gap, 1),
        competitor_brands: peer.top_brands.slice(0, 3).map((b) => b.brand),
      },
      expected_artifacts: [{ type: "content_asset", asset_type: asset }],
      measurement: { metric: cfg.target, horizon_days: 14 },
    },
  };
}

function authorityLiftRule(ctx: RecommendationContext): RecommendationCandidate | null {
  const candidates = ctx.peerStats.filter(
    (p) => p.peer_sample_size >= MIN_PEER_SAMPLE && (p.avg_authority ?? 0) >= 60,
  );
  if (candidates.length === 0) return null;
  const best = candidates.sort((a, b) => (b.avg_authority ?? 0) - (a.avg_authority ?? 0))[0];
  const userOnTopDomains = ctx.userCitations.filter((c) => c.asset_type === best.asset_type).length;
  if (userOnTopDomains >= 2) return null;

  const projected = 5;
  return {
    recommendation_type: `authority_lift_${best.asset_type}`,
    title: `Earn placements on high-authority ${best.asset_type.replace("_", " ")}s`,
    description: `Peers winning AI recommendations appear on ${best.asset_type.replace("_", " ")}s with an average authority score of ${best.avg_authority?.toFixed(0)}. You currently have ${userOnTopDomains} such placement(s).`,
    why_this_matters: `Authority signals from ${best.asset_type.replace("_", " ")}s correlate with higher Citation Authority Gap closure. Average peer authority on these surfaces is ${best.avg_authority?.toFixed(0)}.`,
    category: "authority",
    target_metric: "CAG",
    projected_metric_delta: projected,
    expected_impact: 60,
    confidence: confidenceFromSample(best.peer_sample_size),
    difficulty: "hard",
    difficulty_weight: 5,
    time_estimate_minutes: 240,
    evidence: {
      user_value: userOnTopDomains,
      peer_sample_size: best.peer_sample_size,
      peer_avg_authority: best.avg_authority,
      asset_type: best.asset_type,
    },
    evidence_urls: ctx.userCitations.filter((c) => c.asset_type === best.asset_type).map((c) => c.url).slice(0, 10),
    industry_benchmark: {
      metric: `${best.asset_type}_authority`,
      peer_avg: best.avg_authority ?? 0,
      peer_median: best.avg_authority ?? 0,
      user_value: userOnTopDomains,
      gap: Math.max(0, 2 - userOnTopDomains),
    },
    competitor_examples: best.top_brands.slice(0, 3),
    supporting_asset_types: [best.asset_type],
    execution_payload: {
      action: "outreach_authority_placement",
      generator: "manual",
      inputs: { asset_type: best.asset_type, target_authority_min: 60 },
      expected_artifacts: [{ type: "content_asset", asset_type: best.asset_type }],
      measurement: { metric: "CAG", horizon_days: 30 },
    },
  };
}

function tsdLiftRule(ctx: RecommendationContext): RecommendationCandidate | null {
  const tsd = ctx.metrics.tsd ?? 0;
  // Need at least one peer asset class to benchmark against
  const peer = ctx.peerStats.find((p) => p.peer_sample_size >= MIN_PEER_SAMPLE);
  if (!peer) return null;
  if (tsd >= 0.6) return null;
  const projected = clamp((0.6 - tsd) * 15, 2, 10);
  return {
    recommendation_type: "tsd_lift",
    title: "Diversify your trusted source mix",
    description: `Your Trust Source Density is ${tsd.toFixed(2)}. Diversifying supporting domains across review sites, Reddit, and listicles projects +${projected.toFixed(1)} RSS.`,
    why_this_matters: `Low TSD means AI sees the same few sources repeating your brand. Distributing mentions across distinct trusted domains compounds Recommendation Strength.`,
    category: "trust",
    target_metric: "RSS",
    projected_metric_delta: Number(projected.toFixed(2)),
    expected_impact: clamp(Math.round(projected * 6), 10, 80),
    confidence: confidenceFromSample(peer.peer_sample_size),
    difficulty: "medium",
    difficulty_weight: 3,
    time_estimate_minutes: 120,
    evidence: { tsd, target: 0.6, peer_sample_size: peer.peer_sample_size },
    evidence_urls: ctx.userCitations.map((c) => c.url).slice(0, 10),
    industry_benchmark: {
      metric: "TSD",
      peer_avg: 0.6,
      peer_median: 0.6,
      user_value: tsd,
      gap: Number((0.6 - tsd).toFixed(2)),
    },
    competitor_examples: peer.top_brands.slice(0, 3),
    supporting_asset_types: ["review_page", "reddit_thread", "listicle"],
    execution_payload: {
      action: "diversify_trust_sources",
      generator: "lovable-ai/gemini-2.5-flash",
      inputs: { target_tsd: 0.6, current_tsd: tsd },
      expected_artifacts: [{ type: "content_asset", asset_type: "review_page" }],
      measurement: { metric: "TSD", horizon_days: 21 },
    },
  };
}

// ----- Public API -----

export function runAllRules(ctx: RecommendationContext): RecommendationCandidate[] {
  const out: Array<RecommendationCandidate | null> = [];

  out.push(
    assetGapRule(ctx, "comparison_page", {
      type: "comparison_page_gap",
      title: (gap, avg) => `Build ${gap} more comparison pages (peers average ${avg.toFixed(0)})`,
      description: (gap, avg, user) =>
        `Top competitors average ${avg.toFixed(1)} comparison pages. You have ${user}. Add ${gap} targeted comparisons.`,
      target: "RSS",
      impactPerUnit: 1.4,
      difficulty: "medium",
      time: 180,
      category: "content",
      generator: "lovable-ai/gemini-2.5-flash",
    }),
  );

  out.push(
    assetGapRule(ctx, "reddit_thread", {
      type: "reddit_presence_gap",
      title: (gap, avg) => `Engage in ${gap} relevant Reddit discussions (peers in ${avg.toFixed(0)})`,
      description: (gap, avg, user) =>
        `Winning brands appear in an average of ${avg.toFixed(1)} Reddit threads. You appear in ${user}. Identify ${gap} on-topic subreddits.`,
      target: "RSS",
      impactPerUnit: 0.8,
      difficulty: "medium",
      time: 90,
      category: "community",
      generator: "manual",
    }),
  );

  out.push(
    assetGapRule(ctx, "listicle", {
      type: "listicle_inclusion_gap",
      title: (gap, avg) => `Get included in ${gap} more listicles (peer median ${avg.toFixed(0)})`,
      description: (gap, avg, user) =>
        `Listicles drive a meaningful share of AI citations. Peers average ${avg.toFixed(1)}; you have ${user}.`,
      target: "RSS",
      impactPerUnit: 1.1,
      difficulty: "medium",
      time: 120,
      category: "outreach",
      generator: "manual",
    }),
  );

  out.push(
    assetGapRule(ctx, "directory_listing", {
      type: "directory_listing_gap",
      title: (gap, avg) => `Claim ${gap} additional directory listings`,
      description: (gap, avg, user) =>
        `Competitors average ${avg.toFixed(1)} directory listings; you have ${user}. Directory presence is a cheap, durable AI signal.`,
      target: "TSD",
      impactPerUnit: 0.6,
      difficulty: "easy",
      time: 45,
      category: "distribution",
      generator: "manual",
    }),
  );

  out.push(
    assetGapRule(ctx, "review_page", {
      type: "review_profile_gap",
      title: (gap, avg) => `Build ${gap} more review-site profiles`,
      description: (gap, avg, user) =>
        `Top competitors maintain ${avg.toFixed(1)} review-site profiles (G2/Capterra/Trustpilot class). You have ${user}.`,
      target: "CAG",
      impactPerUnit: 1.2,
      difficulty: "medium",
      time: 90,
      category: "reviews",
      generator: "manual",
    }),
  );

  out.push(authorityLiftRule(ctx));
  out.push(tsdLiftRule(ctx));

  return out.filter((x): x is RecommendationCandidate => x !== null);
}

export function priorityScore(c: RecommendationCandidate): number {
  return Number(((c.expected_impact * c.confidence) / c.difficulty_weight).toFixed(2));
}

// Novelty: 1.0 = brand new, decays with recurrence. A rec seen 5+ scans in a row
// without action is heavily suppressed so users don't see the same 30 suggestions.
export function noveltyScore(recurrence: number): number {
  if (recurrence <= 1) return 1;
  return Number(Math.max(0.2, 1 / Math.log2(recurrence + 1)).toFixed(3));
}

export function rankAndCap(candidates: RecommendationCandidate[], history: RecommendationContext["history"], cap = 12) {
  const enriched = candidates.map((c) => {
    const h = history[c.recommendation_type] ?? { recurrence_count: 0, last_seen_scan_id: null };
    const recurrence = h.recurrence_count + 1;
    const novelty = noveltyScore(recurrence);
    const priority = priorityScore(c) * novelty;
    return { c, recurrence, novelty, priority };
  });
  enriched.sort((a, b) => b.priority - a.priority);
  return enriched.slice(0, cap);
}
