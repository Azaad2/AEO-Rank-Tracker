import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolShareButtons from "@/components/tools/ToolShareButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, TrendingUp, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const ChatGPTMentionTracker = () => {
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!brandName.trim()) {
      toast.error("Please enter your brand name");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("monitor-brand", {
        body: { 
          brandName, 
          industry: industry || "ChatGPT Brand Monitoring", 
          products: "ChatGPT visibility tracking" 
        },
      });

      if (error) throw error;
      setResults(data);
      toast.success("ChatGPT mention analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const relatedTools = [
    { title: "Perplexity Rank Tracker", href: "/tools/perplexity-rank-tracker", description: "Track Perplexity visibility" },
    { title: "Claude Rank Tracker", href: "/tools/claude-rank-tracker", description: "Monitor Claude AI mentions" },
    { title: "Brand Monitor", href: "/tools/brand-monitor", description: "Multi-platform brand tracking" },
  ];

  return (
    <ToolLayout
      title="ChatGPT Mention Tracker"
      description="Track how ChatGPT mentions your brand. Monitor your visibility in ChatGPT responses and get recommendations to improve your AI presence."
      metaTitle="ChatGPT Mention Tracker – Track Brand Mentions in ChatGPT | Free Tool"
      metaDescription="Free ChatGPT mention tracker. Monitor how ChatGPT talks about your brand, track mentions, and optimize your content to appear in ChatGPT responses."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SEO Content Section */}
        <div className="prose prose-slate max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">What is ChatGPT Brand Mention Tracking?</h2>
          <p className="text-muted-foreground mb-4">
            <strong>ChatGPT mention tracking</strong> is the process of monitoring how OpenAI's ChatGPT references, recommends, or describes your brand in its responses. With over 100 million weekly active users, ChatGPT influences purchasing decisions, brand perception, and online reputation at scale.
          </p>
          <p className="text-muted-foreground mb-6">
            Our free <strong>ChatGPT mention tracker</strong> helps you understand when and how ChatGPT mentions your brand, identifies opportunities to improve your visibility, and provides actionable recommendations for <strong>ChatGPT brand monitoring</strong>.
          </p>
        </div>

        {/* Tool Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Track Your ChatGPT Mentions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="brand">Brand Name *</Label>
              <Input
                id="brand"
                placeholder="Your brand or company name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry (optional)</Label>
              <Input
                id="industry"
                placeholder="e.g., SaaS, E-commerce, Finance"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing ChatGPT Mentions...
                </>
              ) : (
                "Track ChatGPT Mentions"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Display */}
        {results && (
          <div className="space-y-6">
            {results.brandOverview && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">ChatGPT Visibility Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{results.brandOverview.name}</h3>
                      <p className="text-muted-foreground">ChatGPT Brand Analysis</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {results.brandOverview.aiPresenceScore}/100
                      </div>
                      <p className="text-sm text-muted-foreground">AI Presence Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {results.likelyMentions && results.likelyMentions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Where ChatGPT Mentions You
                  </CardTitle>
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

            {results.sentimentPrediction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ChatGPT Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold mb-3 capitalize ${
                    results.sentimentPrediction.overall === "positive" ? "text-green-600" :
                    results.sentimentPrediction.overall === "negative" ? "text-red-600" :
                    "text-gray-600"
                  }`}>
                    {results.sentimentPrediction.overall}
                  </div>
                  <div className="space-y-1">
                    {results.sentimentPrediction.factors?.map((factor: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground">• {factor}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {results.recommendations && results.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Improve Your ChatGPT Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          rec.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : rec.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }>
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{rec.action}</p>
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
          <h2 className="text-2xl font-bold mb-4">Why Track ChatGPT Brand Mentions?</h2>
          <p className="text-muted-foreground mb-4">
            ChatGPT has become a primary research tool for millions of users. When someone asks ChatGPT for product recommendations, comparisons, or brand information, what it says about your brand matters:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Reputation Management:</strong> Know when ChatGPT spreads inaccurate information about your brand</li>
            <li><strong>Competitive Intelligence:</strong> See how you're positioned against competitors</li>
            <li><strong>Content Strategy:</strong> Identify gaps in your content that affect AI visibility</li>
            <li><strong>Lead Generation:</strong> Capture traffic from ChatGPT recommendations</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">How to Get Mentioned in ChatGPT</h2>
          <p className="text-muted-foreground mb-4">
            Improving your <strong>ChatGPT brand visibility</strong> requires optimizing your online presence:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Create authoritative content:</strong> Publish comprehensive guides and resources</li>
            <li><strong>Build quality backlinks:</strong> Earn citations from trusted sources</li>
            <li><strong>Optimize for entities:</strong> Use schema markup and clear brand information</li>
            <li><strong>Maintain consistency:</strong> Keep brand information accurate across all platforms</li>
            <li><strong>Monitor regularly:</strong> Track mentions and adjust strategy accordingly</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">ChatGPT Brand Monitoring Best Practices</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Track mentions <strong>weekly</strong> to catch issues early</li>
            <li>Monitor <strong>competitor mentions</strong> alongside your own</li>
            <li>Document changes in how ChatGPT describes your brand over time</li>
            <li>Use insights to <strong>inform content strategy</strong></li>
            <li>Address inaccuracies by updating authoritative sources</li>
          </ul>
        </div>

        {/* Share Buttons */}
        <ToolShareButtons 
          toolName="ChatGPT Mention Tracker" 
          description="Monitor how ChatGPT talks about your brand."
        />

        {/* Internal Links */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-4">Related AI Visibility Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/tools/perplexity-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Perplexity Tracker</p>
              <p className="text-sm text-muted-foreground">Track Perplexity rankings</p>
            </Link>
            <Link to="/tools/ai-overviews-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">AI Overviews Tracker</p>
              <p className="text-sm text-muted-foreground">Monitor Google AI Mode</p>
            </Link>
            <Link to="/blog/chatgpt-mention-tracking-guide" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Complete Guide</p>
              <p className="text-sm text-muted-foreground">ChatGPT SEO strategies</p>
            </Link>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default ChatGPTMentionTracker;
