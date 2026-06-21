import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, TrendingUp, CheckCircle2, Users, Lock, FileText, Mail, Sparkles, ArrowRight, ChevronDown, Target, MessageSquare, Swords, Wrench, AlertTriangle, TrendingDown, Zap, Trophy, Bot, Clock } from "lucide-react";
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
// ScanResultsModal removed — results render inline as unified Recommendation Intelligence preview
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
  classification?: {
    industry_id: string | null;
    industry_slug: string | null;
    topic_cluster_id: string | null;
    topic_cluster_slug: string | null;
    confidence: number;
    reasoning: string;
    method: 'llm' | 'heuristic' | 'none';
  };
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
    if (!domain.trim()) {
      toast({
        title: "Domain required",
        description: "Enter your domain to find your opportunities.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanData(null);
    setScanId(null);
    setIsUnlocked(false);
    setUnlockedEmail(null);

    try {
      // Auto-generate prompts if user did not supply any
      let finalPrompts = promptsText.trim();
      if (!finalPrompts) {
        const domainName = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        try {
          const { data: gen, error: genErr } = await supabase.functions.invoke('generate-prompts', {
            body: {
              industry: 'general',
              businessDescription: `Website ${domainName}${competitor.trim() ? ` competing with ${competitor.trim()}` : ''}`,
              targetAudience: 'general',
            },
          });
          if (genErr) throw genErr;
          finalPrompts = ((gen?.prompts || []) as any[])
            .slice(0, 5)
            .map((p: any) => (p.prompt || p))
            .join('\n');
        } catch (e) {
          console.warn('Auto prompt generation failed, falling back', e);
        }
        if (!finalPrompts) {
          finalPrompts = BUSINESS_TYPE_PROMPTS.Other
            .map((p) => p.replace(/\{domain\}/g, domainName))
            .join('\n');
        }
        setPromptsText(finalPrompts);
      }

      // Check subscription limits for logged-in users (now that we know prompt count)
      const promptCount = finalPrompts.split(/[\n,]/).filter(p => p.trim()).length;
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
            if (plan.scans_limit !== -1 && (sub.scans_used ?? 0) >= plan.scans_limit) {
              toast({ title: 'Scan limit reached', description: 'Please upgrade your plan to continue scanning.', variant: 'destructive' });
              setIsScanning(false);
              return;
            }
            if ((sub.prompts_used ?? 0) + promptCount > plan.prompts_limit) {
              toast({ title: 'Prompt limit reached', description: `You have ${plan.prompts_limit - (sub.prompts_used ?? 0)} prompts remaining. Please upgrade your plan.`, variant: 'destructive' });
              setIsScanning(false);
              return;
            }
          }
        }
      }

      trackEvent('scan_started', {
        domain: domain.trim(),
        competitor: competitor.trim() || null,
        prompt_count: promptCount,
        auto_generated_prompts: !promptsText.trim(),
        is_authenticated: !!user,
      });
      trackEvent('scan_initiated', {
        domain: domain.trim(),
        competitor: competitor.trim() || null,
        prompt_count: promptCount,
        auto_generated_prompts: !promptsText.trim(),
        is_authenticated: !!user,
      });

      const { data, error } = await supabase.functions.invoke('scan', {
        body: {
          domain: domain.trim(),
          competitor: competitor.trim() || undefined,
          promptsText: finalPrompts,
          market: 'en-US',
          userId: user?.id,
        },
      });

      if (error) throw error;

      setScanData(data);
      if (data.scanId) {
        setScanId(data.scanId);
        // Persist for post-signup claim
        if (!user) {
          try { localStorage.setItem('pendingScanId', data.scanId); } catch {}
        }
      }
      // Scroll to results + track results_viewed
      setTimeout(() => {
        document.getElementById('scan-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        trackEvent('results_viewed', {
          domain: domain.trim(),
          score: data.score,
          prompts_count: data.promptsCount,
          is_authenticated: !!user,
        });
      }, 100);
      
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
          {/* Hero Section — Recommendation Intelligence positioning */}
          <div className="py-12 md:py-16 px-6 -mx-4 md:-mx-8">
            <div className="text-center space-y-6">
              <span className="inline-block px-3 py-1 bg-yellow-400/15 text-yellow-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                Recommendation Intelligence
              </span>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]"
              >
                Why AI Recommends Your Competitors — <span className="text-yellow-400">Not You.</span>
              </h1>
              <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
                Recommendation Intelligence reveals the asset gaps and citation patterns winning your industry across ChatGPT, Gemini, and Perplexity — in under 60 seconds.
              </p>

              <div className="pt-2">
                <Button
                  onClick={scrollToScan}
                  size="lg"
                  className="font-semibold bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  {ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-gray-400 mt-3">
                  The average brand misses 7 of the top 10 citation patterns in its industry.
                </p>
              </div>

              {/* AI engine trust row */}
              <div className="flex flex-col items-center gap-3 pt-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Analyzing recommendations from
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {["ChatGPT", "Gemini", "Perplexity", "Claude"].map((engine) => (
                    <span
                      key={engine}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs font-medium"
                    >
                      <Sparkles className="h-3 w-3 text-yellow-400" />
                      <span className="text-yellow-400">{engine}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500">
                  Updated continuously · Citation-grade evidence
                </p>
              </div>
            </div>
          </div>

          {/* Example competitor intelligence report — static illustrative output */}
          {!scanData && (
            <section className="py-2">
              <div className="text-center mb-4 space-y-1">
                <span className="inline-block px-2 py-0.5 bg-yellow-400/15 text-yellow-400 text-[10px] font-semibold rounded uppercase tracking-wider">
                  Example output
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white">What you get back in 60 seconds</h2>
                <p className="text-xs md:text-sm text-gray-400">
                  A real-shape report — this is what every scan returns.
                </p>
              </div>

              <Card className="bg-gray-900 border-yellow-400/40 shadow-[0_0_30px_rgba(250,204,21,0.08)]">
                <CardHeader className="pb-3 border-b border-gray-800">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500">Domain scanned</div>
                      <CardTitle className="text-white text-base md:text-lg">project-management.com</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                        Top Recommendation
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
                        Not Mentioned
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-5">
                  {/* Prompt */}
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Prompt tested</div>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm md:text-base text-white font-medium">
                        "best project management software for remote teams"
                      </div>
                    </div>
                  </div>

                  {/* Who got cited */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-black/40 border border-gray-800">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">AI cited</div>
                      <div className="flex flex-wrap gap-1.5">
                        {["Asana", "Monday", "ClickUp"].map((c) => (
                          <span key={c} className="text-xs px-2 py-1 rounded bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-gray-800">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Your brand</div>
                      <div className="text-sm text-red-300 font-medium flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" /> Not mentioned in any answer
                      </div>
                    </div>
                  </div>

                  {/* Why they win */}
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Swords className="h-3 w-3 text-yellow-400" /> Why competitors win
                    </div>
                    <div className="space-y-2">
                      {[
                        { brand: "Asana", reason: "Strong on /alternatives pages + active on Reddit r/productivity" },
                        { brand: "Monday", reason: 'Owns 4 listicles ("Top 10 PM tools 2026") in AI training data' },
                        { brand: "ClickUp", reason: "Claimed G2 & Capterra profiles, active public changelog" },
                      ].map((item) => (
                        <div key={item.brand} className="flex items-start gap-2 p-2.5 rounded bg-black/40 border border-gray-800">
                          <span className="text-xs font-semibold text-yellow-400 min-w-[60px]">{item.brand}</span>
                          <span className="text-xs text-gray-300 leading-snug">{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Your move */}
                  <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/40">
                    <div className="flex items-start gap-3">
                      <Wrench className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-yellow-400 mb-1">Your move</div>
                        <div className="text-sm md:text-base text-white font-semibold">
                          Publish "/alternatives/asana" + claim your G2 profile
                        </div>
                        <div className="text-xs text-yellow-300/80 mt-1">
                          Expected impact: <span className="font-semibold">High</span> · Top recommendation
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={scrollToScan}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  >
                    Run this on your domain
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </section>
          )}

          {/* How AI Chooses Brands */}
          {!scanData && (
            <section className="py-6">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white">How AI Chooses Brands</h2>
                <p className="text-xs md:text-sm text-gray-400 mt-1">The loop we close for you.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { icon: MessageSquare, label: "AI Question", desc: "Buyers ask ChatGPT, Gemini, Perplexity.", example: '"best CRM for small agencies"' },
                  { icon: Users, label: "Competitor Appears", desc: "Someone else gets named — not you.", example: "Cited via a G2 comparison page" },
                  { icon: Swords, label: "We Show Why", desc: "Asset gaps + citation patterns.", example: "Missing: comparison pages, Reddit, reviews" },
                  { icon: Wrench, label: "You Fix It", desc: "Evidence-bound action plan.", example: 'Ship "/vs/competitor" + claim G2' },
                  { icon: Target, label: "AI Names You", desc: "Visibility compounds week over week.", example: "Mentions appear in ~2 weeks" },
                ].map((step, i) => (
                  <div key={step.label} className="relative">
                    <Card className="bg-gray-900 border-gray-800 h-full">
                      <CardContent className="p-3 md:p-4 text-center space-y-2">
                        <step.icon className="h-5 w-5 text-yellow-400 mx-auto" />
                        <div className="text-xs md:text-sm font-semibold text-white">{step.label}</div>
                        <div className="text-[10px] md:text-xs text-gray-400 leading-tight">{step.desc}</div>
                        <div className="text-[10px] text-yellow-400/70 italic leading-tight pt-1 border-t border-gray-800">
                          {step.example}
                        </div>
                      </CardContent>
                    </Card>
                    {i < 4 && (
                      <ArrowRight className="hidden md:block absolute top-1/2 -right-2 -translate-y-1/2 h-3 w-3 text-yellow-400/60" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}



        {/* Scan Input Section — simplified single-field flow */}
        {!scanData && (
        <section id="scan" className="scroll-mt-8">
          <Card className="shadow-lg bg-gray-900 border-yellow-400/40">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-yellow-400" />
              Find your AI opportunities
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your domain. We'll auto-generate the right prompts and benchmark you against your industry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="domain" className="text-sm font-medium text-gray-300">
                  Your domain <span className="text-red-400">*</span>
                </label>
                <Input
                  id="domain"
                  placeholder="yourbrand.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onFocus={() => trackEvent('form_interaction', { field: 'domain' })}
                  disabled={isScanning}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="competitor" className="text-sm font-medium text-gray-300">
                  Top competitor <span className="text-gray-500 text-xs font-normal">(optional)</span>
                </label>
                <Input
                  id="competitor"
                  placeholder="competitor.com"
                  value={competitor}
                  onChange={(e) => setCompetitor(e.target.value)}
                  onFocus={() => trackEvent('form_interaction', { field: 'competitor' })}
                  disabled={isScanning}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <Button
              onClick={handleScan}
              disabled={isScanning || !domain.trim()}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
              size="lg"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing your industry...
                </>
              ) : (
                <>
                  {ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <ScanProgressBar isScanning={isScanning} />

            {/* Advanced collapsible — prompt customization is now optional */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 pt-2"
                  disabled={isScanning}
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  Advanced: customize prompts
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Business type
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
                    Leave blank to auto-generate. Max 15 prompts.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        </section>
        )}


        {/* Unified post-scan Recommendation Intelligence preview */}
        {scanData && (() => {
          const totalPrompts = scanData.results.length;
          const mentionedCount = scanData.results.filter(
            (r) => r.mentioned || r.geminiMentioned || r.perplexityMentioned
          ).length;
          const promptsMissingIn = totalPrompts - mentionedCount;

          // Top competitor across all prompts
          const compCounts = new Map<string, number>();
          for (const r of scanData.results) {
            const unique = new Set(
              [...(r.geminiCompetitors || []), ...(r.perplexityCompetitors || [])]
                .map((c) => c.trim().toLowerCase())
                .filter(Boolean)
            );
            for (const c of unique) compCounts.set(c, (compCounts.get(c) || 0) + 1);
          }
          const topComp = Array.from(compCounts.entries()).sort((a, b) => b[1] - a[1])[0];

          // Top 3 opportunity prompts — missing prompts with competitors named first
          const oppRanked = [...scanData.results]
            .filter((r) => !r.mentioned && !r.geminiMentioned && !r.perplexityMentioned)
            .sort((a, b) => {
              const ac = (a.geminiCompetitors?.length || 0) + (a.perplexityCompetitors?.length || 0);
              const bc = (b.geminiCompetitors?.length || 0) + (b.perplexityCompetitors?.length || 0);
              return bc - ac;
            })
            .slice(0, 3);

          // Top citation source domain among competitors (asset hint)
          const domainCounts = new Map<string, number>();
          for (const r of scanData.results) {
            for (const d of r.topCitedDomains || []) {
              const key = d.toLowerCase().replace(/^www\./, '');
              if (key && !key.includes(scanData.project.toLowerCase())) {
                domainCounts.set(key, (domainCounts.get(key) || 0) + 1);
              }
            }
          }
          const topSource = Array.from(domainCounts.entries()).sort((a, b) => b[1] - a[1])[0];
          const assetHint = topSource
            ? (topSource[0].includes('reddit') ? 'Reddit discussions'
              : topSource[0].includes('g2') || topSource[0].includes('capterra') ? 'review profiles'
              : topSource[0].includes('vs') || topSource[0].includes('comparison') ? 'comparison pages'
              : 'authoritative citation pages')
            : 'comparison pages and review profiles';

          const topGapLabel = topSource ? assetHint : 'Comparison Pages';
          const topOppLabel = oppRanked[0]
            ? `Create content for "${oppRanked[0].prompt.slice(0, 48)}${oppRanked[0].prompt.length > 48 ? '…' : ''}"`
            : 'Expand topical coverage';

          const scoreColor =
            scanData.score >= 70 ? "text-green-400" : scanData.score >= 40 ? "text-yellow-400" : "text-red-400";

          const signupHref = scanId
            ? `/auth?mode=signup&redirect=${encodeURIComponent(`/dashboard?tab=recommendations&scanId=${scanId}`)}`
            : `/auth?mode=signup&redirect=${encodeURIComponent('/dashboard?tab=recommendations')}`;
          const dashboardHref = scanId
            ? `/dashboard?tab=recommendations&scanId=${scanId}`
            : `/dashboard?tab=recommendations`;
          const beatLabel = topComp
            ? `Let's beat ${topComp[0]}`
            : `Let's rank ${scanData.project} inside AI answers`;

          return (
            <div id="scan-results" className="space-y-5 scroll-mt-24">
              {/* HERO — Opportunity Summary */}
              <Card className="bg-gradient-to-br from-yellow-400/10 via-black to-black border-yellow-400/40">
                <CardContent className="p-5 md:p-7 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="text-xs uppercase tracking-wider text-yellow-400 font-semibold">
                        Recommendation Intelligence • {scanData.project}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        You appeared in <span className="text-yellow-400">{mentionedCount}/{totalPrompts}</span> prompts
                      </h2>
                      {topComp && (
                        <p className="text-sm md:text-base text-gray-300">
                          <span className="capitalize font-semibold text-white">{topComp[0]}</span> appeared in <span className="text-red-400 font-semibold">{topComp[1]}/{totalPrompts}</span> prompts.
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500">Visibility score</div>
                      <div className={`text-2xl font-bold ${scoreColor}`}>{scanData.score}<span className="text-sm text-gray-500">/100</span></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
                      <Target className="h-3 w-3" />
                      Top Gap: {topGapLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-medium">
                      <Sparkles className="h-3 w-3" />
                      Top Opportunity: {topOppLabel}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* SCAN CONTEXT — classification metadata */}
              {scanData.classification && scanData.classification.method !== 'none' && (
                <Card className="bg-gray-900/60 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider">Industry</span>{' '}
                        <span className="text-white font-medium capitalize">
                          {scanData.classification.industry_slug?.replace(/-/g, ' ') ?? '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider">Topic Cluster</span>{' '}
                        <span className="text-white font-medium capitalize">
                          {scanData.classification.topic_cluster_slug?.replace(/-/g, ' ') ?? 'General'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider">Confidence</span>{' '}
                        <span className="text-yellow-400 font-semibold">
                          {Math.round(scanData.classification.confidence * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase tracking-wider">Method</span>{' '}
                        <span className="text-gray-300 font-mono">{scanData.classification.method}</span>
                      </div>
                    </div>
                    {scanData.classification.reasoning && (
                      <p className="mt-2 text-xs text-gray-400 italic">
                        “{scanData.classification.reasoning}”
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}


              {/* WHY COMPETITORS WIN — one insight */}
              {topComp && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Swords className="h-4 w-4 text-red-400" />
                      Why <span className="capitalize">{topComp[0]}</span> wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      AI named <span className="capitalize text-white font-semibold">{topComp[0]}</span> because they
                      have stronger {assetHint}
                      {topSource ? <> — e.g. citations from <span className="text-yellow-400 font-mono text-xs">{topSource[0]}</span></> : null}.
                      Your domain is missing from {promptsMissingIn} of {totalPrompts} prompts where they appear.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* TOP 3 OPPORTUNITIES (preview) */}
              {oppRanked.length > 0 && (
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-yellow-400" />
                      Top 3 opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {oppRanked.map((r, i) => {
                      const comps = [...(r.geminiCompetitors || []), ...(r.perplexityCompetitors || [])]
                        .filter(Boolean).slice(0, 2);
                      return (
                        <div key={i} className="p-3 border border-gray-800 rounded-lg bg-black/30">
                          <div className="text-sm text-white font-medium mb-1">
                            {i + 1}. "{r.prompt}"
                          </div>
                          <div className="text-xs text-gray-400">
                            {comps.length > 0 ? (
                              <>Cited: <span className="text-gray-200">{comps.join(', ')}</span> — you're missing.</>
                            ) : (
                              <>You're missing from this prompt entirely.</>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {promptsMissingIn > 3 && (
                      <p className="text-xs text-gray-500 pt-1">
                        +{promptsMissingIn - 3} more opportunities in the full report.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* LOCKED PREMIUM SECTIONS — blurred teaser */}
              <Card className="bg-gray-900 border-gray-800 relative overflow-hidden">
                <CardContent className="p-5 space-y-3 select-none pointer-events-none [filter:blur(4px)]">
                  <div className="text-sm font-semibold text-white">Full Recommendation Intelligence</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'Full Why Competitors Win breakdown',
                      'Full Recommendation Intelligence (50+ actions)',
                      'Industry Benchmark vs your score',
                      'Citation Sources for every prompt',
                      'Competitor Asset Breakdown',
                      'Full Action Plan (prioritized)',
                    ].map((s) => (
                      <div key={s} className="p-3 rounded-lg bg-black/40 border border-gray-800 text-xs text-gray-300 h-16">
                        {s}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-center p-6">
                  <div className="text-center space-y-2">
                    <Lock className="h-6 w-6 text-yellow-400 mx-auto" />
                    <p className="text-sm text-gray-300">6 premium sections unlocked with a free account</p>
                  </div>
                </div>
              </Card>

              {/* CTA — single, primary */}
              {user ? (
                <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-400/10 to-black">
                  <CardContent className="p-6 text-center space-y-3">
                    <p className="text-white">Your scan is saved. Continue in your dashboard for the full report.</p>
                    <Link
                      to={dashboardHref}
                      onClick={() => trackEvent('signup_cta_click', { source: 'results_signed_in', score: scanData.score })}
                    >
                      <Button size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold">
                        Open Full Recommendation Intelligence
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-400/10 to-black">
                  <CardContent className="p-6 md:p-8 space-y-5">
                    <div className="text-center space-y-2">
                      <Lock className="h-8 w-8 text-yellow-400 mx-auto" />
                      <h3 className="text-xl md:text-2xl font-bold text-white">
                        Create Free Account to Unlock Full Report
                      </h3>
                      <p className="text-sm text-gray-300 max-w-xl mx-auto">
                        We'll save this scan and drop you straight into the Recommendation Intelligence dashboard. No card, no email verification.
                      </p>
                    </div>

                    <div className="flex justify-center pt-1">
                      <Link
                        to={signupHref}
                        onClick={() => trackEvent('signup_cta_click', { source: 'results_wall', score: scanData.score })}
                      >
                        <Button size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold">
                          {beatLabel} — Sign up free
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    <p className="text-center text-xs text-gray-500">
                      Free forever plan. Upgrade only when you want weekly tracking.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => { setScanData(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  size="sm"
                >
                  Scan another →
                </Button>
              </div>
            </div>
          );
        })()}



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
          {/* Industry Benchmarks + Why Competitors Win teaser */}
          <LandingBenchmarkTeaser />

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
