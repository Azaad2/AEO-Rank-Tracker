import { useState } from "react";
import { Loader2, Copy, Check, Download, Lightbulb, Target, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ToolLayout from "@/components/tools/ToolLayout";

const industries = [
  "SaaS / Software",
  "E-commerce / Retail",
  "Healthcare / Medical",
  "Finance / Banking",
  "Real Estate",
  "Education / E-learning",
  "Travel / Hospitality",
  "Food & Beverage",
  "Legal Services",
  "Marketing / Agency",
  "Manufacturing",
  "Technology / IT Services",
  "Other",
];

interface GeneratedPrompt {
  prompt: string;
  category: string;
  intent: string;
}

const AIPromptGenerator = () => {
  const [industry, setIndustry] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<GeneratedPrompt[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!industry || !businessDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please select an industry and describe your business.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setPrompts([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-prompts", {
        body: {
          industry,
          businessDescription,
          targetAudience: targetAudience || "general consumers",
        },
      });

      if (error) throw error;

      setPrompts(data.prompts || []);
      toast({
        title: "Prompts generated!",
        description: `Generated ${data.prompts?.length || 0} prompts for your business.`,
      });
    } catch (error) {
      console.error("Error generating prompts:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate prompts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Prompt copied to clipboard.",
    });
  };

  const downloadPrompts = () => {
    const content = prompts
      .map((p, i) => `${i + 1}. [${p.category}] ${p.prompt}\n   Intent: ${p.intent}`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-prompts-${industry.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="AI Prompt Generator"
      description="Generate industry-specific prompts that your customers ask AI assistants. Optimize your content for these queries to get mentioned."
      relatedTools={[
        {
          title: "AI FAQ Generator",
          href: "/tools/ai-faq-generator",
          description: "Generate FAQs based on these prompts",
        },
        {
          title: "AI Visibility Checker",
          href: "/",
          description: "Check if you're mentioned for these prompts",
        },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate AI Prompts
            </CardTitle>
            <CardDescription>
              Tell us about your business and we'll generate prompts your customers likely ask AI assistants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g., Small business owners, developers, parents..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your business, products, or services. What problems do you solve? What makes you unique?"
                className="min-h-[120px]"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
              />
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
                  Generating Prompts...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Generate Prompts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {prompts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Generated Prompts ({prompts.length})
              </h2>
              <Button variant="outline" onClick={downloadPrompts}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>

            <div className="grid gap-4">
              {prompts.map((prompt, index) => (
                <Card key={index} className="group">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {prompt.category}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {prompt.intent}
                          </span>
                        </div>
                        <p className="text-foreground font-medium">
                          "{prompt.prompt}"
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(prompt.prompt, index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
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

            {/* Next Steps */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  What's Next?
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use these prompts to optimize your website content</li>
                  <li>• Create FAQ pages answering these questions</li>
                  <li>• Run an AI Visibility Check to see if you're being mentioned for these prompts</li>
                  <li>• Generate FAQ schema markup to help AI cite your content</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How It Works */}
        {prompts.length === 0 && (
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
                    Tell us your industry, target audience, and what you offer.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">AI Generates Prompts</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes your business and generates relevant prompts customers ask.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Optimize Your Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Use these prompts to create content that AI assistants will cite.
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

export default AIPromptGenerator;
