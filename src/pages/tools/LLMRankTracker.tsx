import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolShareButtons from "@/components/tools/ToolShareButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Layers, TrendingUp, BarChart3, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const LLMRankTracker = () => {
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      toast.error("Please enter your domain");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("monitor-brand", {
        body: { 
          brandName: domain, 
          industry: industry || "LLM SEO Visibility", 
          products: "Multi-platform LLM rank tracking" 
        },
      });

      if (error) throw error;
      setResults(data);
      toast.success("LLM visibility analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const relatedTools = [
    { title: "ChatGPT Mention Tracker", href: "/tools/chatgpt-mention-tracker", description: "Track ChatGPT visibility" },
    { title: "Perplexity Rank Tracker", href: "/tools/perplexity-rank-tracker", description: "Monitor Perplexity rankings" },
    { title: "AI Visibility Checker", href: "/", description: "Full multi-platform scan" },
  ];

  return (
    <ToolLayout
      title="LLM Rank Tracker"
      description="Track your visibility across all major LLMs. Monitor how ChatGPT, Claude, Gemini, Perplexity, and other AI models mention your brand."
      metaTitle="LLM Rank Tracker – Track Visibility Across All AI Models | Free Tool"
      metaDescription="Free LLM rank tracker. Monitor your visibility across ChatGPT, Claude, Gemini, Perplexity, and other large language models. Comprehensive LLM SEO tool."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SEO Content */}
        <div className="prose prose-slate max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">What is LLM Rank Tracking?</h2>
          <p className="text-muted-foreground mb-4">
            <strong>LLM rank tracking</strong> monitors your visibility across all major Large Language Models (LLMs) including ChatGPT, Claude, Gemini, Perplexity, Copilot, and more. As AI assistants become primary information sources, tracking your presence across multiple platforms is essential.
          </p>
          <p className="text-muted-foreground mb-6">
            Our free <strong>LLM rank tracker</strong> provides a unified view of your AI visibility, helping you understand which platforms mention you most, identify gaps, and develop a comprehensive <strong>LLM SEO strategy</strong>.
          </p>
        </div>

        {/* Tool Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Track Your LLM Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="domain">Your Domain or Brand *</Label>
              <Input
                id="domain"
                placeholder="example.com or Brand Name"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry (optional)</Label>
              <Input
                id="industry"
                placeholder="e.g., SaaS, Healthcare, Finance"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing LLM Visibility...
                </>
              ) : (
                "Track LLM Rankings"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {results.brandOverview && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Overall LLM Visibility Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{results.brandOverview.name}</h3>
                      <p className="text-muted-foreground">Multi-LLM Analysis</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {results.brandOverview.aiPresenceScore}/100
                      </div>
                      <p className="text-sm text-muted-foreground">Visibility Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platform Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  LLM Platform Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 border rounded-lg text-center">
                    <p className="font-medium">ChatGPT</p>
                    <p className="text-2xl font-bold text-primary">--</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="font-medium">Claude</p>
                    <p className="text-2xl font-bold text-primary">--</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="font-medium">Perplexity</p>
                    <p className="text-2xl font-bold text-primary">--</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="font-medium">Gemini</p>
                    <p className="text-2xl font-bold text-primary">--</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Use our <Link to="/" className="text-primary hover:underline">full AI Visibility Checker</Link> for detailed platform-by-platform analysis
                </p>
              </CardContent>
            </Card>

            {results.likelyMentions && results.likelyMentions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">LLM Mention Opportunities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.likelyMentions.map((mention: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{mention.queryType}</Badge>
                        <Badge className={
                          mention.mentionLikelihood === "high" 
                            ? "bg-green-100 text-green-800" 
                            : mention.mentionLikelihood === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }>
                          {mention.mentionLikelihood} likelihood
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">"{mention.exampleQuery}"</p>
                      <p className="text-sm text-muted-foreground">{mention.context}</p>
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
                    Improve LLM Visibility
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
                      <p className="font-medium mt-2 mb-1">{rec.action}</p>
                      <p className="text-sm text-muted-foreground">{rec.expectedImpact}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* SEO Content */}
        <div className="prose prose-slate max-w-none mt-12">
          <h2 className="text-2xl font-bold mb-4">Why Track LLM Rankings Across All Platforms?</h2>
          <p className="text-muted-foreground mb-4">
            Different LLMs have different training data, knowledge cutoffs, and source preferences. Tracking across all major platforms helps you:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Identify platform gaps:</strong> See where you're visible vs. invisible</li>
            <li><strong>Prioritize optimization:</strong> Focus efforts on platforms with most potential</li>
            <li><strong>Monitor competitors:</strong> Track competitive positioning across LLMs</li>
            <li><strong>Measure progress:</strong> Track improvements over time</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">Major LLMs to Track</h2>
          <p className="text-muted-foreground mb-4">
            Your <strong>LLM SEO strategy</strong> should cover these major platforms:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>ChatGPT (OpenAI):</strong> Largest user base, 100M+ weekly active users</li>
            <li><strong>Claude (Anthropic):</strong> Growing rapidly, known for accuracy</li>
            <li><strong>Gemini (Google):</strong> Integrated with Google Search and services</li>
            <li><strong>Perplexity:</strong> Search-focused AI with real-time information</li>
            <li><strong>Copilot (Microsoft):</strong> Integrated across Microsoft ecosystem</li>
            <li><strong>Grok (xAI):</strong> Integrated with X/Twitter</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">LLM SEO Best Practices</h2>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Create authoritative content:</strong> All LLMs favor comprehensive, accurate information</li>
            <li><strong>Use structured data:</strong> Schema markup helps AI understand your content</li>
            <li><strong>Build citations:</strong> Earn mentions from trusted sources</li>
            <li><strong>Maintain consistency:</strong> Keep brand information accurate everywhere</li>
            <li><strong>Monitor regularly:</strong> Track visibility changes weekly</li>
          </ol>
        </div>

        {/* Share Buttons */}
        <ToolShareButtons 
          toolName="LLM Rank Tracker" 
          description="Track your visibility across all major AI models."
        />

        {/* Internal Links */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-4">Platform-Specific Trackers</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <Link to="/tools/chatgpt-mention-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">ChatGPT</p>
              <p className="text-sm text-muted-foreground">Track mentions</p>
            </Link>
            <Link to="/tools/claude-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Claude</p>
              <p className="text-sm text-muted-foreground">Track visibility</p>
            </Link>
            <Link to="/tools/perplexity-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Perplexity</p>
              <p className="text-sm text-muted-foreground">Track rankings</p>
            </Link>
            <Link to="/tools/copilot-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Copilot</p>
              <p className="text-sm text-muted-foreground">Track presence</p>
            </Link>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default LLMRankTracker;
