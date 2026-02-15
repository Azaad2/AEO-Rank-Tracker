import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, TrendingUp, CheckCircle2, Users, Lock, FileText, Mail } from "lucide-react";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useABTest } from "@/hooks/useABTest";
import { useAuth } from "@/hooks/useAuth";
import { useGuestScans } from "@/hooks/useGuestScans";
import { ImprovementRoadmap } from "@/components/ImprovementRoadmap";
import { generateEnhancedCSV } from "@/utils/csvExport";
import { EmailCaptureModal } from "@/components/EmailCaptureModal";
import { LockedOverlay } from "@/components/LockedOverlay";
import { GuestLimitModal } from "@/components/GuestLimitModal";
import { Header } from "@/components/Header";
import { ScanResultsModal } from "@/components/ScanResultsModal";
import { OptimizationHub } from "@/components/OptimizationHub";
import { SuggestedPrompts } from "@/components/dashboard/SuggestedPrompts";
import logo from "@/assets/logo-light.png";

interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
  debug: { usedResults: string[] };
  // Gemini direct analysis
  geminiMentioned: boolean;
  geminiCited: boolean;
  geminiResponse: string;
  geminiCompetitors: string[];
  // Perplexity analysis
  perplexityMentioned?: boolean;
  perplexityCited?: boolean;
  perplexityResponse?: string;
  perplexityCompetitors?: string[];
}

interface ScanResponse {
  project: string;
  promptsCount: number;
  score: number;
  results: ScanResult[];
  meta?: {
    llmAnalysisUsed: number;
    geminiAnalysisUsed: number;
    totalPrompts: number;
    llmErrors?: string[];
  };
}

const Index = () => {
  const [domain, setDomain] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [unlockedEmail, setUnlockedEmail] = useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const { toast } = useToast();
  const { trackEvent } = useActivityTracking();
  
  // Auth and guest scan tracking
  const { user } = useAuth();
  const { canScan, recordGuestScan, resetForNewDay } = useGuestScans();
  
  // A/B Testing for headlines and CTAs
  const { variant: headlineVariant, trackConversion: trackHeadlineConversion } = useABTest('headline');
  const { variant: ctaVariant, trackConversion: trackCtaConversion } = useABTest('cta');
  
  // Reset guest scan counter at start of new day
  useEffect(() => {
    resetForNewDay();
  }, [resetForNewDay]);
  
  // Default values while loading
  const headline = headlineVariant?.value || 'AI Search Visibility Checker';
  const ctaText = ctaVariant?.value || 'Run a Free AI Visibility Scan';

  // Track page view on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    trackEvent('page_view', {
      page: 'home',
      referrer: document.referrer || 'direct',
      utm_source: urlParams.get('utm_source') || null,
      utm_medium: urlParams.get('utm_medium') || null,
      utm_campaign: urlParams.get('utm_campaign') || null,
      device_type: /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    });
  }, [trackEvent]);

  // Track scroll depth
  useEffect(() => {
    let scrollTracked = { 
      '25': false, 
      '50': false, 
      '75': false, 
      '100': false 
    };

    const handleScroll = () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercentage >= 25 && !scrollTracked['25']) {
        scrollTracked['25'] = true;
        trackEvent('scroll_depth', { depth: '25%' });
      }
      if (scrollPercentage >= 50 && !scrollTracked['50']) {
        scrollTracked['50'] = true;
        trackEvent('scroll_depth', { depth: '50%' });
      }
      if (scrollPercentage >= 75 && !scrollTracked['75']) {
        scrollTracked['75'] = true;
        trackEvent('scroll_depth', { depth: '75%' });
      }
      if (scrollPercentage >= 99 && !scrollTracked['100']) {
        scrollTracked['100'] = true;
        trackEvent('scroll_depth', { depth: '100%' });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackEvent]);

  const handleScan = async () => {
    if (!domain.trim() || !promptsText.trim()) {
      toast({
        title: "Missing input",
        description: "Please provide both domain and prompts",
        variant: "destructive",
      });
      return;
    }

    // Check guest scan limit (only for non-authenticated users)
    if (!user && !canScan()) {
      setShowGuestLimitModal(true);
      trackEvent('guest_limit_reached', {
        domain: domain.trim(),
      });
      return;
    }

    // Check subscription limits for logged-in users
    if (user) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('scans_used, prompts_used, plan_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub) {
        const { data: plan } = await supabase
          .from('plans')
          .select('scans_limit, prompts_limit')
          .eq('id', sub.plan_id)
          .single();
        if (plan) {
          const promptCount = promptsText.trim().split(/[\n,]/).filter(p => p.trim()).length;
          if (plan.scans_limit !== -1 && (sub.scans_used ?? 0) >= plan.scans_limit) {
            toast({ title: 'Scan limit reached', description: 'Please upgrade your plan to continue scanning.', variant: 'destructive' });
            return;
          }
          if ((sub.prompts_used ?? 0) + promptCount > plan.prompts_limit) {
            toast({ title: 'Prompt limit reached', description: `You have ${plan.prompts_limit - (sub.prompts_used ?? 0)} prompts remaining. Please upgrade your plan.`, variant: 'destructive' });
            return;
          }
        }
      }
    }

    const promptCount = promptsText.trim().split(/[\n,]/).filter(p => p.trim()).length;
    
    // Track scan initiation
    trackEvent('scan_initiated', {
      domain: domain.trim(),
      prompt_count: promptCount,
      is_authenticated: !!user,
    });

    setIsScanning(true);
    setScanData(null);
    setScanId(null);
    setIsUnlocked(false);
    setUnlockedEmail(null);

    try {
      const { data, error } = await supabase.functions.invoke('scan', {
        body: {
          domain: domain.trim(),
          promptsText: promptsText.trim(),
          market: 'en-US',
          userId: user?.id,
        },
      });

      if (error) throw error;

      setScanData(data);
      // Store scan ID if returned from function
      if (data.scanId) {
        setScanId(data.scanId);
        // Record guest scan for limit tracking (only for non-authenticated users)
        if (!user) {
          recordGuestScan(data.scanId);
        }
      }
      // Auto-open results modal
      setShowResultsModal(true);
      
      // Track successful scan completion
      trackEvent('scan_completed', {
        domain: domain.trim(),
        score: data.score,
        prompts_count: data.promptsCount,
        llm_analysis_used: data.meta?.llmAnalysisUsed || 0,
        headline_variant: headlineVariant?.key || 'A',
        cta_variant: ctaVariant?.key || 'A',
      });
      
      // Track A/B test conversions for scan completion
      trackHeadlineConversion('scan_completed');
      trackCtaConversion('scan_completed');
      
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

    const csvContent = generateEnhancedCSV(scanData);

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-visibility-report-${scanData.project}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-score-high";
    if (score >= 40) return "text-score-medium";
    return "text-score-low";
  };

  const scrollToScan = () => {
    // Track CTA click with A/B variant info
    trackEvent('cta_click', {
      cta_location: 'hero',
      cta_text: ctaText,
      cta_variant: ctaVariant?.key || 'A',
      headline_variant: headlineVariant?.key || 'A',
    });
    
    // Track conversion for A/B tests
    trackCtaConversion('cta_click');
    trackHeadlineConversion('cta_click');
    
    const scanSection = document.getElementById('scan');
    if (scanSection) {
      scanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEmailSuccess = (email: string) => {
    setIsUnlocked(true);
    setUnlockedEmail(email);
    trackEvent('results_unlocked', {
      domain: scanData?.project,
      score: scanData?.score,
    });
  };

  const openEmailModal = () => {
    trackEvent('unlock_modal_opened', {
      domain: scanData?.project,
      score: scanData?.score,
    });
    setShowEmailModal(true);
  };

  const downloadPDF = async () => {
    if (!scanId || !unlockedEmail) return;
    
    setIsDownloadingPDF(true);
    trackEvent('pdf_download_started', {
      domain: scanData?.project,
      score: scanData?.score,
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { scanId, email: unlockedEmail, sendEmail: false },
      });

      if (error) throw error;

      // Create downloadable HTML file
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-visibility-report-${scanData?.project || 'report'}.html`;
      a.click();
      URL.revokeObjectURL(url);

      trackEvent('pdf_downloaded', {
        domain: scanData?.project,
        score: scanData?.score,
      });

      toast({
        title: "Report downloaded",
        description: "Open the HTML file in your browser and print to PDF for best results.",
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const sendReportEmail = async () => {
    if (!scanId || !unlockedEmail) return;
    
    setIsSendingEmail(true);
    trackEvent('pdf_email_started', {
      domain: scanData?.project,
      score: scanData?.score,
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { scanId, email: unlockedEmail, sendEmail: true },
      });

      if (error) throw error;

      if (data.emailSent) {
        trackEvent('pdf_emailed', {
          domain: scanData?.project,
          score: scanData?.score,
        });
        toast({
          title: "Report sent!",
          description: `Check your inbox at ${unlockedEmail}`,
        });
      } else {
        throw new Error(data.emailError || 'Failed to send email');
      }
    } catch (error) {
      console.error('Email send error:', error);
      toast({
        title: "Email failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Number of free preview results - reduced to 1 to increase email capture
  const FREE_PREVIEW_COUNT = 1;

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-32 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Section with Black Background - Mario Style */}
          <div className="py-12 md:py-16 px-6 -mx-4 md:-mx-8">
            <div className="text-center space-y-6">
              <h1 
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]"
                style={{ fontFamily: "'Press Start 2P', cursive" }}
              >
                Invisible to AI?
                <br />
                <span className="text-yellow-400">Fix It in Minutes.</span>
              </h1>
              <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
                Check if ChatGPT, Perplexity, and Gemini mention your website — then get a personalized optimization plan to boost your visibility.
              </p>
              <div className="pt-2">
                <Button 
                  onClick={scrollToScan} 
                  size="lg" 
                  className="font-semibold bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  {ctaText}
                </Button>
                <p className="text-xs text-gray-400 mt-3">
                  Works for any website – SaaS, ecommerce, blogs, local services, agencies and more.
                </p>
              </div>
            </div>
          </div>

        {/* Scan Input Section */}
        <section id="scan" className="scroll-mt-8 -mt-4">
          <Card className="shadow-lg bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Enter Scan Details</CardTitle>
            <CardDescription className="text-gray-400">
              Provide your domain and the prompts/keywords you want to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="domain" className="text-sm font-medium text-gray-300">
                Domain
              </label>
              <Input
                id="domain"
                placeholder="bndbox.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onFocus={() => trackEvent('form_interaction', { field: 'domain' })}
                disabled={isScanning}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="prompts" className="text-sm font-medium text-gray-300">
                Prompts/Keywords (one per line)
              </label>
              <SuggestedPrompts
                domain={domain}
                onAddPrompt={(prompt) => {
                  setPromptsText(prev => prev ? `${prev}\n${prompt}` : prompt);
                }}
                disabled={isScanning}
              />
              <Textarea
                id="prompts"
                placeholder="best wholesale marketplace for resellers&#10;bndbox vs faire&#10;is bndbox legit?"
                value={promptsText}
                onChange={(e) => setPromptsText(e.target.value)}
                onFocus={() => trackEvent('form_interaction', { field: 'prompts' })}
                disabled={isScanning}
                rows={6}
                className="font-mono text-sm bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Maximum 15 prompts. Separate by line break or comma.
              </p>
            </div>

            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
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
                    {scanData.meta && (
                      <span className="text-primary ml-2">
                        (Gemini: {scanData.meta.geminiAnalysisUsed || 0}/{scanData.meta.totalPrompts})
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">AI Visibility Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(scanData.score)}`}>
                      {scanData.score}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score is based on AI mentions, citations and citation rank across your prompts.
                    </p>
                  </div>
                  {isUnlocked ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadCSV}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        onClick={downloadPDF}
                        variant="outline"
                        size="sm"
                        disabled={isDownloadingPDF}
                      >
                        {isDownloadingPDF ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
                        Report
                      </Button>
                      <Button
                        onClick={sendReportEmail}
                        variant="outline"
                        size="sm"
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Email
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={openEmailModal}
                      variant="outline"
                      size="sm"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Unlock
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prompt</TableHead>
                      <TableHead className="text-center">Search Mentioned</TableHead>
                      <TableHead className="text-center">Search Cited</TableHead>
                      <TableHead className="text-center">Gemini Mentions</TableHead>
                      <TableHead className="text-center">Gemini Cites</TableHead>
                      <TableHead>Gemini Competitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanData.results.map((result, idx) => {
                      const isLocked = !isUnlocked && idx >= FREE_PREVIEW_COUNT;
                      
                      return (
                        <TableRow key={idx} className={isLocked ? "relative" : ""}>
                          <TableCell className={`font-medium max-w-xs ${isLocked ? "blur-sm select-none" : ""}`}>
                            {isLocked ? "Locked prompt content..." : result.prompt}
                          </TableCell>
                          <TableCell className={`text-center ${isLocked ? "blur-sm select-none" : ""}`}>
                            {result.mentioned ? (
                              <span className="text-success">✓</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-center ${isLocked ? "blur-sm select-none" : ""}`}>
                            {result.cited ? (
                              <span className="text-success">✓</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-center ${isLocked ? "blur-sm select-none" : ""}`}>
                            {result.geminiMentioned ? (
                              <span className="text-success font-semibold">✓ Yes</span>
                            ) : (
                              <span className="text-destructive">✗ No</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-center ${isLocked ? "blur-sm select-none" : ""}`}>
                            {result.geminiCited ? (
                              <span className="text-success font-semibold">✓ Yes</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-sm text-muted-foreground max-w-xs ${isLocked ? "blur-sm select-none" : ""}`}>
                            {result.geminiCompetitors?.slice(0, 3).join(', ') || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {/* Unlock CTA for locked results */}
                {!isUnlocked && scanData.results.length > FREE_PREVIEW_COUNT && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      <Lock className="inline-block h-4 w-4 mr-1" />
                      {scanData.results.length - FREE_PREVIEW_COUNT} more results are locked
                    </p>
                    <Button onClick={openEmailModal} size="sm">
                      Unlock All Results
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Improvement Roadmap - locked behind email gate */}
        {scanData && (
          <div className="relative">
            {!isUnlocked && <LockedOverlay onUnlock={openEmailModal} message="Enter your email to see your personalized improvement roadmap" />}
            <div className={!isUnlocked ? "blur-sm pointer-events-none" : ""}>
              <ImprovementRoadmap 
                results={scanData.results}
                domain={scanData.project}
                currentScore={scanData.score}
              />
            </div>
          </div>
        )}

        {/* Optimization Hub - AI-powered improvement recommendations */}
        {scanData && (
          <OptimizationHub 
            scanData={{
              project: scanData.project,
              score: scanData.score,
              results: scanData.results,
            }}
            isUnlocked={isUnlocked}
          />
        )}

        {/* Scan Results Modal */}
        <ScanResultsModal
          open={showResultsModal}
          onOpenChange={setShowResultsModal}
          scanData={scanData ? { ...scanData, scanId: scanId || undefined } : null}
          isUnlocked={isUnlocked}
          onUnlock={handleEmailSuccess}
          freePreviewCount={FREE_PREVIEW_COUNT}
        />

        {/* Email Capture Modal */}
        <EmailCaptureModal
          open={showEmailModal}
          onOpenChange={setShowEmailModal}
          onSuccess={handleEmailSuccess}
          scanId={scanId || undefined}
          domain={scanData?.project || domain}
          score={scanData?.score || 0}
        />

        {/* SEO Content Sections */}
        <div className="space-y-12 pt-8">
          {/* Target Audience Section */}
          <section className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">Built for Any Website That Cares About AI Search Visibility</h2>
            <div className="max-w-3xl mx-auto space-y-3 text-gray-400">
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
            <h2 className="text-3xl font-bold text-center text-white">How Our AI Search Visibility Tool Works</h2>
            <ol className="space-y-3 list-decimal list-inside text-gray-400">
              <li className="pl-2">
                <span className="font-medium text-white">Enter your domain</span> – Provide the website you want to analyze for AI visibility.
              </li>
              <li className="pl-2">
                <span className="font-medium text-white">Add prompts or keywords</span> – Input the questions and search terms your target audience actually uses.
              </li>
              <li className="pl-2">
                <span className="font-medium text-white">Tool uses search API + AI</span> – We fetch real search results and simulate how AI assistants create answers.
              </li>
              <li className="pl-2">
                <span className="font-medium text-white">Check mentions and citations</span> – See if your brand is mentioned in the AI answer and whether it's cited as a source.
              </li>
              <li className="pl-2">
                <span className="font-medium text-white">View competitors and score</span> – Identify which competitors appear instead of you and get an overall AI visibility score.
              </li>
            </ol>
          </section>

          {/* Why It Matters Section */}
          <section className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-center text-white">Why AI SEO Visibility Matters</h2>
            <div className="space-y-3 text-gray-400">
              <p>
                AI-powered search experiences are transforming how users discover information online. Instead of clicking through multiple blue links, users now receive direct answers from AI assistants—often before they even see traditional search results. If your website isn't mentioned or cited in these AI-generated responses, you're missing a critical touchpoint with your audience.
              </p>
              <p>
                This AI seo visibility tool helps you track three essential metrics:
              </p>
              <ul className="space-y-2 list-disc list-inside pl-4">
                <li>
                  <span className="font-medium text-white">AI mentions</span> – Does the AI assistant include your brand name in its answer?
                </li>
                <li>
                  <span className="font-medium text-white">AI citations</span> – Is your website cited as a credible source with a clickable reference?
                </li>
                <li>
                  <span className="font-medium text-white">Competitor coverage</span> – Which competing websites appear in AI answers when yours doesn't?
                </li>
              </ul>
              <p>
                Understanding your AI search visibility allows you to adapt your content strategy, strengthen your brand authority, and stay competitive in an AI-first search landscape.
              </p>
            </div>
          </section>

          {/* Use Cases Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-white">Practical Ways to Use the AI Visibility Checker</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-yellow-400/30">
                <CardHeader>
                  <Users className="h-8 w-8 text-yellow-400 mb-2" />
                  <CardTitle className="text-xl text-white">Agencies</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Run client AI visibility audits as part of SEO reporting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Identify content gaps where competitors dominate AI answers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Track AI visibility improvements over time for client ROI</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-yellow-400/30">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-yellow-400 mb-2" />
                  <CardTitle className="text-xl text-white">SaaS & Online Brands</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Monitor brand mentions in AI assistant responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Prioritize content creation based on AI visibility gaps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Benchmark AI citation performance against competitors</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-yellow-400/30">
                <CardHeader>
                  <Loader2 className="h-8 w-8 text-yellow-400 mb-2" />
                  <CardTitle className="text-xl text-white">Blogs & Local Businesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Discover which topics and keywords drive AI citations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Find local service queries where you should appear</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <span>Optimize content to earn authoritative AI mentions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center text-white">AI Search Visibility Checker – FAQ</h2>
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
              <AccordionItem value="item-1" className="border-gray-700">
                <AccordionTrigger className="text-left text-white hover:text-yellow-400">
                  What is an AI search visibility checker?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  An AI search visibility checker is a tool that shows whether AI assistants like ChatGPT, Perplexity, and Gemini mention and cite your website when answering user questions. Unlike traditional SEO tools that track Google rankings, this AI visibility tool analyzes whether your brand appears in AI-generated answers based on real search results.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-gray-700">
                <AccordionTrigger className="text-left text-white hover:text-yellow-400">
                  How is this AI visibility checker different from normal SEO tools?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Traditional SEO tools focus on blue-link rankings in Google search results. This AI search visibility tool simulates how AI assistants generate answers and checks if your website is mentioned or cited in those AI responses. As AI answers increasingly appear above traditional search results, tracking AI visibility becomes essential for modern SEO strategy.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-gray-700">
                <AccordionTrigger className="text-left text-white hover:text-yellow-400">
                  Who should use this AI search visibility tool?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  This AI visibility checker is valuable for any website type: SaaS companies tracking brand mentions, ecommerce sites monitoring product visibility, blogs optimizing for AI citations, local businesses checking service area coverage, and agencies reporting client AI visibility metrics. If your audience uses AI assistants, you need to track your AI search visibility.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-gray-700">
                <AccordionTrigger className="text-left text-white hover:text-yellow-400">
                  Does running an AI search visibility audit improve my rankings automatically?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  No, this AI visibility tool provides insights and data about your current AI mention and citation performance. Rankings and visibility improve when you take action based on those insights—such as creating better content, earning authoritative citations, and optimizing for the queries where competitors currently outrank you in AI answers.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </div>

      {/* Footer - Dark themed to match site */}
      <footer className="bg-gray-900 border-t border-gray-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Logo and tagline */}
          <div className="flex items-center gap-4 mb-12">
            <img src={logo} alt="AI Mention You" className="w-14 h-14" />
            <div>
              <p className="font-bold text-xl text-white">AI Mention You</p>
              <p className="text-base text-gray-400">Free AI SEO Tools for Modern Marketers</p>
            </div>
          </div>

          {/* Tool Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10 mb-12">
            {/* AI Visibility Tools */}
            <div>
              <h3 className="font-bold text-white mb-5 text-base uppercase tracking-wide">Visibility Tools</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#scan" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    AI Visibility Checker
                  </a>
                </li>
                <li>
                  <a href="/tools/competitor-analyzer" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Competitor Analyzer
                  </a>
                </li>
                <li>
                  <a href="/tools/brand-monitor" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Brand Monitor
                  </a>
                </li>
                <li>
                  <a href="/tools/llm-readiness" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    LLM Readiness Score
                  </a>
                </li>
              </ul>
            </div>

            {/* AI Generators */}
            <div>
              <h3 className="font-bold text-white mb-5 text-base uppercase tracking-wide">AI Generators</h3>
              <ul className="space-y-4">
                <li>
                  <a href="/tools/ai-prompt-generator" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    AI Prompt Generator
                  </a>
                </li>
                <li>
                  <a href="/tools/ai-answer-generator" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    AI Answer Generator
                  </a>
                </li>
                <li>
                  <a href="/tools/ai-email-generator" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    AI Email Generator
                  </a>
                </li>
                <li>
                  <a href="/tools/ai-blog-outline" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    AI Blog Outline
                  </a>
                </li>
              </ul>
            </div>

            {/* Content Tools */}
            <div>
              <h3 className="font-bold text-white mb-5 text-base uppercase tracking-wide">Content Tools</h3>
              <ul className="space-y-4">
                <li>
                  <a href="/tools/ai-faq-generator" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    AI FAQ Generator
                  </a>
                </li>
                <li>
                  <a href="/tools/schema-generator" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Schema Generator
                  </a>
                </li>
                <li>
                  <a href="/tools/meta-optimizer" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Meta Optimizer
                  </a>
                </li>
                <li>
                  <a href="/tools/content-auditor" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Content Auditor
                  </a>
                </li>
              </ul>
            </div>

            {/* More Tools */}
            <div>
              <h3 className="font-bold text-white mb-5 text-base uppercase tracking-wide">More Tools</h3>
              <ul className="space-y-4">
                <li>
                  <a href="/tools/keyword-analyzer" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Keyword Analyzer
                  </a>
                </li>
                <li>
                  <a href="/tools/serp-previewer" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    SERP Previewer
                  </a>
                </li>
                <li>
                  <a href="/tools/title-generator" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Title Generator
                  </a>
                </li>
                <li>
                  <a href="/tools/description-generator" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Description Generator
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-white mb-5 text-base uppercase tracking-wide">Resources</h3>
              <ul className="space-y-4">
                <li>
                  <a href="/tools" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    All 16 Free Tools →
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#use-cases" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Use Cases
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-white mb-5 text-base uppercase tracking-wide">Company</h3>
              <ul className="space-y-4">
                <li>
                  <a href="/about" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    About
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-base text-yellow-400 hover:text-yellow-300 hover:underline transition-colors font-medium">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-base text-gray-400">
                © {new Date().getFullYear()} AI Mention You. All rights reserved.
              </p>
              <a href="mailto:hello@aimentionyou.com" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                hello@aimentionyou.com
              </a>
            </div>
            <p className="text-sm text-gray-500 text-center md:text-right max-w-lg">
              This AI search visibility audit tool estimates visibility using public web results and simulated AI answer generation.
            </p>
          </div>
        </div>
      </footer>
      
      {/* Guest Limit Modal */}
      <GuestLimitModal 
        open={showGuestLimitModal} 
        onOpenChange={setShowGuestLimitModal} 
      />
      </div>
    </div>
  );
};

export default Index;
