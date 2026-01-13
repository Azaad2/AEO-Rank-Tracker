import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, TrendingUp, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Competitor {
  domain: string;
  aiVisibilityScore: number;
  strengths: string[];
  weaknesses: string[];
  threatLevel: string;
}

interface Opportunity {
  opportunity: string;
  priority: string;
  effort: string;
  impact: string;
}

interface CompetitorResult {
  yourDomain: {
    domain: string;
    aiVisibilityScore: number;
    strengths: string[];
    weaknesses: string[];
  };
  competitors: Competitor[];
  opportunities: Opportunity[];
  recommendations: string[];
  contentGaps: string[];
}

const CompetitorAnalyzer = () => {
  const [yourDomain, setYourDomain] = useState("");
  const [competitor1, setCompetitor1] = useState("");
  const [competitor2, setCompetitor2] = useState("");
  const [competitor3, setCompetitor3] = useState("");
  const [industry, setIndustry] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CompetitorResult | null>(null);

  const handleGenerate = async () => {
    if (!yourDomain.trim()) {
      toast.error("Please enter your domain");
      return;
    }

    const competitors = [competitor1, competitor2, competitor3].filter(c => c.trim());

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-competitors", {
        body: { yourDomain, competitors, industry },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Competitive analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze competitors. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getThreatColor = (level: string) => {
    if (level === "high") return "bg-red-100 text-red-800";
    if (level === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-800";
    if (priority === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const relatedTools = [
    { title: "Brand Monitor", href: "/tools/brand-monitor", description: "Track brand mentions in AI" },
    { title: "LLM Readiness Score", href: "/tools/llm-readiness-score", description: "Check AI optimization" },
    { title: "Content Auditor", href: "/tools/content-auditor", description: "Audit content for AI" },
  ];

  return (
    <ToolLayout
      title="AI Competitor Analyzer"
      description="Compare your AI visibility against competitors and discover opportunities to outrank them."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Analyze Competitive Landscape
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="domain">Your Domain *</Label>
                <Input
                  id="domain"
                  placeholder="yourdomain.com"
                  value={yourDomain}
                  onChange={(e) => setYourDomain(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., SaaS, E-commerce, Marketing"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="comp1">Competitor 1</Label>
                <Input
                  id="comp1"
                  placeholder="competitor1.com"
                  value={competitor1}
                  onChange={(e) => setCompetitor1(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="comp2">Competitor 2</Label>
                <Input
                  id="comp2"
                  placeholder="competitor2.com"
                  value={competitor2}
                  onChange={(e) => setCompetitor2(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="comp3">Competitor 3</Label>
                <Input
                  id="comp3"
                  placeholder="competitor3.com"
                  value={competitor3}
                  onChange={(e) => setCompetitor3(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Competitors...
                </>
              ) : (
                "Analyze AI Visibility"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Your Score */}
            {result.yourDomain && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">Your AI Visibility Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className={`text-5xl font-bold ${getScoreColor(result.yourDomain.aiVisibilityScore)}`}>
                      {result.yourDomain.aiVisibilityScore}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">{result.yourDomain.domain}</p>
                      <Progress value={result.yourDomain.aiVisibilityScore} className="h-3" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Strengths
                      </h4>
                      <ul className="text-sm space-y-1">
                        {result.yourDomain.strengths?.map((s, i) => (
                          <li key={i} className="text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Weaknesses
                      </h4>
                      <ul className="text-sm space-y-1">
                        {result.yourDomain.weaknesses?.map((w, i) => (
                          <li key={i} className="text-muted-foreground">• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competitors */}
            {result.competitors && result.competitors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Competitor Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.competitors.map((comp, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{comp.domain}</span>
                          <Badge className={getThreatColor(comp.threatLevel)}>
                            {comp.threatLevel} threat
                          </Badge>
                        </div>
                        <div className={`text-2xl font-bold ${getScoreColor(comp.aiVisibilityScore)}`}>
                          {comp.aiVisibilityScore}
                        </div>
                      </div>
                      <Progress value={comp.aiVisibilityScore} className="h-2 mb-3" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-green-600 mb-1">Strengths</p>
                          {comp.strengths?.map((s, j) => (
                            <p key={j} className="text-muted-foreground">• {s}</p>
                          ))}
                        </div>
                        <div>
                          <p className="font-medium text-red-600 mb-1">Weaknesses</p>
                          {comp.weaknesses?.map((w, j) => (
                            <p key={j} className="text-muted-foreground">• {w}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            {result.opportunities && result.opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.opportunities.map((opp, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(opp.priority)}>{opp.priority}</Badge>
                        <Badge variant="outline">Effort: {opp.effort}</Badge>
                      </div>
                      <p className="font-medium mb-1">{opp.opportunity}</p>
                      <p className="text-sm text-muted-foreground">{opp.impact}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary font-bold">{i + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Content Gaps */}
            {result.contentGaps && result.contentGaps.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Content Gaps to Fill</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.contentGaps.map((gap, i) => (
                      <Badge key={i} variant="secondary">{gap}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default CompetitorAnalyzer;
