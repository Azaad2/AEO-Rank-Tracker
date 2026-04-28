import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, AlertCircle, AlertTriangle, Info, CheckCircle2, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { 
  ImprovementInsight, 
  AreaScore, 
  analyzeResults, 
  calculateAreaScores, 
  calculatePotentialScore,
  getTopCompetitors 
} from "@/utils/improvementAnalysis";

interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
}

interface ImprovementRoadmapProps {
  results: ScanResult[];
  domain: string;
  currentScore: number;
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
    badge: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-500/30',
    badge: 'secondary' as const,
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
    badge: 'outline' as const,
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30',
    badge: 'default' as const,
  },
};

const areaLabels: Record<string, string> = {
  'content-gap': 'Content Gaps',
  'authority': 'Authority Building',
  'ranking': 'Ranking Position',
  'competitive': 'Competitive Analysis',
  'quick-win': 'Strengths',
};

export function ImprovementRoadmap({ results, domain, currentScore }: ImprovementRoadmapProps) {
  const [openItems, setOpenItems] = useState<string[]>(['0']);
  
  const insights = analyzeResults(results, domain);
  const areaScores = calculateAreaScores(results);
  const potentialScore = calculatePotentialScore(currentScore, insights);
  const competitors = getTopCompetitors(results, domain);
  
  const toggleItem = (index: string) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg bg-gray-900 border-gray-800 text-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-yellow-400" />
          <CardTitle className="text-white">Your AI Visibility Improvement Roadmap</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Improvement Potential */}
        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-white">Score Improvement Potential</span>
            </div>
            <span className="text-sm text-gray-400">
              {currentScore} → {potentialScore} points
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm w-16 text-gray-300">Current</span>
              <Progress value={currentScore} className="flex-1 h-2 bg-gray-700" />
              <span className="text-sm font-medium w-10 text-right text-white">{currentScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-16 text-yellow-400">Potential</span>
              <Progress value={potentialScore} className="flex-1 h-2 bg-gray-700 [&>div]:bg-yellow-400" />
              <span className="text-sm font-medium w-10 text-right text-yellow-400">{potentialScore}</span>
            </div>
          </div>
        </div>

        {/* Area Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {areaScores.map((area) => (
            <div key={area.area} className="p-3 rounded-lg border border-gray-700 bg-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{area.icon} {area.label}</span>
                <span className="text-sm font-bold text-yellow-400">
                  {area.score}%
                </span>
              </div>
              <Progress 
                value={area.score} 
                className="h-1.5 bg-gray-700 [&>div]:bg-yellow-400"
              />
            </div>
          ))}
        </div>

        {/* Improvement Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-400 uppercase tracking-wide">
            Priority Actions
          </h4>
          {insights.map((insight, idx) => {
            const config = severityConfig[insight.severity];
            const Icon = config.icon;
            const isOpen = openItems.includes(idx.toString());
            
            return (
              <Collapsible 
                key={idx} 
                open={isOpen}
                onOpenChange={() => toggleItem(idx.toString())}
              >
                <div className={`rounded-lg border ${config.borderColor} ${config.bgColor}`}>
                  <CollapsibleTrigger className="w-full p-4 flex items-start gap-3 text-left">
                    <Icon className={`h-5 w-5 mt-0.5 ${config.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{insight.issue}</span>
                        <Badge variant={config.badge} className="text-xs">
                          {areaLabels[insight.area]}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {insight.affectedPrompts.length} prompt{insight.affectedPrompts.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 space-y-3">
                      <div className="pl-8">
                        <p className="text-sm text-gray-300">
                          <strong className="text-white">Recommendation:</strong> {insight.recommendation}
                        </p>
                      </div>
                      <div className="pl-8">
                        <p className="text-xs font-medium text-gray-400 mb-1.5">
                          Affected prompts:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {insight.affectedPrompts.map((prompt, pIdx) => (
                            <span 
                              key={pIdx}
                              className="text-xs px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-300 truncate max-w-xs"
                              title={prompt}
                            >
                              {prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {/* Top Competitors */}
        {competitors.length > 0 && (
          <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
            <h4 className="font-medium text-sm text-gray-400 uppercase tracking-wide mb-3">
              Top Competitors to Watch
            </h4>
            <div className="space-y-2">
              {competitors.slice(0, 3).map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{comp.domain}</span>
                  <span className="text-gray-400">
                    {comp.appearances} appearance{comp.appearances > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
