export type Issue = {
  id: string;
  severity: "high" | "med" | "low";
  title: string;
  evidence: string;
  fixType: string;
  category: string;
};

export interface ScanResultLite {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  geminiMentioned: boolean;
  geminiCited: boolean;
  geminiCompetitors?: string[] | null;
  perplexityMentioned?: boolean;
  perplexityCited?: boolean;
  perplexityCompetitors?: string[] | null;
  topCitedDomains?: string[] | null;
}

export const getUniqueCompetitors = (results: ScanResultLite[]): string[] => {
  const all = results.flatMap(r => [
    ...(r.geminiCompetitors || []),
    ...(r.perplexityCompetitors || []),
    ...(r.topCitedDomains || []),
  ]);
  return [...new Set(all)].slice(0, 5);
};

export const deriveIssues = (
  results: ScanResultLite[],
  score: number,
  competitors: string[]
): Issue[] => {
  const issues: Issue[] = [];
  const total = results.length || 1;

  const geminiCited = results.filter(r => r.geminiCited).length;
  const perpCited = results.filter(r => r.perplexityCited).length;
  const searchMentioned = results.filter(r => r.mentioned).length;
  const anyCited = results.some(r => r.cited || r.geminiCited || r.perplexityCited);

  if (perpCited === 0) {
    issues.push({ id: "no-perp-cite", severity: "high", category: "Perplexity",
      title: "Not cited on Perplexity",
      evidence: `Cited in 0/${total} Perplexity responses — Perplexity loves Article schema.`,
      fixType: "article_schema" });
  }
  if (geminiCited < total / 2) {
    issues.push({ id: "low-gemini-cite", severity: "high", category: "Gemini",
      title: "Weak citations on Gemini",
      evidence: `Cited in ${geminiCited}/${total} Gemini responses. Add FAQ schema + answer-style content.`,
      fixType: "faq_schema" });
  }
  if (searchMentioned < total / 2) {
    issues.push({ id: "low-search-mention", severity: "med", category: "Search/ChatGPT",
      title: "Low search mentions",
      evidence: `Mentioned in ${searchMentioned}/${total} search results. Expand content depth + internal links.`,
      fixType: "content_expand" });
  }
  if (competitors.length > 0) {
    issues.push({ id: "competitors", severity: "high", category: "Competitors",
      title: `${competitors.length} competitors outranking you`,
      evidence: `${competitors[0]}${competitors.length > 1 ? ` + ${competitors.length - 1} others` : ""} are mentioned instead of your brand.`,
      fixType: "answer_style" });
  }
  if (score < 50) {
    issues.push({ id: "weak-meta", severity: "med", category: "On-page SEO",
      title: "Weak meta tags hurt AI parsing",
      evidence: `Overall score is ${score}/100. AI assistants rely on strong titles + descriptions.`,
      fixType: "meta_title" });
  }
  if (!anyCited) {
    issues.push({ id: "no-org", severity: "high", category: "Authority",
      title: "Missing Organization schema",
      evidence: "Zero citations across all platforms — add Organization JSON-LD to establish brand entity.",
      fixType: "org_schema" });
  }
  const alt: Issue[] = [
    { id: "answer-style", severity: "low", category: "Citability",
      title: "Few answer-style paragraphs",
      evidence: "AI assistants quote concise Q&A-formatted answers more often.",
      fixType: "answer_style" },
    { id: "internal-links", severity: "low", category: "Structure",
      title: "Improve internal linking",
      evidence: "Internal links help AI crawlers map your topical authority.",
      fixType: "internal_links" },
  ];
  for (const a of alt) if (issues.length < 6) issues.push(a);
  return issues;
};

export const severityStyles: Record<Issue["severity"], string> = {
  high: "bg-red-500/15 text-red-300 border-red-500/30",
  med: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};
