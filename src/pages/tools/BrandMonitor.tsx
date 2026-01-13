import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Radio, TrendingUp, MessageSquare, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LikelyMention {
  queryType: string;
  exampleQuery: string;
  mentionLikelihood: string;
  context: string;
}

interface Recommendation {
  action: string;
  priority: string;
  expectedImpact: string;
}

interface BrandResult {
  brandOverview: {
    name: string;
    industry: string;
    aiPresenceScore: number;
  };
  likelyMentions: LikelyMention[];
  sentimentPrediction: {
    overall: string;
    factors: string[];
  };
  brandAssociations: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  competitorMentions: string[];
  recommendations: Recommendation[];
  monitoringQueries: string[];
}

const BrandMonitor = () => {
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [products, setProducts] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<BrandResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!brandName.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("monitor-brand", {
        body: { brandName, industry, products },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Brand analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze brand. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyQuery = async (query: string, index: number) => {
    await navigator.clipboard.writeText(query);
    setCopiedIndex(index);
    toast.success("Copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getLikelihoodColor = (likelihood: string) => {
    if (likelihood === "high") return "bg-green-100 text-green-800";
    if (likelihood === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === "positive") return "text-green-600";
    if (sentiment === "negative") return "text-red-600";
    return "text-gray-600";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-800";
    if (priority === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const relatedTools = [
    { title: "Competitor Analyzer", href: "/tools/competitor-analyzer", description: "Compare with competitors" },
    { title: "LLM Readiness Score", href: "/tools/llm-readiness-score", description: "Check AI optimization" },
    { title: "Content Auditor", href: "/tools/content-auditor", description: "Audit content for AI" },
  ];

  return (
    <ToolLayout
      title="AI Brand Monitor"
      description="Discover how and where your brand appears in AI responses and get recommendations to improve visibility."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Monitor Your Brand in AI
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., SaaS, E-commerce, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="products">Key Products/Services</Label>
                <Input
                  id="products"
                  placeholder="e.g., CRM software, Marketing automation"
                  value={products}
                  onChange={(e) => setProducts(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Brand...
                </>
              ) : (
                "Analyze Brand Visibility"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Overview */}
            {result.brandOverview && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">Brand Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{result.brandOverview.name}</h3>
                      <p className="text-muted-foreground">{result.brandOverview.industry}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {result.brandOverview.aiPresenceScore}
                      </div>
                      <p className="text-sm text-muted-foreground">AI Presence Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Likely Mentions */}
            {result.likelyMentions && result.likelyMentions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Where Your Brand Might Appear
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.likelyMentions.map((mention, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{mention.queryType}</Badge>
                        <Badge className={getLikelihoodColor(mention.mentionLikelihood)}>
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

            {/* Sentiment & Associations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.sentimentPrediction && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sentiment Prediction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold mb-3 capitalize ${getSentimentColor(result.sentimentPrediction.overall)}`}>
                      {result.sentimentPrediction.overall}
                    </div>
                    <div className="space-y-1">
                      {result.sentimentPrediction.factors?.map((factor, i) => (
                        <p key={i} className="text-sm text-muted-foreground">• {factor}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.brandAssociations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Brand Associations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.brandAssociations.positive?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">Positive</p>
                        <div className="flex flex-wrap gap-1">
                          {result.brandAssociations.positive.map((a, i) => (
                            <Badge key={i} className="bg-green-100 text-green-800">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.brandAssociations.negative?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-1">Negative</p>
                        <div className="flex flex-wrap gap-1">
                          {result.brandAssociations.negative.map((a, i) => (
                            <Badge key={i} className="bg-red-100 text-red-800">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.brandAssociations.neutral?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Neutral</p>
                        <div className="flex flex-wrap gap-1">
                          {result.brandAssociations.neutral.map((a, i) => (
                            <Badge key={i} variant="secondary">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                      </div>
                      <p className="font-medium mb-1">{rec.action}</p>
                      <p className="text-sm text-muted-foreground">{rec.expectedImpact}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Monitoring Queries */}
            {result.monitoringQueries && result.monitoringQueries.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Queries to Monitor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.monitoringQueries.map((query, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-background rounded">
                      <span className="text-sm">"{query}"</span>
                      <Button variant="ghost" size="sm" onClick={() => copyQuery(query, i)}>
                        {copiedIndex === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Competitor Mentions */}
            {result.competitorMentions && result.competitorMentions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Often Mentioned Alongside</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.competitorMentions.map((comp, i) => (
                      <Badge key={i} variant="outline">{comp}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default BrandMonitor;
