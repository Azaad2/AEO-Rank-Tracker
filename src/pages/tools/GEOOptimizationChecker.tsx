import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Globe2, TrendingUp, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const GEOOptimizationChecker = () => {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-readiness", {
        body: { url },
      });

      if (error) throw error;
      setResults(data);
      toast.success("GEO analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const relatedTools = [
    { title: "AI Overviews Tracker", href: "/tools/ai-overviews-tracker", description: "Track Google AI visibility" },
    { title: "LLM Readiness Score", href: "/tools/llm-readiness-score", description: "Check AI optimization" },
    { title: "Schema Generator", href: "/tools/schema-generator", description: "Create structured data" },
  ];

  return (
    <ToolLayout
      title="GEO Optimization Checker"
      description="Check your website's Generative Engine Optimization (GEO) score. Analyze how well your content is optimized for AI search engines."
      metaTitle="GEO Optimization Checker – Generative Engine Optimization Tool | Free"
      metaDescription="Free GEO optimization checker. Analyze your Generative Engine Optimization score, check AI search readiness, and get recommendations for GEO SEO."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SEO Content */}
        <div className="prose prose-slate max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">What is Generative Engine Optimization (GEO)?</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Generative Engine Optimization (GEO)</strong> is the practice of optimizing content and websites to appear in AI-generated search results. As search engines increasingly use AI to generate answers, traditional SEO alone is no longer sufficient.
          </p>
          <p className="text-muted-foreground mb-6">
            Our free <strong>GEO optimization checker</strong> analyzes your website's readiness for generative AI search, identifies areas for improvement, and provides actionable recommendations to boost your <strong>GEO score</strong>.
          </p>
        </div>

        {/* Tool Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              Check Your GEO Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your homepage or any page you want to analyze
              </p>
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing GEO Score...
                </>
              ) : (
                "Check GEO Optimization"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {results.overallScore !== undefined && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">GEO Optimization Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{url}</h3>
                      <p className="text-muted-foreground">Generative Engine Optimization Analysis</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${
                        results.overallScore >= 70 ? "text-green-600" :
                        results.overallScore >= 40 ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                        {results.overallScore}/100
                      </div>
                      <p className="text-sm text-muted-foreground">GEO Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {results.categories && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">GEO Factor Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.categories.map((category: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {category.score >= 70 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : category.score >= 40 ? (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge className={
                          category.score >= 70 ? "bg-green-100 text-green-800" :
                          category.score >= 40 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {category.score}/100
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {results.recommendations && results.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    GEO Improvement Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Badge className={
                        rec.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : rec.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }>
                        {rec.priority}
                      </Badge>
                      <p className="font-medium mt-2 mb-1">{rec.title}</p>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* SEO Content */}
        <div className="prose prose-slate max-w-none mt-12">
          <h2 className="text-2xl font-bold mb-4">Why GEO Matters for Modern SEO</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Generative Engine Optimization</strong> is becoming essential as AI transforms search:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>AI Overviews:</strong> Google now shows AI-generated summaries for many queries</li>
            <li><strong>AI Assistants:</strong> ChatGPT, Claude, and Perplexity are major traffic sources</li>
            <li><strong>Citation-based discovery:</strong> AI cites sources, changing how users find content</li>
            <li><strong>Answer engines:</strong> Users expect direct answers, not just links</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">Key GEO Ranking Factors</h2>
          <p className="text-muted-foreground mb-4">
            Our GEO checker analyzes these critical factors:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Content structure:</strong> Clear headings, lists, and organized information</li>
            <li><strong>Entity clarity:</strong> Well-defined topics, products, and concepts</li>
            <li><strong>Schema markup:</strong> Structured data that AI can parse</li>
            <li><strong>Authority signals:</strong> Citations, backlinks, and brand mentions</li>
            <li><strong>Answer format:</strong> Direct, quotable answers to user questions</li>
            <li><strong>Freshness:</strong> Up-to-date, regularly updated content</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">GEO vs Traditional SEO</h2>
          <p className="text-muted-foreground mb-4">
            While related, GEO and traditional SEO have key differences:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Traditional SEO:</strong> Focus on ranking links in search results</li>
            <li><strong>GEO:</strong> Focus on being cited in AI-generated answers</li>
            <li><strong>Traditional SEO:</strong> Keywords and backlinks are primary signals</li>
            <li><strong>GEO:</strong> Authority, clarity, and structure are primary signals</li>
            <li><strong>Both:</strong> Quality content and user value remain foundational</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">How to Improve Your GEO Score</h2>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Structure content clearly:</strong> Use headings, bullet points, and tables</li>
            <li><strong>Answer questions directly:</strong> Provide clear, quotable answers</li>
            <li><strong>Add schema markup:</strong> Help AI understand your content</li>
            <li><strong>Build topic authority:</strong> Create comprehensive content clusters</li>
            <li><strong>Earn citations:</strong> Get mentioned by authoritative sources</li>
          </ol>
        </div>

        {/* Internal Links */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-4">Related GEO Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/tools/llm-readiness-score" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">LLM Readiness</p>
              <p className="text-sm text-muted-foreground">Check AI optimization</p>
            </Link>
            <Link to="/tools/schema-generator" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Schema Generator</p>
              <p className="text-sm text-muted-foreground">Create structured data</p>
            </Link>
            <Link to="/blog/geo-optimization-guide" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Complete Guide</p>
              <p className="text-sm text-muted-foreground">GEO strategies</p>
            </Link>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default GEOOptimizationChecker;
