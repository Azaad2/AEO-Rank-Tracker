import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Bot, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const ClaudeRankTracker = () => {
  const [domain, setDomain] = useState("");
  const [keywords, setKeywords] = useState("");
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
          industry: "Claude AI Search Visibility", 
          products: keywords || "Claude rank tracking" 
        },
      });

      if (error) throw error;
      setResults(data);
      toast.success("Claude visibility analysis complete!");
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
    { title: "LLM Rank Tracker", href: "/tools/llm-rank-tracker", description: "Track all AI platforms" },
  ];

  return (
    <ToolLayout
      title="Claude Rank Tracker"
      description="Track your visibility in Anthropic's Claude AI. Monitor how Claude mentions and recommends your brand in its responses."
      metaTitle="Claude Rank Tracker – Track Claude AI Visibility | Free SEO Tool"
      metaDescription="Free Claude rank tracker. Monitor how Claude AI mentions your brand, track visibility in Claude responses, and optimize for Claude SEO."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SEO Content */}
        <div className="prose prose-slate max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">What is Claude Rank Tracking?</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Claude rank tracking</strong> monitors how Anthropic's Claude AI assistant mentions, recommends, and describes your brand or website. As Claude becomes increasingly popular for research and decision-making, understanding your visibility in Claude's responses is crucial for modern SEO.
          </p>
          <p className="text-muted-foreground mb-6">
            Our free <strong>Claude rank tracker</strong> analyzes your presence in Claude AI responses, identifies opportunities for improvement, and provides actionable recommendations to boost your <strong>Claude AI visibility</strong>.
          </p>
        </div>

        {/* Tool Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Track Your Claude AI Rankings
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
              <Label htmlFor="keywords">Target Keywords (optional)</Label>
              <Input
                id="keywords"
                placeholder="e.g., AI tools, productivity software"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Claude Visibility...
                </>
              ) : (
                "Track Claude Rankings"
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
                    Claude Visibility Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{results.brandOverview.name}</h3>
                      <p className="text-muted-foreground">Claude AI Analysis</p>
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

            {results.likelyMentions && results.likelyMentions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Claude Mention Opportunities</CardTitle>
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
                    Recommendations for Claude Visibility
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
          <h2 className="text-2xl font-bold mb-4">Why Track Claude AI Rankings?</h2>
          <p className="text-muted-foreground mb-4">
            Claude is one of the fastest-growing AI assistants, known for its accuracy and nuanced responses. Tracking your <strong>Claude AI rankings</strong> helps you:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Understand how Claude represents your brand to users</li>
            <li>Identify opportunities to improve visibility</li>
            <li>Monitor competitor presence in Claude responses</li>
            <li>Ensure accurate brand information in AI outputs</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">How to Optimize for Claude AI</h2>
          <p className="text-muted-foreground mb-4">
            Claude AI draws from various sources to generate responses. To improve your <strong>Claude SEO</strong>:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Create comprehensive content:</strong> Claude values depth and accuracy</li>
            <li><strong>Use clear structure:</strong> Headings, lists, and organized content help AI parsing</li>
            <li><strong>Build authority:</strong> Earn mentions from trusted industry sources</li>
            <li><strong>Keep information current:</strong> Update content regularly</li>
            <li><strong>Implement schema markup:</strong> Help AI understand your content</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">Claude vs. ChatGPT: Key Differences</h2>
          <p className="text-muted-foreground mb-4">
            While both are major AI assistants, they have different characteristics:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Training data:</strong> Claude may have different source priorities</li>
            <li><strong>Response style:</strong> Claude tends to be more cautious and nuanced</li>
            <li><strong>Update frequency:</strong> Different knowledge cutoff dates</li>
            <li><strong>User base:</strong> Different demographics use each platform</li>
          </ul>
        </div>

        {/* Internal Links */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-4">Related AI Visibility Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/tools/chatgpt-mention-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">ChatGPT Tracker</p>
              <p className="text-sm text-muted-foreground">Track ChatGPT mentions</p>
            </Link>
            <Link to="/tools/copilot-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Copilot Tracker</p>
              <p className="text-sm text-muted-foreground">Monitor Microsoft Copilot</p>
            </Link>
            <Link to="/blog/claude-rank-tracker-guide" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Complete Guide</p>
              <p className="text-sm text-muted-foreground">Claude SEO strategies</p>
            </Link>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default ClaudeRankTracker;
