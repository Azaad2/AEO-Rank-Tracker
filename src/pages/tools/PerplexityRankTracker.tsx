import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolShareButtons from "@/components/tools/ToolShareButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, TrendingUp, CheckCircle, XCircle, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const PerplexityRankTracker = () => {
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
          industry: "Perplexity AI Search", 
          products: keywords || "general visibility tracking" 
        },
      });

      if (error) throw error;
      setResults(data);
      toast.success("Perplexity visibility analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const relatedTools = [
    { title: "ChatGPT Mention Tracker", href: "/tools/chatgpt-mention-tracker", description: "Track ChatGPT mentions" },
    { title: "Claude Rank Tracker", href: "/tools/claude-rank-tracker", description: "Monitor Claude AI visibility" },
    { title: "AI Visibility Checker", href: "/", description: "Full multi-platform scan" },
  ];

  return (
    <ToolLayout
      title="Perplexity Rank Tracker"
      description="Track how your brand and website rank in Perplexity AI search results. Monitor mentions, citations, and visibility in Perplexity's AI-powered answers."
      metaTitle="Perplexity Rank Tracker – Free AI Visibility Tool | Track Perplexity Rankings"
      metaDescription="Free Perplexity rank tracker tool. Monitor how your website appears in Perplexity AI search results. Track brand mentions, citations, and improve your Perplexity visibility."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SEO Content Section */}
        <div className="prose prose-slate max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">What is a Perplexity Rank Tracker?</h2>
          <p className="text-muted-foreground mb-4">
            A Perplexity rank tracker monitors how your brand, website, or content appears in <strong>Perplexity AI search results</strong>. Unlike traditional search engines, Perplexity uses AI to synthesize answers from multiple sources, making visibility tracking essential for modern SEO.
          </p>
          <p className="text-muted-foreground mb-6">
            With over 10 million monthly users, Perplexity has become a major traffic source. Our free <strong>Perplexity rank tracking tool</strong> helps you understand when Perplexity cites your website, mentions your brand, or recommends your products in its AI-generated responses.
          </p>
        </div>

        {/* Tool Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Track Your Perplexity Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="domain">Your Domain *</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="keywords">Target Keywords (optional)</Label>
              <Input
                id="keywords"
                placeholder="e.g., best CRM software, project management tools"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter keywords you want to track in Perplexity
              </p>
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Perplexity Visibility...
                </>
              ) : (
                "Track Perplexity Rankings"
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
                  <CardTitle className="text-lg">Perplexity Visibility Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{results.brandOverview.name}</h3>
                      <p className="text-muted-foreground">Perplexity AI Search Analysis</p>
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Perplexity Mention Opportunities
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

            {results.recommendations && results.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Improve Your Perplexity Rankings</CardTitle>
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

        {/* SEO Content - How It Works */}
        <div className="prose prose-slate max-w-none mt-12">
          <h2 className="text-2xl font-bold mb-4">How to Track Perplexity Rankings</h2>
          <p className="text-muted-foreground mb-4">
            Tracking your visibility in Perplexity AI requires a different approach than traditional SEO. Here's how our <strong>Perplexity rank tracker</strong> works:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Query Analysis:</strong> We identify the questions users ask Perplexity about your industry</li>
            <li><strong>Citation Tracking:</strong> Monitor when Perplexity cites your website as a source</li>
            <li><strong>Brand Mention Detection:</strong> Track direct mentions of your brand name</li>
            <li><strong>Competitor Comparison:</strong> See how you rank versus competitors</li>
            <li><strong>Optimization Recommendations:</strong> Get actionable tips to improve visibility</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">Why Perplexity SEO Matters</h2>
          <p className="text-muted-foreground mb-4">
            Perplexity AI is changing how people search for information. Unlike Google, Perplexity provides direct answers with citations. If your website isn't being cited, you're missing valuable traffic and credibility signals.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Perplexity users have <strong>high purchase intent</strong></li>
            <li>Citations build <strong>authority and trust</strong></li>
            <li>AI-first search is growing <strong>50% year-over-year</strong></li>
            <li>Early adopters gain <strong>competitive advantage</strong></li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">Optimize for Perplexity Visibility</h2>
          <p className="text-muted-foreground mb-4">
            To improve your Perplexity rankings, focus on these strategies:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Create <strong>comprehensive, authoritative content</strong> that answers user questions</li>
            <li>Use <strong>structured data and schema markup</strong> to help AI understand your content</li>
            <li>Build <strong>citations from authoritative sources</strong></li>
            <li>Ensure your <strong>technical SEO is optimized</strong> for AI crawlers</li>
            <li>Monitor and <strong>track your Perplexity visibility</strong> regularly</li>
          </ul>
        </div>

        {/* Share Buttons */}
        <ToolShareButtons 
          toolName="Perplexity Rank Tracker" 
          description="Track your visibility in Perplexity AI search results."
        />

        {/* Internal Links */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-4">Related AI Visibility Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/tools/chatgpt-mention-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">ChatGPT Tracker</p>
              <p className="text-sm text-muted-foreground">Monitor ChatGPT mentions</p>
            </Link>
            <Link to="/tools/claude-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Claude Tracker</p>
              <p className="text-sm text-muted-foreground">Track Claude AI visibility</p>
            </Link>
            <Link to="/blog/perplexity-rank-tracker-guide" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Complete Guide</p>
              <p className="text-sm text-muted-foreground">Perplexity SEO strategies</p>
            </Link>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default PerplexityRankTracker;
