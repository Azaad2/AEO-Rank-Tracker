import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Loader2, Type, Star, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GeneratedTitle {
  title: string;
  charCount: number;
  style: string;
  emotionalTrigger: string;
  seoScore: number;
}

interface TitleResult {
  titles: GeneratedTitle[];
  bestPick: { title: string; reason: string };
  tips: string[];
}

const contentTypes = ["Blog Post", "Article", "Landing Page", "Product Page", "Guide", "Tutorial", "News"];
const tones = ["Professional", "Casual", "Exciting", "Informative", "Persuasive", "Urgent"];

const TitleGenerator = () => {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [contentType, setContentType] = useState("Blog Post");
  const [tone, setTone] = useState("Professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<TitleResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-titles", {
        body: { topic, keywords, contentType, tone },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Titles generated!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate titles. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (title: string, index: number) => {
    await navigator.clipboard.writeText(title);
    setCopiedIndex(index);
    toast.success("Copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadTitles = () => {
    if (!result?.titles) return;
    const text = result.titles.map((t, i) => `${i + 1}. ${t.title} (${t.charCount} chars, ${t.style})`).join('\n');
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-titles.txt";
    a.click();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const relatedTools = [
    { title: "Description Generator", href: "/tools/description-generator", description: "Create meta descriptions" },
    { title: "AI Blog Outline", href: "/tools/ai-blog-outline", description: "Generate blog outlines" },
    { title: "SERP Previewer", href: "/tools/serp-previewer", description: "Preview search appearance" },
  ];

  return (
    <ToolLayout
      title="SEO Title Generator"
      description="Generate click-worthy, SEO-optimized titles that rank well and get cited by AI assistants."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Generate SEO Titles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., How to improve website speed"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="keywords">Target Keywords</Label>
              <Input
                id="keywords"
                placeholder="e.g., website speed, page load time, optimization"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Titles...
                </>
              ) : (
                "Generate 10 Title Options"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadTitles}>
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
                    Recommended Title
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium mb-2">{result.bestPick.title}</p>
                  <p className="text-sm text-muted-foreground">{result.bestPick.reason}</p>
                </CardContent>
              </Card>
            )}

            {/* All Titles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Title Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.titles?.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{item.charCount} chars</Badge>
                        <Badge variant="secondary">{item.style}</Badge>
                        <Badge className={getScoreColor(item.seoScore)}>
                          SEO: {item.seoScore}
                        </Badge>
                        {item.emotionalTrigger && (
                          <Badge variant="outline" className="capitalize">
                            {item.emotionalTrigger}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.title, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
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

export default TitleGenerator;
