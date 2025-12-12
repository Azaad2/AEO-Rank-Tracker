import { ImprovementInsight, analyzeResults, getTopCompetitors } from './improvementAnalysis';

interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
}

interface ScanResponse {
  project: string;
  promptsCount: number;
  score: number;
  results: ScanResult[];
}

function getStatusLabel(result: ScanResult): string {
  if (!result.mentioned && !result.cited) return '❌ Critical';
  if (result.mentioned && !result.cited) return '⚠️ Warning';
  if (result.cited && result.citationRank && result.citationRank > 3) return '📈 Improve';
  if (result.cited && result.citationRank && result.citationRank <= 3) return '✅ Good';
  return '—';
}

function getIssueForResult(result: ScanResult): string {
  if (!result.mentioned && !result.cited) return 'Not visible in AI answers';
  if (result.mentioned && !result.cited) return 'Mentioned but not cited as source';
  if (result.cited && result.citationRank && result.citationRank > 3) return `Cited but ranked #${result.citationRank}`;
  if (result.cited && result.citationRank && result.citationRank <= 3) return 'Well positioned';
  return 'Unknown status';
}

function getRecommendationForResult(result: ScanResult): string {
  if (!result.mentioned && !result.cited) {
    return 'Create comprehensive content targeting this query. Include your brand name and provide unique insights that AI will want to cite.';
  }
  if (result.mentioned && !result.cited) {
    return 'Build authority with quality backlinks. Add structured data (FAQ/HowTo schema) to improve citation probability.';
  }
  if (result.cited && result.citationRank && result.citationRank > 3) {
    return `Analyze top ${result.citationRank - 1} competitors. Add original data, case studies, or research to outrank them.`;
  }
  if (result.cited && result.citationRank && result.citationRank <= 3) {
    return 'Maintain content quality. Consider expanding into related queries to build a topic cluster.';
  }
  return 'Review your content strategy for this query.';
}

function getPriorityForResult(result: ScanResult): number {
  if (!result.mentioned && !result.cited) return 1;
  if (result.mentioned && !result.cited) return 2;
  if (result.cited && result.citationRank && result.citationRank > 3) return 3;
  return 4;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateEnhancedCSV(scanData: ScanResponse): string {
  const insights = analyzeResults(scanData.results, scanData.project);
  const competitors = getTopCompetitors(scanData.results, scanData.project);
  
  // Count issues
  const criticalCount = scanData.results.filter(r => !r.mentioned && !r.cited).length;
  const warningCount = scanData.results.filter(r => r.mentioned && !r.cited).length;
  const improveCount = scanData.results.filter(r => r.cited && r.citationRank && r.citationRank > 3).length;
  const goodCount = scanData.results.filter(r => r.cited && r.citationRank && r.citationRank <= 3).length;
  
  const lines: string[] = [];
  
  // Summary Header
  lines.push('AI VISIBILITY REPORT');
  lines.push('');
  lines.push(`Domain:,${escapeCSV(scanData.project)}`);
  lines.push(`Scan Date:,${new Date().toISOString().split('T')[0]}`);
  lines.push(`Overall Score:,${scanData.score}/100`);
  lines.push(`Prompts Analyzed:,${scanData.promptsCount}`);
  lines.push('');
  
  // Issue Summary
  lines.push('VISIBILITY SUMMARY');
  lines.push(`Critical Issues (Not Visible):,${criticalCount} prompts`);
  lines.push(`Warning Issues (Not Cited):,${warningCount} prompts`);
  lines.push(`Needs Improvement:,${improveCount} prompts`);
  lines.push(`Good Status:,${goodCount} prompts`);
  lines.push('');
  
  // Top Competitors
  if (competitors.length > 0) {
    lines.push('TOP COMPETITORS');
    competitors.forEach((comp, idx) => {
      lines.push(`${idx + 1}.,${escapeCSV(comp.domain)},${comp.appearances} appearances`);
    });
    lines.push('');
  }
  
  // Priority Actions
  lines.push('PRIORITY ACTIONS');
  insights.filter(i => i.severity !== 'success').slice(0, 5).forEach((insight, idx) => {
    lines.push(`${idx + 1}.,${escapeCSV(insight.issue)}`);
    lines.push(`,${escapeCSV(insight.recommendation)}`);
  });
  lines.push('');
  
  // Detailed Results Header
  lines.push('DETAILED RESULTS');
  lines.push('Prompt,Mentioned,Cited,Citation Rank,Top Cited Domains,Status,Issue,Recommendation,Priority');
  
  // Detailed Results Rows
  scanData.results.forEach(result => {
    const row = [
      escapeCSV(result.prompt),
      result.mentioned ? 'Yes' : 'No',
      result.cited ? 'Yes' : 'No',
      result.citationRank?.toString() || '—',
      escapeCSV(result.topCitedDomains.slice(0, 3).join('; ')),
      getStatusLabel(result),
      escapeCSV(getIssueForResult(result)),
      escapeCSV(getRecommendationForResult(result)),
      getPriorityForResult(result).toString(),
    ];
    lines.push(row.join(','));
  });
  
  return lines.join('\n');
}
