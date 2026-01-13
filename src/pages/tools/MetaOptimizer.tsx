import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, Search, Check, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Analysis {
  length: number;
  maxLength: number;
  isTruncated: boolean;
  hasKeyword?: boolean;
  hasCallToAction?: boolean;
  rating: string;
  improvements?: string[];
}

interface MetaResult {
  optimizedTitle: string;
  optimizedDescription: string;
  titleAnalysis: Analysis;
  descriptionAnalysis: Analysis;
  alternativeTitles: string[];
  alternativeDescriptions: string[];
  ogTags: {
    ogTitle: string;
    ogDescription: string;
  };
}

const MetaOptimizer = () => {
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentDescription, setCurrentDescription] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<MetaResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!currentTitle && !pageContent) {
      toast.error("Please enter a title or page content");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-meta", {
        body: { currentTitle, currentDescription, pageContent, targetKeyword },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Meta tags optimized!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to optimize. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRatingColor = (rating: string) => {
    if (rating === "good" || rating === "excellent") return "text-green-600";
    if (rating === "needs-improvement") return "text-yellow-600";
    return "text-red-600";
  };

  const relatedTools = [
    { title: "Title Generator", href: "/tools/title-generator", description: "Generate SEO titles" },
    { title: "Description Generator", href: "/tools/description-generator", description: "Create meta descriptions" },
    { title: "SERP Previewer", href: "/tools/serp-previewer", description: "Preview search appearance" },
  ];

  return (
    <ToolLayout
      title="Meta Tag Optimizer"
      description="Analyze and optimize your meta tags for better search engine visibility and AI discoverability."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Optimize Meta Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Current Title</Label>
                <Input
                  id="title"
                  placeholder="Your current page title"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {currentTitle.length}/60 characters
                </p>
              </div>
              <div>
                <Label htmlFor="keyword">Target Keyword</Label>
                <Input
                  id="keyword"
                  placeholder="Main keyword to target"
                  value={targetKeyword}
                  onChange={(e) => setTargetKeyword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Current Meta Description</Label>
              <Textarea
                id="description"
                placeholder="Your current meta description"
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {currentDescription.length}/160 characters
              </p>
            </div>
            <div>
              <Label htmlFor="content">Page Content (Optional)</Label>
              <Textarea
                id="content"
                placeholder="Paste your page content for better optimization suggestions..."
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                "Optimize Meta Tags"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Optimized Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Optimized Title</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.optimizedTitle, "title")}
                    >
                      {copiedField === "title" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{result.optimizedTitle}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Length: {result.titleAnalysis?.length || 0}/{result.titleAnalysis?.maxLength || 60}</span>
                      <span className={getRatingColor(result.titleAnalysis?.rating || "")}>
                        {result.titleAnalysis?.rating}
                      </span>
                    </div>
                    <Progress value={((result.titleAnalysis?.length || 0) / (result.titleAnalysis?.maxLength || 60)) * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Optimized Description</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.optimizedDescription, "desc")}
                    >
                      {copiedField === "desc" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.optimizedDescription}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Length: {result.descriptionAnalysis?.length || 0}/{result.descriptionAnalysis?.maxLength || 160}</span>
                      <span className={getRatingColor(result.descriptionAnalysis?.rating || "")}>
                        {result.descriptionAnalysis?.rating}
                      </span>
                    </div>
                    <Progress value={((result.descriptionAnalysis?.length || 0) / (result.descriptionAnalysis?.maxLength || 160)) * 100} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Title Analysis</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {result.titleAnalysis?.hasKeyword ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>Keyword included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!result.titleAnalysis?.isTruncated ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>Length within limits</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Description Analysis</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {result.descriptionAnalysis?.hasKeyword ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>Keyword included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.descriptionAnalysis?.hasCallToAction ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>Has call-to-action</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternatives */}
            {result.alternativeTitles && result.alternativeTitles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alternative Titles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.alternativeTitles.map((title, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{title}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(title, `alt-title-${i}`)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* OG Tags */}
            {result.ogTags && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Open Graph Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded">
                    <code className="text-sm">
                      {`<meta property="og:title" content="${result.ogTags.ogTitle}" />`}
                    </code>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <code className="text-sm">
                      {`<meta property="og:description" content="${result.ogTags.ogDescription}" />`}
                    </code>
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

export default MetaOptimizer;
