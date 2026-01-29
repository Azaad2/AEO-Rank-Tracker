import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wand2, 
  AlertTriangle, 
  Target, 
  Users, 
  Lightbulb, 
  Loader2,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { QuickActionCards } from "./QuickActionCards";
import { PromptOptimizer } from "./PromptOptimizer";

interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
  geminiMentioned: boolean;
  geminiCited: boolean;
  geminiResponse: string;
  geminiCompetitors: string[];
  perplexityMentioned?: boolean;
  perplexityCited?: boolean;
  perplexityResponse?: string;
  perplexityCompetitors?: string[];
}

interface OptimizationPlan {
  diagnosis: {
    summary: string;
    rootCauses: string[];
  };
  promptFixes: Array<{
    prompt: string;
    rootCause: string;
    contentSuggestion: string;
    faqsToAdd: string[];
    schemaType: string;
    priority: "high" | "medium" | "low";
  }>;
  quickWins: Array<{
    action: string;
    impact: string;
    effort: string;
    toolLink?: string;
  }>;
  competitorInsights: Array<{
    competitor: string;
    strength: string;
    opportunity: string;
  }>;
  contentStrategy: {
    topicClusters: string[];
    authorityBuilding: string;
    technicalSEO: string;
  };
}

interface OptimizationHubProps {
  scanData: {
    project: string;
    score: number;
    results: ScanResult[];
  };
  isUnlocked: boolean;
}

export function OptimizationHub({ scanData, isUnlocked }: OptimizationHubProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<OptimizationPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { trackEvent } = useActivityTracking();

  // Only show for scores below 70
  if (scanData.score >= 70) {
    return null;
  }

  // Get unique competitors from all results
  const getUniqueCompetitors = (): string[] => {
    const allCompetitors = scanData.results.flatMap(r => [
      ...(r.geminiCompetitors || []),
      ...(r.perplexityCompetitors || []),
      ...(r.topCitedDomains || [])
    ]);
    return [...new Set(allCompetitors)].slice(0, 10);
  };

  const generateOptimizationPlan = async () => {
    setIsLoading(true);
    setError(null);

    trackEvent('optimization_plan_requested', {
      domain: scanData.project,
      score: scanData.score,
    });

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-optimization-plan', {
        body: {
          domain: scanData.project,
          score: scanData.score,
          results: scanData.results,
          competitors: getUniqueCompetitors(),
        },
      });

      if (fnError) throw fnError;

      if (data?.plan) {
        setPlan(data.plan);
        trackEvent('optimization_plan_generated', {
          domain: scanData.project,
          score: scanData.score,
          quickWinsCount: data.plan.quickWins?.length || 0,
          promptFixesCount: data.plan.promptFixes?.length || 0,
        });
        toast({
          title: "Optimization plan generated!",
          description: "Review your personalized recommendations below.",
        });
      } else {
        throw new Error("No plan data received");
      }
    } catch (err) {
      console.error("Error generating optimization plan:", err);
      setError(err instanceof Error ? err.message : "Failed to generate plan");
      toast({
        title: "Failed to generate plan",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickActionClick = (action: string) => {
    trackEvent('quick_action_clicked', {
      domain: scanData.project,
      action,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Generating Your Optimization Plan...
          </CardTitle>
          <CardDescription>
            Our AI is analyzing your scan results and creating personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Initial state - show CTA
  if (!plan && !error) {
    return (
      <Card className="shadow-lg border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
        <CardContent className="py-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Wand2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Improve Your AI Visibility</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Your score of <span className="font-bold text-destructive">{scanData.score}</span> means 
              you're missing visibility opportunities. Get a personalized optimization plan with 
              actionable fixes for each failed prompt.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="gap-1">
              <Target className="h-3 w-3" />
              Prompt-specific fixes
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Lightbulb className="h-3 w-3" />
              Quick wins
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              Competitor insights
            </Badge>
          </div>

          <Button 
            size="lg" 
            onClick={generateOptimizationPlan}
            disabled={!isUnlocked}
            className="mt-4"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Optimization Plan
          </Button>

          {!isUnlocked && (
            <p className="text-xs text-muted-foreground">
              Unlock your results first to access the optimization plan
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="shadow-lg border-destructive/30">
        <CardContent className="py-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Failed to Generate Plan</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={generateOptimizationPlan} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Plan generated - show full optimization hub
  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              AI Visibility Optimization Plan
            </CardTitle>
            <CardDescription>
              Personalized recommendations to improve your visibility from {scanData.score} to 70+
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1 text-primary border-primary">
            <TrendingUp className="h-3 w-3" />
            Potential: +{Math.min(70 - scanData.score, 40)} points
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Diagnosis Section */}
        {plan.diagnosis && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive">Why You're Invisible</h4>
                <p className="text-sm text-muted-foreground">{plan.diagnosis.summary}</p>
                {plan.diagnosis.rootCauses && plan.diagnosis.rootCauses.length > 0 && (
                  <ul className="text-sm space-y-1 mt-2">
                    {plan.diagnosis.rootCauses.map((cause, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-destructive">•</span>
                        <span className="text-muted-foreground">{cause}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs for different sections */}
        <Tabs defaultValue="quick-wins" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quick-wins" className="text-xs sm:text-sm">
              Quick Wins
            </TabsTrigger>
            <TabsTrigger value="prompt-fixes" className="text-xs sm:text-sm">
              Prompt Fixes
            </TabsTrigger>
            <TabsTrigger value="competitors" className="text-xs sm:text-sm">
              Competitors
            </TabsTrigger>
            <TabsTrigger value="strategy" className="text-xs sm:text-sm">
              Strategy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick-wins" className="space-y-4">
            <QuickActionCards 
              quickWins={plan.quickWins || []} 
              domain={scanData.project}
              onActionClick={handleQuickActionClick}
            />
          </TabsContent>

          <TabsContent value="prompt-fixes" className="space-y-4">
            <PromptOptimizer 
              promptFixes={plan.promptFixes || []} 
              domain={scanData.project}
            />
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            {plan.competitorInsights && plan.competitorInsights.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Competitor Analysis</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {plan.competitorInsights.map((insight, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm truncate">{insight.competitor}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Their Strength</p>
                            <p className="text-muted-foreground">{insight.strength}</p>
                          </div>
                          <div>
                            <p className="text-xs text-primary font-medium">Your Opportunity</p>
                            <p>{insight.opportunity}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No competitor insights available</p>
            )}
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            {plan.contentStrategy && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Content Strategy</h3>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Topic Clusters */}
                  {plan.contentStrategy.topicClusters && plan.contentStrategy.topicClusters.length > 0 && (
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-medium text-sm">Topic Clusters to Build</h4>
                        <div className="flex flex-wrap gap-2">
                          {plan.contentStrategy.topicClusters.map((topic, idx) => (
                            <Badge key={idx} variant="secondary">{topic}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Authority Building */}
                  {plan.contentStrategy.authorityBuilding && (
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-medium text-sm">Authority Building</h4>
                        <p className="text-sm text-muted-foreground">{plan.contentStrategy.authorityBuilding}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Technical SEO */}
                  {plan.contentStrategy.technicalSEO && (
                    <Card className="md:col-span-2">
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-medium text-sm">Technical Improvements</h4>
                        <p className="text-sm text-muted-foreground">{plan.contentStrategy.technicalSEO}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
