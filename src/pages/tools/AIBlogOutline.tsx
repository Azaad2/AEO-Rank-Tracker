import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, Loader2, FileText, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Section {
  heading: string;
  subheadings: string[];
  keyPoints: string[];
  suggestedWordCount: number;
}

interface BlogOutline {
  title: string;
  metaDescription: string;
  estimatedReadTime: string;
  sections: Section[];
  keywords: {
    primary: string;
    secondary: string[];
    longTail: string[];
  };
  callToAction: string;
}

const AIBlogOutline = () => {
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentGoal, setContentGoal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<BlogOutline | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-outline", {
        body: { topic, targetAudience, contentGoal },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Blog outline generated!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate outline. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadOutline = () => {
    if (!result) return;
    let content = `# ${result.title}\n\n`;
    content += `Meta Description: ${result.metaDescription}\n`;
    content += `Estimated Read Time: ${result.estimatedReadTime}\n\n`;
    content += `## Keywords\n`;
    content += `Primary: ${result.keywords.primary}\n`;
    content += `Secondary: ${result.keywords.secondary.join(', ')}\n`;
    content += `Long-tail: ${result.keywords.longTail.join(', ')}\n\n`;
    content += `## Outline\n\n`;
    result.sections.forEach((section, i) => {
      content += `### ${i + 1}. ${section.heading}\n`;
      section.subheadings.forEach(sub => {
        content += `   - ${sub}\n`;
      });
      content += `Key Points: ${section.keyPoints.join('; ')}\n`;
      content += `Word Count: ~${section.suggestedWordCount}\n\n`;
    });
    content += `## Call to Action\n${result.callToAction}`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blog-outline.md";
    a.click();
  };

  const relatedTools = [
    { title: "Title Generator", href: "/tools/title-generator", description: "Generate SEO-optimized titles" },
    { title: "Content Auditor", href: "/tools/content-auditor", description: "Audit content for AI optimization" },
    { title: "Keyword Analyzer", href: "/tools/keyword-analyzer", description: "Find AI-focused keywords" },
  ];

  return (
    <ToolLayout
      title="AI Blog Outline Generator"
      description="Create comprehensive, SEO-optimized blog outlines that help your content rank and get cited by AI."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generate Blog Outline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="topic">Blog Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., How to optimize your website for AI search engines"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g., Marketing professionals, Small business owners"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="goal">Content Goal</Label>
                <Input
                  id="goal"
                  placeholder="e.g., Educate, Generate leads, Build authority"
                  value={contentGoal}
                  onChange={(e) => setContentGoal(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Outline...
                </>
              ) : (
                "Generate Blog Outline"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadOutline}>
                <Download className="h-4 w-4 mr-2" />
                Download Markdown
              </Button>
            </div>

            <Card className="border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Suggested Title</p>
                    <CardTitle>{result.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.title, "title")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {result.estimatedReadTime}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.metaDescription}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Target Keywords
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Primary Keyword</p>
                  <Badge>{result.keywords.primary}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Secondary Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.secondary.map((kw, i) => (
                      <Badge key={i} variant="secondary">{kw}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Long-tail Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.longTail.map((kw, i) => (
                      <Badge key={i} variant="outline">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Outline</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {result.sections.map((section, index) => (
                    <AccordionItem key={index} value={`section-${index}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span>{section.heading}</span>
                          <Badge variant="secondary" className="ml-auto mr-4">
                            ~{section.suggestedWordCount} words
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pl-8">
                        {section.subheadings.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Subheadings:</p>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {section.subheadings.map((sub, i) => (
                                <li key={i}>{sub}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium mb-1">Key Points to Cover:</p>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {section.keyPoints.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended Call to Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.callToAction}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default AIBlogOutline;
