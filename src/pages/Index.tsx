import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, TrendingUp, CheckCircle2, Users, Lock, FileText, Mail, Sparkles, ArrowRight, ChevronDown, Target, MessageSquare, Swords, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useABTest } from "@/hooks/useABTest";
import { useAuth } from "@/hooks/useAuth";

import { ImprovementRoadmap } from "@/components/ImprovementRoadmap";
import { generateEnhancedCSV } from "@/utils/csvExport";
import { EmailCaptureModal } from "@/components/EmailCaptureModal";
import { LockedOverlay } from "@/components/LockedOverlay";
import { GuestLimitModal } from "@/components/GuestLimitModal";
import { Header } from "@/components/Header";
import { ScanResultsModal } from "@/components/ScanResultsModal";
import { OptimizationHub } from "@/components/OptimizationHub";
import { ScanProgressBar } from "@/components/ScanProgressBar";
import { IndustryBenchmarkStrip } from "@/components/IndustryBenchmarkStrip";
import { WhyCompetitorsWinPreview } from "@/components/WhyCompetitorsWinPreview";
import { LandingBenchmarkTeaser } from "@/components/LandingBenchmarkTeaser";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

const BUSINESS_TYPE_PROMPTS: Record<string, string[]> = {
  SaaS: [
    "best {domain} alternatives",
    "is {domain} worth it for small teams",
    "top software tools like {domain}",
  ],
  Ecommerce: [
    "best online store for {domain} products",
    "is {domain} legit and safe to buy from",
    "{domain} reviews and customer experience",
  ],
  Agency: [
    "best {domain} type agencies near me",
    "how much does {domain} charge for services",
    "top agencies like {domain} for startups",
  ],
  Other: [
    "what is {domain} and what do they do",
    "is {domain} trustworthy",
    "{domain} vs competitors",
  ],
};

const Index = () => {
  const [domain, setDomain] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [selectedBusinessType, setSelectedBusinessType] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { toast } = useToast();
  const { trackEvent } = useActivityTracking();
  
  // Auth and guest scan tracking
  const { user } = useAuth();
  
  // A/B Testing for headlines and CTAs
  const { variant: headlineVariant, trackConversion: trackHeadlineConversion } = useABTest('headline');
  const { variant: ctaVariant, trackConversion: trackCtaConversion } = useABTest('cta');
  
  // Default values while loading - repositioned around Recommendation Intelligence
  const headline = headlineVariant?.value || 'See Exactly Why AI Recommends Competitors Instead of You';
  const ctaText = ctaVariant?.value || 'Find My Opportunities — Free';

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

  // Homepage schema (P2)
  useEffect(() => {
    const id = "homepage-schema";
    document.getElementById(id)?.remove();
    const s = document.createElement("script");
    s.id = id;
    s.type = "application/ld+json";
    s.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "AI Mention You — AI Search Visibility Checker",
        applicationCategory: "SEO Tool",
        description: "Free AI search visibility checker and AI visibility platform. Track brand mentions across ChatGPT, Gemini, and Perplexity, and fix what's invisible.",
        url: "https://aimentionyou.com/",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },

      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What is AI Mention You?", acceptedAnswer: { "@type": "Answer", text: "AI Mention You shows whether AI assistants like ChatGPT, Perplexity, and Gemini mention and cite your website when answering user questions." } },
          { "@type": "Question", name: "How is AI Mention You different from normal SEO tools?", acceptedAnswer: { "@type": "Answer", text: "Traditional SEO tools focus on blue-link rankings. AI Mention You checks if your website is mentioned in AI-generated answers." } },
          { "@type": "Question", name: "Who should use AI Mention You?", acceptedAnswer: { "@type": "Answer", text: "Any website whose audience uses AI assistants: SaaS, ecommerce, blogs, local businesses, and agencies." } },
          { "@type": "Question", name: "Does running an AI visibility scan improve my rankings automatically?", acceptedAnswer: { "@type": "Answer", text: "No. AI Mention You provides data and insights. Rankings improve when you act on those insights." } },
        ],
      },
    ]);
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
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
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]"
              >
                AI Search Visibility Checker.
                <br />
                <span className="text-yellow-400">Stop Being Invisible to AI.</span>
              </h1>
              <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
                The AI visibility platform that tracks brand mentions in ChatGPT, Gemini, and Perplexity. Learn how to track brand mentions in AI search and fix what's broken — with a personalised, prioritised action plan.
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
                  Most brands score below 30/100. See where you stand.
                </p>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <div className="flex -space-x-2">
                  {[
                    "bg-gradient-to-br from-pink-400 to-red-500",
                    "bg-gradient-to-br from-yellow-400 to-orange-500",
                    "bg-gradient-to-br from-green-400 to-emerald-600",
                    "bg-gradient-to-br from-blue-400 to-indigo-600",
                    "bg-gradient-to-br from-purple-400 to-fuchsia-600",
                  ].map((bg, i) => (
                    <div
                      key={i}
                      className={`h-8 w-8 rounded-full ring-2 ring-black ${bg} flex items-center justify-center text-[10px] font-bold text-white`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-gray-300">
                  <span className="font-bold text-yellow-400">500+ brands</span> tracking their AI visibility
                </p>
              </div>
            </div>
          </div>

        {/* Scan Input Section */}
        {!scanData && (
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
              <label className="text-sm font-medium text-gray-300">
                What's your business type?
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(BUSINESS_TYPE_PROMPTS).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={selectedBusinessType === type ? "default" : "outline"}
                    size="sm"
                    disabled={isScanning || isGeneratingPrompts}
                    className={
                      selectedBusinessType === type
                        ? "bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                        : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }
                    onClick={() => {
                      setSelectedBusinessType(type);
                      const domainName = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'yourdomain.com';
                      const prompts = BUSINESS_TYPE_PROMPTS[type]
                        .map((p) => p.replace(/\{domain\}/g, domainName))
                        .join('\n');
                      setPromptsText(prompts);
                      trackEvent('business_type_selected', { type });
                    }}
                  >
                    {type}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={selectedBusinessType === 'Custom' ? "default" : "outline"}
                  size="sm"
                  disabled={isScanning || isGeneratingPrompts}
                  className={
                    selectedBusinessType === 'Custom'
                      ? "bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }
                  onClick={() => setSelectedBusinessType('Custom')}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Custom
                </Button>
              </div>

              {selectedBusinessType === 'Custom' && (
                <div className="mt-3 space-y-2">
                  <Input
                    placeholder="Describe your business, e.g. 'Online pet food subscription service'"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    disabled={isGeneratingPrompts}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={isGeneratingPrompts || !customDescription.trim()}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                    onClick={async () => {
                      setIsGeneratingPrompts(true);
                      trackEvent('custom_prompts_generation', { description: customDescription });
                      try {
                        const { data, error } = await supabase.functions.invoke('generate-prompts', {
                          body: {
                            industry: customDescription.trim(),
                            businessDescription: customDescription.trim(),
                            targetAudience: 'general',
                          },
                        });
                        if (error) throw error;
                        const prompts = (data.prompts || [])
                          .slice(0, 5)
                          .map((p: any) => p.prompt || p)
                          .join('\n');
                        setPromptsText(prompts);
                        toast({ title: 'Prompts generated!', description: '5 AI-tailored prompts added.' });
                      } catch (err) {
                        console.error('Prompt generation error:', err);
                        toast({ title: 'Generation failed', description: 'Please try again or enter prompts manually.', variant: 'destructive' });
                      } finally {
                        setIsGeneratingPrompts(false);
                      }
                    }}
                  >
                    {isGeneratingPrompts ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1 h-3 w-3" />
                        Generate Prompts with AI
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="prompts" className="text-sm font-medium text-gray-300">
                Prompts/Keywords (one per line)
              </label>
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
    Scanning your brand across AI platforms...
  </>
) : (
  "Run Free AI Scan"
)}
            </Button>

            <ScanProgressBar isScanning={isScanning} />
          </CardContent>
        </Card>
        </section>
        )}

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
                      Your score: {scanData.score}/100 — based on how often AI assistants mention and cite your brand for category queries. Industry average: 34/100.
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
              {/* What this means - explainer */}
              <div className="mb-5 p-4 rounded-lg bg-muted/40 border border-border/60">
                <p className="text-sm font-medium mb-1">What this shows</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  For each prompt we asked the AI engines about your category, we measured how visible your brand was.
                  <span className="block mt-1">
                    <span className="font-medium text-foreground">Mentioned</span> = your brand name appeared in the AI's answer.{" "}
                    <span className="font-medium text-foreground">Cited</span> = your website was linked as a source.
                  </span>
                  <span className="block mt-1">
                    The bar shows your <span className="font-medium text-foreground">visibility score</span> for that prompt across Google Gemini and ChatGPT-style search results (0–100%).
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                {scanData.results.map((result, idx) => {
                  const isLocked = !isUnlocked && idx >= FREE_PREVIEW_COUNT;

                  // Per-prompt visibility: 4 signals (search mention, search cite, gemini mention, gemini cite)
                  const signals = [
                    result.mentioned,
                    result.cited,
                    result.geminiMentioned,
                    result.geminiCited,
                  ];
                  const hits = signals.filter(Boolean).length;
                  const pct = Math.round((hits / signals.length) * 100);

                  const barColor =
                    pct >= 70 ? "bg-success" : pct >= 40 ? "bg-yellow-500" : "bg-destructive";

                  return (
                    <div
                      key={idx}
                      className={`p-4 border rounded-lg ${isLocked ? "relative" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <p className={`font-medium text-sm flex-1 ${isLocked ? "blur-sm select-none" : ""}`}>
                          {idx + 1}. {isLocked ? "Locked prompt content — unlock to view" : result.prompt}
                        </p>
                        <span
                          className={`text-sm font-bold whitespace-nowrap ${
                            isLocked ? "blur-sm select-none" : ""
                          } ${
                            pct >= 70 ? "text-success" : pct >= 40 ? "text-yellow-500" : "text-destructive"
                          }`}
                        >
                          {pct}% visible
                        </span>
                      </div>

                      {/* Bar graph */}
                      <div className={`h-3 w-full bg-secondary rounded-full overflow-hidden ${isLocked ? "blur-sm" : ""}`}>
                        <div
                          className={`h-full ${barColor} transition-all`}
                          style={{ width: `${isLocked ? 30 : pct}%` }}
                        />
                      </div>

                      {/* Signal breakdown chips */}
                      <div className={`flex flex-wrap gap-2 mt-3 text-xs ${isLocked ? "blur-sm select-none" : ""}`}>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            result.geminiMentioned
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {result.geminiMentioned ? "✓" : "—"} Gemini mentioned you
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            result.geminiCited
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {result.geminiCited ? "✓" : "—"} Gemini cited your site
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            result.mentioned
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {result.mentioned ? "✓" : "—"} ChatGPT/Search mentioned you
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            result.cited
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {result.cited ? "✓" : "—"} ChatGPT/Search cited your site
                        </span>
                      </div>

                      {!isLocked && result.geminiCompetitors && result.geminiCompetitors.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-3">
                          <span className="font-medium text-foreground">Competitors appearing here:</span>{" "}
                          {result.geminiCompetitors.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

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
            </CardContent>
          </Card>
        )}

        {scanData && isUnlocked && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setScanData(null);
                setIsUnlocked(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Scan another domain →
            </Button>
          </div>
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

        {/* Upgrade CTA — high-intent moment after email unlock */}
        {scanData && isUnlocked && !user && (
          <div className="rounded-lg border-2 border-yellow-400 bg-yellow-400/10 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-yellow-400 text-base md:text-lg font-bold">
                  Track your score weekly
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  Get automated weekly scans, competitor alerts, and an action plan — <span className="text-white font-semibold">starting at $19/mo</span>.
                </p>
              </div>
            </div>
            <Link to="/pricing" onClick={() => trackEvent('upgrade_cta_click', { source: 'post_unlock_banner', score: scanData.score })}>
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold whitespace-nowrap">
                Upgrade to Pro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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

        {/* Post-Optimization Plan CTA — peak intent for non-logged-in users */}
        {scanData && !user && (
          <div className="mt-8 rounded-2xl border-2 border-yellow-400 bg-black p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-yellow-400 mb-2">
                  Save this optimization plan to your dashboard
                </h3>
                <p className="text-sm md:text-base text-gray-300">
                  Get weekly progress tracking, competitor alerts, and AI-powered task suggestions.
                </p>
              </div>
              <Link to="/auth" className="shrink-0">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-yellow-400 text-black hover:bg-yellow-300 font-bold"
                >
                  Create Free Account →
                </Button>
              </Link>
            </div>
          </div>
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
