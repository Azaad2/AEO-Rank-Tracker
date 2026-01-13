import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, CheckCircle, AlertCircle, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SERPResult {
  preview: {
    displayTitle: string;
    displayDescription: string;
    displayUrl: string;
  };
  analysis: {
    title: { length: number; maxLength: number; isTruncated: boolean; hasKeywords: boolean; rating: string };
    description: { length: number; maxLength: number; isTruncated: boolean; hasCallToAction: boolean; rating: string };
    url: { isClean: boolean; hasKeywords: boolean; rating: string };
  };
  suggestions: string[];
  ctrPrediction: { score: string; factors: string[] };
  aiAppearance: string;
}

const SERPPreviewer = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<SERPResult | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("preview-serp", {
        body: { title, description, url },
      });

      if (error) throw error;
      setResult(data);
      toast.success("SERP preview generated!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate preview. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getRatingColor = (rating: string) => {
    if (rating === "good" || rating === "excellent") return "text-green-600";
    if (rating === "needs-improvement" || rating === "fair") return "text-yellow-600";
    return "text-red-600";
  };

  const relatedTools = [
    { title: "Title Generator", href: "/tools/title-generator", description: "Generate SEO titles" },
    { title: "Description Generator", href: "/tools/description-generator", description: "Create meta descriptions" },
    { title: "Meta Optimizer", href: "/tools/meta-optimizer", description: "Optimize meta tags" },
  ];

  return (
    <ToolLayout
      title="SERP Previewer"
      description="See how your page will appear in search results and AI responses before publishing."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Preview Your SERP Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Page Title *</Label>
              <Input
                id="title"
                placeholder="Your page title (max 60 characters recommended)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{title.length}/60 characters</span>
                {title.length > 60 && <span className="text-yellow-600">May be truncated</span>}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Meta Description</Label>
              <Textarea
                id="description"
                placeholder="Your meta description (max 160 characters recommended)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{description.length}/160 characters</span>
                {description.length > 160 && <span className="text-yellow-600">May be truncated</span>}
              </div>
            </div>
            <div>
              <Label htmlFor="url">Page URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/your-page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                "Preview SERP Appearance"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            {/* Google SERP Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Google Search Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white">
                  <div className="text-sm text-green-700 mb-1">
                    {result.preview?.displayUrl || url || "example.com/page"}
                  </div>
                  <h3 className="text-xl text-blue-700 hover:underline cursor-pointer mb-1">
                    {result.preview?.displayTitle || title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {result.preview?.displayDescription || description || "No description provided"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title Analysis */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Title</h4>
                    <span className={getRatingColor(result.analysis?.title?.rating || "")}>
                      {result.analysis?.title?.rating}
                    </span>
                  </div>
                  <Progress 
                    value={((result.analysis?.title?.length || 0) / (result.analysis?.title?.maxLength || 60)) * 100} 
                    className="h-2 mb-2"
                  />
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {result.analysis?.title?.isTruncated ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <span>{result.analysis?.title?.isTruncated ? "Will truncate" : "Good length"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {result.analysis?.title?.hasKeywords ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>{result.analysis?.title?.hasKeywords ? "Has keywords" : "Missing keywords"}</span>
                    </div>
                  </div>
                </div>

                {/* Description Analysis */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Description</h4>
                    <span className={getRatingColor(result.analysis?.description?.rating || "")}>
                      {result.analysis?.description?.rating}
                    </span>
                  </div>
                  <Progress 
                    value={((result.analysis?.description?.length || 0) / (result.analysis?.description?.maxLength || 160)) * 100} 
                    className="h-2 mb-2"
                  />
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {result.analysis?.description?.hasCallToAction ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>{result.analysis?.description?.hasCallToAction ? "Has CTA" : "Missing CTA"}</span>
                    </div>
                  </div>
                </div>

                {/* URL Analysis */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">URL</h4>
                    <span className={getRatingColor(result.analysis?.url?.rating || "")}>
                      {result.analysis?.url?.rating}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {result.analysis?.url?.isClean ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>{result.analysis?.url?.isClean ? "Clean URL" : "Could be cleaner"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTR Prediction */}
            {result.ctrPrediction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CTR Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="mb-3" variant="secondary">{result.ctrPrediction.score}</Badge>
                  <div className="flex flex-wrap gap-2">
                    {result.ctrPrediction.factors?.map((factor, i) => (
                      <Badge key={i} variant="outline">{factor}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Appearance */}
            {result.aiAppearance && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">How AI Might Cite This</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{result.aiAppearance}"</p>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">→</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default SERPPreviewer;
