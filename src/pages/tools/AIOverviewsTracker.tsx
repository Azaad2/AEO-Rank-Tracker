import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolShareButtons from "@/components/tools/ToolShareButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, TrendingUp, Sparkles, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const AIOverviewsTracker = () => {
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
          industry: "Google AI Overviews & AI Mode", 
          products: keywords || "AI Overviews visibility tracking" 
        },
      });

      if (error) throw error;
      setResults(data);
      toast.success("AI Overviews analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const relatedTools = [
    { title: "Perplexity Rank Tracker", href: "/tools/perplexity-rank-tracker", description: "Track Perplexity rankings" },
    { title: "ChatGPT Mention Tracker", href: "/tools/chatgpt-mention-tracker", description: "Monitor ChatGPT mentions" },
    { title: "GEO Optimization Checker", href: "/tools/geo-optimization-checker", description: "Generative Engine Optimization" },
  ];

  return (
    <ToolLayout
      title="AI Overviews Tracker"
      description="Track your visibility in Google AI Overviews and AI Mode. Monitor how Google's AI features cite and reference your website."
      metaTitle="AI Overviews Tracker – Google AI Mode Rank Tracking | Free Tool"
      metaDescription="Free Google AI Overviews tracker. Monitor your visibility in Google AI Mode, track AI Overview citations, and optimize for Google's AI search features."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SEO Content */}
        <div className="prose prose-slate max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">What is Google AI Overviews Tracking?</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Google AI Overviews</strong> (formerly SGE - Search Generative Experience) and <strong>AI Mode</strong> are Google's AI-powered search features that provide synthesized answers at the top of search results. Tracking your visibility in these features is essential for modern SEO.
          </p>
          <p className="text-muted-foreground mb-6">
            Our free <strong>AI Overviews tracker</strong> helps you understand when Google's AI features cite your website, how prominently you're featured, and what you can do to improve your <strong>Google AI Mode visibility</strong>.
          </p>
        </div>

        {/* Tool Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Track Your AI Overviews Visibility
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
                placeholder="e.g., best project management software, how to..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter keywords where you want to appear in AI Overviews
              </p>
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing AI Overviews...
                </>
              ) : (
                "Track AI Overviews"
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
                    <BarChart className="h-5 w-5" />
                    AI Overviews Visibility Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{results.brandOverview.name}</h3>
                      <p className="text-muted-foreground">Google AI Overviews Analysis</p>
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
                    <Globe className="h-5 w-5" />
                    AI Overview Citation Opportunities
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Improve AI Overviews Visibility
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
          <h2 className="text-2xl font-bold mb-4">Understanding Google AI Overviews</h2>
          <p className="text-muted-foreground mb-4">
            Google AI Overviews appear at the top of search results for many queries, providing AI-generated summaries with citations. <strong>AI Mode</strong> is Google's more conversational AI search experience. Both features can significantly impact your organic traffic.
          </p>
          
          <h3 className="text-xl font-bold mb-3 mt-6">Key Features to Track:</h3>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Citation placement:</strong> Where your site appears in AI Overview sources</li>
            <li><strong>Query coverage:</strong> Which keywords trigger AI Overviews citing you</li>
            <li><strong>Competitor presence:</strong> Who else gets cited alongside you</li>
            <li><strong>Click-through impact:</strong> How AI Overviews affect your traffic</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">How to Rank in Google AI Overviews</h2>
          <p className="text-muted-foreground mb-4">
            Optimizing for <strong>Google AI Overviews</strong> requires a mix of traditional SEO and AI-specific strategies:
          </p>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Answer questions directly:</strong> Use clear, concise language that AI can easily extract</li>
            <li><strong>Structure content well:</strong> Use headings, lists, and tables that AI can parse</li>
            <li><strong>Build topical authority:</strong> Cover topics comprehensively across multiple pages</li>
            <li><strong>Earn quality backlinks:</strong> Authority signals matter for AI citations</li>
            <li><strong>Implement schema markup:</strong> Help Google understand your content</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">AI Overviews vs. Featured Snippets</h2>
          <p className="text-muted-foreground mb-4">
            While similar, AI Overviews and Featured Snippets have key differences:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>AI Overviews</strong> synthesize information from multiple sources</li>
            <li><strong>Featured Snippets</strong> extract content from a single source</li>
            <li><strong>AI Overviews</strong> include multiple citation links</li>
            <li><strong>Optimization strategies</strong> overlap but aren't identical</li>
          </ul>
        </div>

        {/* Share Buttons */}
        <ToolShareButtons 
          toolName="AI Overviews Tracker" 
          description="Monitor your visibility in Google AI Overviews and AI Mode."
        />

        {/* Internal Links */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-4">Related AI Visibility Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/tools/geo-optimization-checker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">GEO Checker</p>
              <p className="text-sm text-muted-foreground">Generative Engine Optimization</p>
            </Link>
            <Link to="/tools/perplexity-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Perplexity Tracker</p>
              <p className="text-sm text-muted-foreground">Track Perplexity visibility</p>
            </Link>
            <Link to="/blog/ai-overviews-tracking-guide" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Complete Guide</p>
              <p className="text-sm text-muted-foreground">AI Overviews strategies</p>
            </Link>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default AIOverviewsTracker;
