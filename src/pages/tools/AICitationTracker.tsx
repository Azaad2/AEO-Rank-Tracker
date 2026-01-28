import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import ToolShareButtons from "@/components/tools/ToolShareButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Link as LinkIcon, TrendingUp, BarChart3, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const AICitationTracker = () => {
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
          industry: industry || "AI Citation Analysis", 
          products: "Citation tracking across AI platforms" 
        },
      });

      if (error) throw error;
      setResults(data);
      toast.success("Citation analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const relatedTools = [
    { title: "Perplexity Rank Tracker", href: "/tools/perplexity-rank-tracker", description: "Track Perplexity citations" },
    { title: "AI Overviews Tracker", href: "/tools/ai-overviews-tracker", description: "Monitor Google AI citations" },
    { title: "LLM Rank Tracker", href: "/tools/llm-rank-tracker", description: "Track all AI platforms" },
  ];

  return (
    <ToolLayout
      title="AI Citation Tracker"
      description="Track when and how AI assistants cite your website as a source. Monitor your citation frequency across ChatGPT, Perplexity, and Google AI."
      metaTitle="AI Citation Tracker – Track When AI Cites Your Website | Free Tool"
      metaDescription="Free AI citation tracker. Monitor how often AI assistants like Perplexity and ChatGPT cite your website as a source. Improve your AI citation rate."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* SEO Content */}
        <div className="prose prose-slate max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">What is AI Citation Tracking?</h2>
          <p className="text-muted-foreground mb-4">
            <strong>AI citation tracking</strong> monitors when AI assistants link to your website as a source in their responses. Unlike simple mentions, citations include actual links that drive traffic to your site.
          </p>
          <p className="text-muted-foreground mb-6">
            Our free <strong>AI citation tracker</strong> helps you understand your citation frequency across major AI platforms, identify which content gets cited most, and optimize for more <strong>AI-driven referral traffic</strong>.
          </p>
        </div>

        {/* Tool Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Track Your AI Citations
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
              <Label htmlFor="industry">Industry (optional)</Label>
              <Input
                id="industry"
                placeholder="e.g., Technology, Healthcare, Finance"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing AI Citations...
                </>
              ) : (
                "Track AI Citations"
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
                    AI Citation Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{results.brandOverview.name}</h3>
                      <p className="text-muted-foreground">Citation Analysis</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {results.brandOverview.aiPresenceScore}/100
                      </div>
                      <p className="text-sm text-muted-foreground">Citation Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Citation Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Citation Sources by Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg text-center">
                    <p className="font-medium">Perplexity</p>
                    <p className="text-sm text-muted-foreground">Most likely to cite</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="font-medium">Google AI</p>
                    <p className="text-sm text-muted-foreground">AI Overviews</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <p className="font-medium">ChatGPT</p>
                    <p className="text-sm text-muted-foreground">Browse mode only</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Use our <Link to="/" className="text-primary hover:underline">full AI Visibility Checker</Link> for detailed citation analysis
                </p>
              </CardContent>
            </Card>

            {results.likelyMentions && results.likelyMentions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Citation Opportunities</CardTitle>
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
                          {mention.mentionLikelihood} citation likelihood
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
                    Increase Your AI Citations
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
          <h2 className="text-2xl font-bold mb-4">Why AI Citations Matter</h2>
          <p className="text-muted-foreground mb-4">
            <strong>AI citations</strong> are becoming a critical traffic source:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Direct traffic:</strong> Citations include clickable links to your site</li>
            <li><strong>Authority building:</strong> Being cited signals trustworthiness</li>
            <li><strong>High-intent visitors:</strong> Users clicking AI citations are often ready to act</li>
            <li><strong>Competitive advantage:</strong> Most sites don't optimize for AI citations yet</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">Which AI Platforms Cite Sources?</h2>
          <p className="text-muted-foreground mb-4">
            Not all AI platforms handle citations the same way:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Perplexity:</strong> Always cites sources with clickable links</li>
            <li><strong>Google AI Overviews:</strong> Includes source citations below summaries</li>
            <li><strong>ChatGPT Browse:</strong> Cites sources when using browse mode</li>
            <li><strong>Claude:</strong> Can cite but doesn't include live links</li>
            <li><strong>Copilot:</strong> Cites Bing search results</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4 mt-8">How to Get More AI Citations</h2>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li><strong>Create authoritative content:</strong> AI prefers citing trusted sources</li>
            <li><strong>Include unique data:</strong> Original research and statistics get cited more</li>
            <li><strong>Structure for extraction:</strong> Clear facts are easier to cite</li>
            <li><strong>Update regularly:</strong> Fresh content gets priority</li>
            <li><strong>Build domain authority:</strong> Strong backlink profiles improve citation rates</li>
          </ol>

          <h2 className="text-2xl font-bold mb-4 mt-8">Citations vs. Mentions</h2>
          <p className="text-muted-foreground mb-4">
            Understanding the difference is crucial for your strategy:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><strong>Mentions:</strong> AI references your brand without a link</li>
            <li><strong>Citations:</strong> AI includes a clickable link to your content</li>
            <li><strong>Impact:</strong> Citations drive direct traffic; mentions build awareness</li>
            <li><strong>Optimization:</strong> Both require different but overlapping strategies</li>
          </ul>
        </div>

        {/* Share Buttons */}
        <ToolShareButtons 
          toolName="AI Citation Tracker" 
          description="Track when AI assistants cite your website as a source."
        />

        {/* Internal Links */}
        <div className="bg-muted/30 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-4">Related Citation Tools</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/tools/perplexity-rank-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Perplexity Tracker</p>
              <p className="text-sm text-muted-foreground">Best for citations</p>
            </Link>
            <Link to="/tools/ai-overviews-tracker" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">AI Overviews</p>
              <p className="text-sm text-muted-foreground">Google citations</p>
            </Link>
            <Link to="/blog/ai-citation-tracking-guide" className="p-3 bg-background rounded border hover:border-primary transition-colors">
              <p className="font-medium">Complete Guide</p>
              <p className="text-sm text-muted-foreground">Citation strategies</p>
            </Link>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default AICitationTracker;
