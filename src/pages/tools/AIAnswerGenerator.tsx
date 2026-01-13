import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ToolLayout from "@/components/tools/ToolLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, Loader2, Lightbulb, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GeneratedAnswer {
  answer: string;
  keyPoints: string[];
  citationOptimized: string;
  followUpQuestions: string[];
}

const AIAnswerGenerator = () => {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedAnswer | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-answer", {
        body: { question, context },
      });

      if (error) throw error;
      setResult(data);
      toast.success("Answer generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate answer. Please try again.");
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

  const downloadAnswer = () => {
    if (!result) return;
    const content = `Question: ${question}\n\nAnswer:\n${result.answer}\n\nKey Points:\n${result.keyPoints.map(p => `• ${p}`).join('\n')}\n\nCitation-Optimized Version:\n${result.citationOptimized}\n\nFollow-up Questions:\n${result.followUpQuestions.map(q => `• ${q}`).join('\n')}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-answer.txt";
    a.click();
  };

  const relatedTools = [
    { title: "AI FAQ Generator", href: "/tools/ai-faq-generator", description: "Generate SEO-optimized FAQs" },
    { title: "AI Prompt Generator", href: "/tools/ai-prompt-generator", description: "Create prompts for AI visibility" },
    { title: "Content Auditor", href: "/tools/content-auditor", description: "Audit content for AI optimization" },
  ];

  return (
    <ToolLayout
      title="AI Answer Generator"
      description="Generate comprehensive, citation-optimized answers that AI assistants are likely to reference and quote."
      relatedTools={relatedTools}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Generate AI-Optimized Answer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                placeholder="e.g., What are the best practices for SEO in 2024?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="context">Additional Context (Optional)</Label>
              <Textarea
                id="context"
                placeholder="Provide any additional context, such as your industry, target audience, or specific angle..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Answer...
                </>
              ) : (
                "Generate AI-Optimized Answer"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadAnswer}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Full Answer</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.answer, "answer")}
                  >
                    <Copy className="h-4 w-4" />
                    {copiedField === "answer" ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{result.answer}</p>
              </CardContent>
            </Card>

            {result.keyPoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-warning" />
                    Key Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">{index + 1}</Badge>
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Citation-Optimized Version</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.citationOptimized, "citation")}
                  >
                    <Copy className="h-4 w-4" />
                    {copiedField === "citation" ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.citationOptimized}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This shorter version is optimized for AI systems to cite directly.
                </p>
              </CardContent>
            </Card>

            {result.followUpQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Follow-up Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.followUpQuestions.map((q, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => setQuestion(q)}>
                        {q}
                      </Badge>
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

export default AIAnswerGenerator;
