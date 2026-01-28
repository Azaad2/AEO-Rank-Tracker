import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolShareButtons from "@/components/tools/ToolShareButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Cpu, TrendingUp, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const CopilotRankTracker = () => {
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
          industry: "Microsoft Copilot AI Search", 
          products: keywords || "Copilot visibility tracking" 
        },
      });

      if (error) throw error;
      setResults(data);
      toast.success("Copilot visibility analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const relatedTools = [
    { title: "ChatGPT Mention Tracker", href: "/tools/chatgpt-mention-tracker", description: "Track ChatGPT mentions" },
    { title: "Claude Rank Tracker", href: "/tools/claude-rank-tracker", description: "Monitor Claude visibility" },
    { title: "LLM Rank Tracker", href: "/tools/llm-rank-tracker", description: "Track all AI platforms" },
  ];

  return (
    <ToolLayout
      title="Copilot Rank Tracker"
      description="Track your visibility in Microsoft Copilot. Monitor how Copilot AI mentions and recommends your brand across Microsoft's AI ecosystem."
      metaTitle="Copilot Rank Tracker – Microsoft Copilot SEO Tool | Free Visibility Tracker"
      metaDescription="Free Microsoft Copilot rank tracker. Monitor your visibility in Copilot AI, track brand mentions in Bing Chat, and optimize for Copilot SEO."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SEO Content */}
        <div className="prose prose-slate max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">What is Microsoft Copilot Rank Tracking?</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Microsoft Copilot rank tracking</strong> monitors how Microsoft's AI assistant mentions, cites, and recommends your brand. Copilot is integrated into Bing, Windows, Microsoft 365, and Edge, reaching hundreds of millions of users.
          </p>
          <p className="text-muted-foreground mb-6">
            Our free <strong>Copilot rank tracker</strong> helps you understand your visibility across Microsoft's AI ecosystem, identify opportunities for improvement, and optimize your <strong>Copilot SEO</strong> strategy.
          </p>
        </div>

        {/* Tool Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Track Your Copilot Rankings
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
                placeholder="e.g., enterprise software, cloud solutions"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Copilot Visibility...
                </>
              ) : (
                "Track Copilot Rankings"
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
                    Copilot Visibility Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{results.brandOverview.name}</h3>
                      <p className="text-muted-foreground">Microsoft Copilot Analysis</p>
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
                  <CardTitle className="text-lg">Copilot Mention Opportunities</CardTitle>
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
                    Improve Copilot Visibility
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
          <h2 className="text-2xl font-bold mb-4">Why Track Microsoft Copilot Rankings?</h2>
          <p className="text-muted-foreground mb-4">
            Microsoft Copilot is integrated across the entire Microsoft ecosystem, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Bing Search:</strong> AI-powered search results with Copilot integration</li>
            <li><strong>Microsoft Edge:</strong> Built-in Copilot sidebar for browsing assistance</li>
            <li><strong>Windows 11:</strong> System-level AI assistant</li>
            <li><strong>Microsoft 365:</strong> AI across Word, Excel, PowerPoint, and more</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">How to Optimize for Copilot SEO</h2>
          <p className="text-muted-foreground mb-4">
            Improving your <strong>Microsoft Copilot visibility</strong> requires understanding its unique characteristics:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Bing optimization:</strong> Copilot relies heavily on Bing's index</li>
            <li><strong>Structured data:</strong> Use schema markup for clear entity identification</li>
            <li><strong>Authority signals:</strong> Build quality backlinks and brand mentions</li>
            <li><strong>Content quality:</strong> Create comprehensive, accurate content</li>
            <li><strong>Regular monitoring:</strong> Track visibility changes over time</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">Copilot vs. Other AI Assistants</h2>
          <p className="text-muted-foreground mb-4">
            Understanding Copilot's unique positioning helps optimize your strategy:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Bing integration:</strong> Different index than Google-based AI tools</li>
            <li><strong>Enterprise focus:</strong> Strong presence in business environments</li>
            <li><strong>Real-time search:</strong> Access to current web information</li>
            <li><strong>Productivity context:</strong> Users often seek work-related information</li>
          </ul>
        </div>

        {/* Share Buttons */}
        <ToolShareButtons 
          toolName="Copilot Rank Tracker" 
          description="Track your visibility in Microsoft Copilot AI."
        />

        {/* Internal Links */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-4">Related AI Visibility Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/tools/chatgpt-mention-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">ChatGPT Tracker</p>
              <p className="text-sm text-muted-foreground">Monitor ChatGPT mentions</p>
            </Link>
            <Link to="/tools/llm-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">LLM Tracker</p>
              <p className="text-sm text-muted-foreground">Track all AI platforms</p>
            </Link>
            <Link to="/blog/copilot-seo-tracking-guide" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Complete Guide</p>
              <p className="text-sm text-muted-foreground">Copilot SEO strategies</p>
            </Link>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default CopilotRankTracker;
