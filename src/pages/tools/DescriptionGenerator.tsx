import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Download, Loader2, AlignLeft, Star, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GeneratedDescription {
  text: string;
  charCount: number;
  hasKeyword: boolean;
  hasCTA: boolean;
  style: string;
}

interface DescriptionResult {
  descriptions: GeneratedDescription[];
  bestPick: { text: string; reason: string };
  aiOptimized: string;
  tips: string[];
}

const DescriptionGenerator = () => {
  const [title, setTitle] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<DescriptionResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!title.trim() && !pageContent.trim()) {
      toast.error("Please enter a title or page content");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: { title, pageContent, targetKeyword },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Descriptions generated!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate descriptions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadDescriptions = () => {
    if (!result?.descriptions) return;
    const text = result.descriptions.map((d, i) => `${i + 1}. ${d.text} (${d.charCount} chars)`).join('\n\n');
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meta-descriptions.txt";
    a.click();
  };

  const relatedTools = [
    { title: "Title Generator", href: "/tools/title-generator", description: "Generate SEO titles" },
    { title: "Meta Optimizer", href: "/tools/meta-optimizer", description: "Optimize meta tags" },
    { title: "SERP Previewer", href: "/tools/serp-previewer", description: "Preview search appearance" },
  ];

  return (
    <ToolLayout
      title="Meta Description Generator"
      description="Create compelling meta descriptions that drive clicks and help AI understand your content."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlignLeft className="h-5 w-5 text-primary" />
              Generate Meta Descriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                placeholder="Your page or article title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="keyword">Target Keyword</Label>
              <Input
                id="keyword"
                placeholder="Main keyword to include"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="content">Page Content Summary (Optional)</Label>
              <Textarea
                id="content"
                placeholder="Brief summary of what the page is about..."
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                rows={4}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Descriptions...
                </>
              ) : (
                "Generate 5 Description Options"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadDescriptions}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>

            {/* Best Pick */}
            {result.bestPick && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    Recommended Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">{result.bestPick.text}</p>
                  <p className="text-sm text-muted-foreground">{result.bestPick.reason}</p>
                </CardContent>
              </Card>
            )}

            {/* AI Optimized */}
            {result.aiOptimized && (
              <Card className="border-blue-500/50 bg-blue-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">AI-Optimized Version</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.aiOptimized, -1)}
                    >
                      {copiedIndex === -1 ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{result.aiOptimized}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Optimized specifically for AI citation and discovery
                  </p>
                </CardContent>
              </Card>
            )}

            {/* All Descriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Description Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.descriptions?.map((item, index) => (
                  <div 
                    key={index} 
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="mb-2">{item.text}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge 
                            variant="outline" 
                            className={item.charCount <= 160 ? "text-green-600" : "text-yellow-600"}
                          >
                            {item.charCount} chars
                          </Badge>
                          {item.hasKeyword && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Has keyword
                            </Badge>
                          )}
                          {item.hasCTA && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Has CTA
                            </Badge>
                          )}
                          <Badge variant="outline">{item.style}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.text, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pro Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{tip}</span>
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

export default DescriptionGenerator;
