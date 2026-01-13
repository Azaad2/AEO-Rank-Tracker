import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Gauge, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Category {
  score: number;
  weight: number;
}

interface Action {
  action: string;
  impact: string;
  effort: string;
  scoreIncrease: number;
}

interface ReadinessResult {
  overallScore: number;
  grade: string;
  categories: {
    contentClarity: Category;
    structure: Category;
    authority: Category;
    technicalSEO: Category;
    schemaReadiness: Category;
    citability: Category;
  };
  strengths: string[];
  weaknesses: string[];
  prioritizedActions: Action[];
  competitivePosition: string;
  aiReadinessLevel: string;
}

const LLMReadinessScore = () => {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [content, setContent] = useState("");
  const [inputMode, setInputMode] = useState<"url" | "content">("url");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ReadinessResult | null>(null);

  const handleGenerate = async () => {
    if (inputMode === "url" && !websiteUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    if (inputMode === "content" && !content.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-readiness", {
        body: inputMode === "url" ? { websiteUrl } : { content },
      });

      if (error) throw error;
      setResult(data);
      toast.success("LLM readiness scored!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to score readiness. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeBg = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800";
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getLevelBg = (level: string) => {
    if (level === "expert") return "bg-green-100 text-green-800";
    if (level === "advanced") return "bg-blue-100 text-blue-800";
    if (level === "intermediate") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getImpactColor = (impact: string) => {
    if (impact === "high") return "text-green-600";
    if (impact === "medium") return "text-yellow-600";
    return "text-gray-600";
  };

  const relatedTools = [
    { title: "Content Auditor", href: "/tools/content-auditor", description: "Audit content for AI" },
    { title: "Competitor Analyzer", href: "/tools/competitor-analyzer", description: "Compare with competitors" },
    { title: "Schema Generator", href: "/tools/schema-generator", description: "Generate schema markup" },
  ];

  return (
    <ToolLayout
      title="LLM Readiness Score"
      description="Get a comprehensive score on how well your website or content is optimized for AI and LLM discovery."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Score Your LLM Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "url" | "content")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Website URL</TabsTrigger>
                <TabsTrigger value="content">Paste Content</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-4">
                <div>
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="content" className="mt-4">
                <div>
                  <Label htmlFor="content">Content to Analyze</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your website content, article, or page text here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scoring Readiness...
                </>
              ) : (
                "Get LLM Readiness Score"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore}
                    </div>
                    <p className="text-muted-foreground mt-1">Overall Score</p>
                  </div>
                  <div className="text-center">
                    <Badge className={`${getGradeBg(result.grade)} text-2xl px-4 py-2`}>
                      {result.grade}
                    </Badge>
                    <p className="text-muted-foreground mt-2">Grade</p>
                  </div>
                  <div className="text-center">
                    <Badge className={`${getLevelBg(result.aiReadinessLevel)} px-3 py-1`}>
                      {result.aiReadinessLevel}
                    </Badge>
                    <p className="text-muted-foreground mt-2">Level</p>
                  </div>
                </div>
                <Progress value={result.overallScore} className="mt-6 h-3" />
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            {result.categories && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(result.categories).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className={getScoreColor(value.score)}>{value.score}/100</span>
                        </div>
                        <Progress value={value.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.weaknesses?.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Priority Actions */}
            {result.prioritizedActions && result.prioritizedActions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Priority Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.prioritizedActions.map((action, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Effort: {action.effort}</Badge>
                          <span className={`text-sm font-medium ${getImpactColor(action.impact)}`}>
                            Impact: {action.impact}
                          </span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          +{action.scoreIncrease} pts
                        </Badge>
                      </div>
                      <p className="font-medium">{action.action}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Competitive Position */}
            {result.competitivePosition && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Competitive Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{result.competitivePosition}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default LLMReadinessScore;
