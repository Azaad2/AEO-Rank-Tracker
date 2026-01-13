import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileSearch, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Grade {
  score: number;
  grade: string;
}

interface Recommendation {
  priority: string;
  issue: string;
  suggestion: string;
  impact: string;
}

interface AuditResult {
  overallScore: number;
  grades: {
    clarity: Grade;
    structure: Grade;
    aiCitability: Grade;
    keywords: Grade;
    readability: Grade;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  aiOptimizationTips: string[];
}

const contentTypes = ["Blog Post", "Article", "Landing Page", "Product Page", "About Page", "FAQ Page"];

const ContentAuditor = () => {
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState("Blog Post");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error("Please enter content to audit");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("audit-content", {
        body: { content, contentType },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Content audited!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to audit content. Please try again.");
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

  const getPriorityBg = (priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-800";
    if (priority === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const relatedTools = [
    { title: "AI FAQ Generator", href: "/tools/ai-faq-generator", description: "Generate SEO FAQs" },
    { title: "Keyword Analyzer", href: "/tools/keyword-analyzer", description: "Find AI keywords" },
    { title: "Meta Optimizer", href: "/tools/meta-optimizer", description: "Optimize meta tags" },
  ];

  return (
    <ToolLayout
      title="AI Content Auditor"
      description="Analyze your content for AI-friendliness and get actionable recommendations to improve visibility."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              Audit Your Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Content to Audit *</Label>
              <Textarea
                id="content"
                placeholder="Paste your content here for analysis..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length} characters | ~{Math.ceil(content.split(/\s+/).length)} words
              </p>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Auditing Content...
                </>
              ) : (
                "Audit Content"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </div>
                  <p className="text-muted-foreground mt-1">AI Optimization Score</p>
                  <Progress value={result.overallScore} className="mt-4 h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Category Grades */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Grades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {result.grades && Object.entries(result.grades).map(([key, value]) => (
                    <div key={key} className="text-center p-3 bg-muted rounded-lg">
                      <div className={`text-2xl font-bold mb-1 ${getScoreColor(value.score)}`}>
                        {value.score}
                      </div>
                      <Badge className={getGradeBg(value.grade)}>{value.grade}</Badge>
                      <p className="text-xs text-muted-foreground mt-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                    {result.strengths?.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{strength}</span>
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
                    {result.weaknesses?.map((weakness, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Priority Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityBg(rec.priority)}>{rec.priority}</Badge>
                        <span className="font-medium">{rec.issue}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.suggestion}</p>
                      <p className="text-xs text-primary">Impact: {rec.impact}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* AI Tips */}
            {result.aiOptimizationTips && result.aiOptimizationTips.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">AI Optimization Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.aiOptimizationTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">💡</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default ContentAuditor;
