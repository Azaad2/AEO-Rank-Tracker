import { useState } from "react";
import { Loader2, Copy, Check, Download, MessageSquare, Code, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ToolLayout from "@/components/tools/ToolLayout";

interface FAQ {
  question: string;
  answer: string;
}

const AIFAQGenerator = () => {
  const [businessDescription, setBusinessDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [schemaGenerated, setSchemaGenerated] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!businessDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please describe your business or product.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setFaqs([]);
    setSchemaGenerated(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-faqs", {
        body: { businessDescription },
      });

      if (error) throw error;

      setFaqs(data.faqs || []);
      setSchemaGenerated(true);
      toast({
        title: "FAQs generated!",
        description: `Generated ${data.faqs?.length || 0} FAQs with schema markup.`,
      });
    } catch (error) {
      console.error("Error generating FAQs:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate FAQs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSchemaMarkup = () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
    return JSON.stringify(schema, null, 2);
  };

  const copyToClipboard = async (text: string, index?: number) => {
    await navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const downloadFAQs = (format: "text" | "json" | "html") => {
    let content = "";
    let filename = "";
    let mimeType = "";

    if (format === "text") {
      content = faqs.map((faq, i) => `Q${i + 1}: ${faq.question}\nA: ${faq.answer}`).join("\n\n");
      filename = "faqs.txt";
      mimeType = "text/plain";
    } else if (format === "json") {
      content = generateSchemaMarkup();
      filename = "faq-schema.json";
      mimeType = "application/json";
    } else {
      content = `<script type="application/ld+json">\n${generateSchemaMarkup()}\n</script>\n\n<div class="faq-section">\n${faqs
        .map(
          (faq) =>
            `  <div class="faq-item">\n    <h3>${faq.question}</h3>\n    <p>${faq.answer}</p>\n  </div>`
        )
        .join("\n")}\n</div>`;
      filename = "faqs.html";
      mimeType = "text/html";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="AI FAQ Generator"
      description="Generate SEO-optimized FAQs with schema markup that AI assistants love to cite. Boost your visibility in AI search results."
      relatedTools={[
        {
          title: "AI Prompt Generator",
          href: "/tools/ai-prompt-generator",
          description: "Generate prompts to base FAQs on",
        },
        {
          title: "AI Visibility Checker",
          href: "/",
          description: "Check if AI mentions your FAQs",
        },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate AI-Optimized FAQs
            </CardTitle>
            <CardDescription>
              Describe your business, product, or service. We'll generate FAQs that AI assistants frequently cite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Business/Product Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your business, products, or services in detail. Include your unique selling points, target audience, and common customer questions you receive."
                className="min-h-[150px]"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The more detail you provide, the better the FAQs will be.
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full md:w-auto"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating FAQs...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Generate FAQs
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {faqs.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-semibold">
                Generated FAQs ({faqs.length})
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadFAQs("text")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Text
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadFAQs("json")}>
                  <Code className="h-4 w-4 mr-2" />
                  JSON-LD
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadFAQs("html")}>
                  <Download className="h-4 w-4 mr-2" />
                  HTML
                </Button>
              </div>
            </div>

            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">FAQ Preview</TabsTrigger>
                <TabsTrigger value="schema">Schema Markup</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <Card key={index} className="group">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-foreground">
                              Q: {faq.question}
                            </h3>
                            <p className="text-muted-foreground">
                              A: {faq.answer}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(`Q: ${faq.question}\nA: ${faq.answer}`, index)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="schema" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      JSON-LD Schema Markup
                    </CardTitle>
                    <CardDescription>
                      Copy this code and paste it into your website's &lt;head&gt; section.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{`<script type="application/ld+json">\n${generateSchemaMarkup()}\n</script>`}</code>
                      </pre>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          copyToClipboard(
                            `<script type="application/ld+json">\n${generateSchemaMarkup()}\n</script>`
                          )
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Benefits */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Why FAQ Schema Helps AI Visibility</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Structured data helps AI understand your content better</li>
                  <li>✓ FAQs provide direct answers AI can easily cite</li>
                  <li>✓ Schema markup improves chances of rich snippets in search</li>
                  <li>✓ Clear Q&A format matches how users query AI assistants</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How It Works */}
        {faqs.length === 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Describe Your Business</h3>
                  <p className="text-sm text-muted-foreground">
                    Provide details about your products, services, and target audience.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">AI Generates FAQs</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI creates relevant FAQs optimized for AI search visibility.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Get Schema Markup</h3>
                  <p className="text-sm text-muted-foreground">
                    Download ready-to-use JSON-LD schema to add to your website.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </div>
    </ToolLayout>
  );
};

export default AIFAQGenerator;
