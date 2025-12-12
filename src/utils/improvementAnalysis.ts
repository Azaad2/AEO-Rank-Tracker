interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
}

export interface ImprovementInsight {
  area: 'content-gap' | 'authority' | 'ranking' | 'competitive' | 'quick-win';
  severity: 'critical' | 'warning' | 'info' | 'success';
  issue: string;
  recommendation: string;
  priority: number;
  affectedPrompts: string[];
}

export interface AreaScore {
  area: string;
  score: number;
  label: string;
  icon: string;
}

export interface CompetitorAnalysis {
  domain: string;
  appearances: number;
  prompts: string[];
}

export function analyzeResults(results: ScanResult[], domain: string): ImprovementInsight[] {
  const insights: ImprovementInsight[] = [];
  
  // Group prompts by status
  const notMentionedNotCited = results.filter(r => !r.mentioned && !r.cited);
  const mentionedNotCited = results.filter(r => r.mentioned && !r.cited);
  const citedLowRank = results.filter(r => r.cited && r.citationRank && r.citationRank > 3);
  const citedHighRank = results.filter(r => r.cited && r.citationRank && r.citationRank <= 3);
  
  // Critical: Not mentioned and not cited
  if (notMentionedNotCited.length > 0) {
    insights.push({
      area: 'content-gap',
      severity: 'critical',
      issue: `Your brand is invisible in ${notMentionedNotCited.length} AI answer${notMentionedNotCited.length > 1 ? 's' : ''}`,
      recommendation: 'Create comprehensive, authoritative content targeting these queries. Include your brand name naturally and provide unique value that AI will want to cite.',
      priority: 1,
      affectedPrompts: notMentionedNotCited.map(r => r.prompt),
    });
  }
  
  // Warning: Mentioned but not cited
  if (mentionedNotCited.length > 0) {
    insights.push({
      area: 'authority',
      severity: 'warning',
      issue: `AI mentions you but doesn't cite you in ${mentionedNotCited.length} answer${mentionedNotCited.length > 1 ? 's' : ''}`,
      recommendation: 'Build domain authority through quality backlinks, add structured data (FAQ, HowTo schemas), and ensure your content is the definitive source for these topics.',
      priority: 2,
      affectedPrompts: mentionedNotCited.map(r => r.prompt),
    });
  }
  
  // Info: Cited but low rank
  if (citedLowRank.length > 0) {
    insights.push({
      area: 'ranking',
      severity: 'info',
      issue: `You're cited but ranked #4 or lower in ${citedLowRank.length} answer${citedLowRank.length > 1 ? 's' : ''}`,
      recommendation: 'Analyze the top-cited competitors for these prompts. Improve your content depth, add original research or data, and build more topical authority.',
      priority: 3,
      affectedPrompts: citedLowRank.map(r => r.prompt),
    });
  }
  
  // Analyze competitor dominance
  const competitorMap = new Map<string, string[]>();
  results.forEach(r => {
    r.topCitedDomains.forEach(d => {
      const cleanDomain = d.toLowerCase().replace(/^www\./, '');
      if (!cleanDomain.includes(domain.toLowerCase().replace(/^www\./, ''))) {
        if (!competitorMap.has(cleanDomain)) {
          competitorMap.set(cleanDomain, []);
        }
        competitorMap.get(cleanDomain)!.push(r.prompt);
      }
    });
  });
  
  const topCompetitors = Array.from(competitorMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);
  
  if (topCompetitors.length > 0 && topCompetitors[0][1].length >= 2) {
    insights.push({
      area: 'competitive',
      severity: 'warning',
      issue: `${topCompetitors.length} competitor${topCompetitors.length > 1 ? 's' : ''} appear${topCompetitors.length === 1 ? 's' : ''} more frequently than you`,
      recommendation: `Study these competitors: ${topCompetitors.map(c => c[0]).join(', ')}. Analyze their content structure, backlink profiles, and unique value propositions.`,
      priority: 2,
      affectedPrompts: [...new Set(topCompetitors.flatMap(c => c[1]))],
    });
  }
  
  // Success: Good positioning
  if (citedHighRank.length > 0) {
    insights.push({
      area: 'quick-win',
      severity: 'success',
      issue: `Great! You're well-positioned in ${citedHighRank.length} AI answer${citedHighRank.length > 1 ? 's' : ''}`,
      recommendation: 'Maintain your current content quality for these topics. Consider expanding into related queries to build a content cluster.',
      priority: 5,
      affectedPrompts: citedHighRank.map(r => r.prompt),
    });
  }
  
  return insights.sort((a, b) => a.priority - b.priority);
}

export function calculateAreaScores(results: ScanResult[]): AreaScore[] {
  const total = results.length;
  if (total === 0) return [];
  
  const mentioned = results.filter(r => r.mentioned).length;
  const cited = results.filter(r => r.cited).length;
  const highRank = results.filter(r => r.citationRank && r.citationRank <= 3).length;
  
  return [
    {
      area: 'content',
      score: Math.round((mentioned / total) * 100),
      label: 'Content Visibility',
      icon: '📝',
    },
    {
      area: 'authority',
      score: mentioned > 0 ? Math.round((cited / mentioned) * 100) : 0,
      label: 'Citation Authority',
      icon: '🏆',
    },
    {
      area: 'ranking',
      score: cited > 0 ? Math.round((highRank / cited) * 100) : 0,
      label: 'Top 3 Ranking Rate',
      icon: '📊',
    },
  ];
}

export function getTopCompetitors(results: ScanResult[], domain: string): CompetitorAnalysis[] {
  const competitorMap = new Map<string, string[]>();
  
  results.forEach(r => {
    r.topCitedDomains.forEach(d => {
      const cleanDomain = d.toLowerCase().replace(/^www\./, '');
      const cleanUserDomain = domain.toLowerCase().replace(/^www\./, '');
      if (!cleanDomain.includes(cleanUserDomain)) {
        if (!competitorMap.has(cleanDomain)) {
          competitorMap.set(cleanDomain, []);
        }
        competitorMap.get(cleanDomain)!.push(r.prompt);
      }
    });
  });
  
  return Array.from(competitorMap.entries())
    .map(([domain, prompts]) => ({
      domain,
      appearances: prompts.length,
      prompts,
    }))
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 5);
}

export function calculatePotentialScore(currentScore: number, insights: ImprovementInsight[]): number {
  let potential = currentScore;
  
  insights.forEach(insight => {
    if (insight.severity === 'critical') {
      potential += Math.min(25, insight.affectedPrompts.length * 8);
    } else if (insight.severity === 'warning') {
      potential += Math.min(15, insight.affectedPrompts.length * 5);
    } else if (insight.severity === 'info') {
      potential += Math.min(10, insight.affectedPrompts.length * 3);
    }
  });
  
  return Math.min(100, potential);
}
