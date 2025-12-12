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
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    badge: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    badge: 'secondary' as const,
  },
  info: {
    icon: Info,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    badge: 'outline' as const,
  },
  success: {
    icon: CheckCircle2,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
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
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>Your AI Visibility Improvement Roadmap</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Improvement Potential */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">Score Improvement Potential</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentScore} → {potentialScore} points
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm w-16">Current</span>
              <Progress value={currentScore} className="flex-1 h-2" />
              <span className="text-sm font-medium w-10 text-right">{currentScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-16 text-primary">Potential</span>
              <Progress value={potentialScore} className="flex-1 h-2 [&>div]:bg-primary/60" />
              <span className="text-sm font-medium w-10 text-right text-primary">{potentialScore}</span>
            </div>
          </div>
        </div>

        {/* Area Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {areaScores.map((area) => (
            <div key={area.area} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{area.icon} {area.label}</span>
                <span className={`text-sm font-bold ${
                  area.score >= 70 ? 'text-success' : 
                  area.score >= 40 ? 'text-warning' : 'text-destructive'
                }`}>
                  {area.score}%
                </span>
              </div>
              <Progress 
                value={area.score} 
                className={`h-1.5 ${
                  area.score >= 70 ? '[&>div]:bg-success' : 
                  area.score >= 40 ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Improvement Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
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
                        <span className="font-medium">{insight.issue}</span>
                        <Badge variant={config.badge} className="text-xs">
                          {areaLabels[insight.area]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {insight.affectedPrompts.length} prompt{insight.affectedPrompts.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 space-y-3">
                      <div className="pl-8">
                        <p className="text-sm text-muted-foreground">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </p>
                      </div>
                      <div className="pl-8">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">
                          Affected prompts:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {insight.affectedPrompts.map((prompt, pIdx) => (
                            <span 
                              key={pIdx}
                              className="text-xs px-2 py-1 rounded bg-background border truncate max-w-xs"
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
          <div className="p-4 rounded-lg border bg-card">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Top Competitors to Watch
            </h4>
            <div className="space-y-2">
              {competitors.slice(0, 3).map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{comp.domain}</span>
                  <span className="text-muted-foreground">
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
