import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, TrendingUp, CheckCircle2, Users } from "lucide-react";
import { useActivityTracking } from "@/hooks/useActivityTracking";

interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
  debug: { usedResults: string[] };
}

interface ScanResponse {
  project: string;
  promptsCount: number;
  score: number;
  results: ScanResult[];
  meta?: {
    llmAnalysisUsed: number;
    totalPrompts: number;
    llmErrors?: string[];
  };
}

const Index = () => {
  const [domain, setDomain] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const { toast } = useToast();
  const { trackEvent } = useActivityTracking();

  const handleScan = async () => {
    if (!domain.trim() || !promptsText.trim()) {
      toast({
        title: "Missing input",
        description: "Please provide both domain and prompts",
        variant: "destructive",
      });
      return;
    }

    const promptCount = promptsText.trim().split(/[\n,]/).filter(p => p.trim()).length;
    
    // Track scan initiation
    trackEvent('scan_initiated', {
      domain: domain.trim(),
      prompt_count: promptCount,
    });

    setIsScanning(true);
    setScanData(null);

    try {
      const { data, error } = await supabase.functions.invoke('scan', {
        body: {
          domain: domain.trim(),
          promptsText: promptsText.trim(),
          market: 'en-US',
        },
      });

      if (error) throw error;

      setScanData(data);
      
      // Track successful scan completion
      trackEvent('scan_completed', {
        domain: domain.trim(),
        score: data.score,
        prompts_count: data.promptsCount,
        llm_analysis_used: data.meta?.llmAnalysisUsed || 0,
      });
      
      // Show warning if LLM wasn't used
      if (data.meta && data.meta.llmAnalysisUsed === 0) {
        toast({
          title: "Scan complete (Limited Analysis)",
          description: "Results used basic analysis. OpenAI rate limit may have been exceeded.",
          variant: "destructive",
        });
      } else if (data.meta && data.meta.llmAnalysisUsed < data.meta.totalPrompts) {
        toast({
          title: "Scan complete (Partial LLM Analysis)",
          description: `${data.meta.llmAnalysisUsed}/${data.meta.totalPrompts} prompts used AI analysis. Some used fallback due to rate limits.`,
        });
      } else {
        toast({
          title: "Scan complete",
          description: `AI Visibility Score: ${data.score}`,
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      
      // Track scan failure
      trackEvent('scan_failed', {
        domain: domain.trim(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const downloadCSV = () => {
    if (!scanData) return;

    // Track CSV download
    trackEvent('csv_download', {
      domain: scanData.project,
      score: scanData.score,
      prompts_count: scanData.promptsCount,
    });

    const headers = ['Prompt', 'Mentioned', 'Cited', 'Citation Rank', 'Top Cited Domains'];
    const rows = scanData.results.map(r => [
      r.prompt,
      r.mentioned ? 'Yes' : 'No',
      r.cited ? 'Yes' : 'No',
      r.citationRank?.toString() || '—',
      r.topCitedDomains.join(', '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-visibility-${scanData.project}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-score-high";
    if (score >= 40) return "text-score-medium";
    return "text-score-low";
  };

  const scrollToScan = () => {
    // Track CTA click
    trackEvent('cta_click', {
      cta_location: 'hero',
      cta_text: 'Run a Free AI Visibility Scan',
    });
    
    const scanSection = document.getElementById('scan');
    if (scanSection) {
      scanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Search Visibility Checker
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            This free AI visibility checker simulates AI answers from public web results and shows whether assistants like ChatGPT, Perplexity and Gemini mention and cite your website — plus which competitors appear instead of you.
          </p>
          <div className="pt-2">
            <Button onClick={scrollToScan} size="lg" className="font-semibold">
              Run a Free AI Visibility Scan
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Works for any website – SaaS, ecommerce, blogs, local services, agencies and more.
            </p>
          </div>
        </div>

        {/* Scan Input Section */}
        <section id="scan" className="scroll-mt-8">
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-3xl font-bold">Check If AI Mentions Your Website</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Run an AI search visibility audit by entering your domain and the prompts or keywords your audience uses. We'll show you exactly where you appear in AI-generated answers.
            </p>
          </div>
          <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Enter Scan Details</CardTitle>
            <CardDescription>
              Provide your domain and the prompts/keywords you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="domain" className="text-sm font-medium">
                Domain
              </label>
              <Input
                id="domain"
                placeholder="bndbox.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                disabled={isScanning}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="prompts" className="text-sm font-medium">
                Prompts/Keywords (one per line)
              </label>
              <Textarea
                id="prompts"
                placeholder="best wholesale marketplace for resellers&#10;bndbox vs faire&#10;is bndbox legit?"
                value={promptsText}
                onChange={(e) => setPromptsText(e.target.value)}
                disabled={isScanning}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 15 prompts. Separate by line break or comma.
              </p>
            </div>

            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full"
              size="lg"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan"
              )}
            </Button>
          </CardContent>
        </Card>
        </section>

        {/* Results Section */}
        {scanData && (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>AI Search Visibility Results</CardTitle>
                  <CardDescription>
                    Project: {scanData.project} • {scanData.promptsCount} prompts analyzed
                    {scanData.meta && scanData.meta.llmAnalysisUsed < scanData.meta.totalPrompts && (
                      <span className="text-amber-600 dark:text-amber-400 ml-2">
                        ({scanData.meta.llmAnalysisUsed}/{scanData.meta.totalPrompts} with AI analysis)
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">AI Visibility Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(scanData.score)}`}>
                      {scanData.score}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score is based on AI mentions, citations and citation rank across your prompts.
                    </p>
                  </div>
                  <Button
                    onClick={downloadCSV}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prompt</TableHead>
                      <TableHead className="text-center">Mentioned</TableHead>
                      <TableHead className="text-center">Cited</TableHead>
                      <TableHead className="text-center">Citation Rank</TableHead>
                      <TableHead>Top Cited Domains</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanData.results.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium max-w-xs">
                          {result.prompt}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.mentioned ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.cited ? (
                            <span className="text-success">✓</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {result.citationRank ? (
                            <span className="font-semibold text-primary">
                              {result.citationRank}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {result.topCitedDomains.slice(0, 3).join(', ') || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEO Content Sections */}
        <div className="space-y-12 pt-8">
          {/* Target Audience Section */}
          <section className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Built for Any Website That Cares About AI Search Visibility</h2>
            <div className="max-w-3xl mx-auto space-y-3 text-muted-foreground">
              <p>
                Whether you run a SaaS platform, an ecommerce store, a content blog, a local service business, or a digital agency, this AI search visibility checker helps you understand how AI assistants represent your brand. As more users turn to ChatGPT, Perplexity, and Gemini for answers, traditional blue-link rankings tell only part of the story.
              </p>
              <p>
                Our AI visibility tool analyzes the prompts your audience actually types and shows you exactly where your website appears—or doesn't appear—in AI-generated responses. Use these insights to optimize your content strategy, identify competitor gaps, and ensure your brand gets the visibility it deserves in the age of AI search.
              </p>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-center">How Our AI Search Visibility Tool Works</h2>
            <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
              <li className="pl-2">
                <span className="font-medium text-foreground">Enter your domain</span> – Provide the website you want to analyze for AI visibility.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">Add prompts or keywords</span> – Input the questions and search terms your target audience actually uses.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">Tool uses search API + AI</span> – We fetch real search results and simulate how AI assistants create answers.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">Check mentions and citations</span> – See if your brand is mentioned in the AI answer and whether it's cited as a source.
              </li>
              <li className="pl-2">
                <span className="font-medium text-foreground">View competitors and score</span> – Identify which competitors appear instead of you and get an overall AI visibility score.
              </li>
            </ol>
          </section>

          {/* Why It Matters Section */}
          <section className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-center">Why AI SEO Visibility Matters</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                AI-powered search experiences are transforming how users discover information online. Instead of clicking through multiple blue links, users now receive direct answers from AI assistants—often before they even see traditional search results. If your website isn't mentioned or cited in these AI-generated responses, you're missing a critical touchpoint with your audience.
              </p>
              <p>
                This AI seo visibility tool helps you track three essential metrics:
              </p>
              <ul className="space-y-2 list-disc list-inside pl-4">
                <li>
                  <span className="font-medium text-foreground">AI mentions</span> – Does the AI assistant include your brand name in its answer?
                </li>
                <li>
                  <span className="font-medium text-foreground">AI citations</span> – Is your website cited as a credible source with a clickable reference?
                </li>
                <li>
                  <span className="font-medium text-foreground">Competitor coverage</span> – Which competing websites appear in AI answers when yours doesn't?
                </li>
              </ul>
              <p>
                Understanding your AI search visibility allows you to adapt your content strategy, strengthen your brand authority, and stay competitive in an AI-first search landscape.
              </p>
            </div>
          </section>

          {/* Use Cases Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-center">Practical Ways to Use the AI Visibility Checker</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-xl">Agencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Run client AI visibility audits as part of SEO reporting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Identify content gaps where competitors dominate AI answers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Track AI visibility improvements over time for client ROI</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-xl">SaaS & Online Brands</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Monitor brand mentions in AI assistant responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Prioritize content creation based on AI visibility gaps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Benchmark AI citation performance against competitors</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <Loader2 className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-xl">Blogs & Local Businesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Discover which topics and keywords drive AI citations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Find local service queries where you should appear</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>Optimize content to earn authoritative AI mentions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center">AI Search Visibility Checker – FAQ</h2>
            <Accordion 
              type="single" 
              collapsible 
              className="w-full"
              onValueChange={(value) => {
                if (value) {
                  trackEvent('faq_opened', {
                    faq_question: value,
                  });
                }
              }}
            >
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  What is an AI search visibility checker?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  An AI search visibility checker is a tool that shows whether AI assistants like ChatGPT, Perplexity, and Gemini mention and cite your website when answering user questions. Unlike traditional SEO tools that track Google rankings, this AI visibility tool analyzes whether your brand appears in AI-generated answers based on real search results.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  How is this AI visibility checker different from normal SEO tools?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Traditional SEO tools focus on blue-link rankings in Google search results. This AI search visibility tool simulates how AI assistants generate answers and checks if your website is mentioned or cited in those AI responses. As AI answers increasingly appear above traditional search results, tracking AI visibility becomes essential for modern SEO strategy.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  Who should use this AI search visibility tool?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  This AI visibility checker is valuable for any website type: SaaS companies tracking brand mentions, ecommerce sites monitoring product visibility, blogs optimizing for AI citations, local businesses checking service area coverage, and agencies reporting client AI visibility metrics. If your audience uses AI assistants, you need to track your AI search visibility.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  Does running an AI search visibility audit improve my rankings automatically?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No, this AI visibility tool provides insights and data about your current AI mention and citation performance. Rankings and visibility improve when you take action based on those insights—such as creating better content, earning authoritative citations, and optimizing for the queries where competitors currently outrank you in AI answers.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-8 border-t">
          <p>
            This AI search visibility audit tool estimates visibility using public web results and simulated AI answer generation.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
