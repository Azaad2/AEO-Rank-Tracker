import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Sparkles, Target, Zap, CheckCircle2, AlertTriangle, Users, Loader2, Wand2, Wrench, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useAuth } from "@/hooks/useAuth";


interface ScanResult {
  prompt: string;
  mentioned: boolean;
  cited: boolean;
  citationRank: number | null;
  topCitedDomains: string[];
  debug: { usedResults: string[] };
  geminiMentioned: boolean;
  geminiCited: boolean;
  geminiResponse: string;
  geminiCompetitors: string[];
  perplexityMentioned?: boolean;
  perplexityCited?: boolean;
  perplexityResponse?: string;
  perplexityCompetitors?: string[];
}

interface ScanResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanData: {
    project: string;
    promptsCount: number;
    score: number;
    results: ScanResult[];
    scanId?: string;
  } | null;
  isUnlocked: boolean;
  onUnlock: (email: string) => void;
  freePreviewCount?: number;
}

const calculateAIVisibility = (results: ScanResult[]) => {
  const total = results.length;
  if (total === 0) return {
    gemini: { mentions: 0, citations: 0, overall: 0 },
    search: { mentions: 0, citations: 0, overall: 0 },
    perplexity: { mentions: 0, citations: 0, overall: 0 },
    combined: 0
  };
  
  const geminiMentions = results.filter(r => r.geminiMentioned).length;
  const geminiCitations = results.filter(r => r.geminiCited).length;
  const geminiVisibility = Math.round(((geminiMentions + geminiCitations) / (total * 2)) * 100);
  
  const searchMentions = results.filter(r => r.mentioned).length;
  const searchCitations = results.filter(r => r.cited).length;
  const searchVisibility = Math.round(((searchMentions + searchCitations) / (total * 2)) * 100);

  const perplexityMentions = results.filter(r => r.perplexityMentioned).length;
  const perplexityCitations = results.filter(r => r.perplexityCited).length;
  const perplexityVisibility = Math.round(((perplexityMentions + perplexityCitations) / (total * 2)) * 100);
  
  return {
    gemini: {
      mentions: Math.round((geminiMentions / total) * 100),
      citations: Math.round((geminiCitations / total) * 100),
      overall: geminiVisibility
    },
    search: {
      mentions: Math.round((searchMentions / total) * 100),
      citations: Math.round((searchCitations / total) * 100),
      overall: searchVisibility
    },
    perplexity: {
      mentions: Math.round((perplexityMentions / total) * 100),
      citations: Math.round((perplexityCitations / total) * 100),
      overall: perplexityVisibility
    },
    combined: Math.round((geminiVisibility * 0.40) + (searchVisibility * 0.25) + (perplexityVisibility * 0.35))
  };
};

const getScoreColor = (score: number) => {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
};

const getProgressColor = (score: number) => {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

// Get unique competitors from all results
const getUniqueCompetitors = (results: ScanResult[]): string[] => {
  const allCompetitors = results.flatMap(r => [
    ...(r.geminiCompetitors || []),
    ...(r.perplexityCompetitors || []),
    ...(r.topCitedDomains || [])
  ]);
  return [...new Set(allCompetitors)].slice(0, 5);
};

type Issue = {
  id: string;
  severity: "high" | "med" | "low";
  title: string;
  evidence: string;
  fixType: string;
  category: string;
};

const deriveIssues = (results: ScanResult[], score: number, competitors: string[]): Issue[] => {
  const issues: Issue[] = [];
  const total = results.length || 1;

  const geminiCited = results.filter(r => r.geminiCited).length;
  const perpCited = results.filter(r => r.perplexityCited).length;
  const searchMentioned = results.filter(r => r.mentioned).length;
  const anyCited = results.some(r => r.cited || r.geminiCited || r.perplexityCited);

  if (perpCited === 0) {
    issues.push({ id: "no-perp-cite", severity: "high", category: "Perplexity",
      title: "Not cited on Perplexity",
      evidence: `Cited in 0/${total} Perplexity responses — Perplexity loves Article schema.`,
      fixType: "article_schema" });
  }
  if (geminiCited < total / 2) {
    issues.push({ id: "low-gemini-cite", severity: "high", category: "Gemini",
      title: "Weak citations on Gemini",
      evidence: `Cited in ${geminiCited}/${total} Gemini responses. Add FAQ schema + answer-style content.`,
      fixType: "faq_schema" });
  }
  if (searchMentioned < total / 2) {
    issues.push({ id: "low-search-mention", severity: "med", category: "Search/ChatGPT",
      title: "Low search mentions",
      evidence: `Mentioned in ${searchMentioned}/${total} search results. Expand content depth + internal links.`,
      fixType: "content_expand" });
  }
  if (competitors.length > 0) {
    issues.push({ id: "competitors", severity: "high", category: "Competitors",
      title: `${competitors.length} competitors outranking you`,
      evidence: `${competitors[0]}${competitors.length > 1 ? ` + ${competitors.length - 1} others` : ""} are mentioned instead of your brand.`,
      fixType: "answer_style" });
  }
  if (score < 50) {
    issues.push({ id: "weak-meta", severity: "med", category: "On-page SEO",
      title: "Weak meta tags hurt AI parsing",
      evidence: `Overall score is ${score}/100. AI assistants rely on strong titles + descriptions.`,
      fixType: "meta_title" });
  }
  if (!anyCited) {
    issues.push({ id: "no-org", severity: "high", category: "Authority",
      title: "Missing Organization schema",
      evidence: "Zero citations across all platforms — add Organization JSON-LD to establish brand entity.",
      fixType: "org_schema" });
  }
  const altIssues: Issue[] = [
    { id: "answer-style", severity: "low", category: "Citability",
      title: "Few answer-style paragraphs",
      evidence: "AI assistants quote concise Q&A-formatted answers more often.",
      fixType: "answer_style" },
    { id: "internal-links", severity: "low", category: "Structure",
      title: "Improve internal linking",
      evidence: "Internal links help AI crawlers map your topical authority.",
      fixType: "internal_links" },
  ];
  for (const a of altIssues) if (issues.length < 6) issues.push(a);
  return issues;
};

const severityStyles: Record<Issue["severity"], string> = {
  high: "bg-red-500/15 text-red-300 border-red-500/30",
  med: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};


export function ScanResultsModal({
  open,
  onOpenChange,
  scanData,
  isUnlocked,
  onUnlock,
  freePreviewCount = 1 // Changed from 2 to 1
}: ScanResultsModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { trackEvent } = useActivityTracking();

  if (!scanData) return null;

  const visibility = calculateAIVisibility(scanData.results);
  const competitors = getUniqueCompetitors(scanData.results);
  const lockedCount = scanData.results.length - freePreviewCount;

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("customers").insert({
        email: email.trim().toLowerCase(),
        scan_id: scanData.scanId || null,
      });

      if (error) throw error;

      trackEvent("email_captured", {
        domain: scanData.project,
        score: scanData.score,
        scan_id: scanData.scanId,
        source: "results_modal_inline",
      });

      // Fire-and-forget scan complete email — don't block UX if it fails
      supabase.functions
        .invoke("send-scan-complete", {
          body: {
            email: email.trim().toLowerCase(),
            domain: scanData.project,
            score: scanData.score,
            scanId: scanData.scanId || null,
          },
        })
        .catch((err) => console.error("send-scan-complete invoke failed:", err));

      toast({
        title: "Access unlocked!",
        description: "Check your inbox — we sent your scan summary too.",
      });

      onUnlock(email);
    } catch (error) {
      console.error("Email capture error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 bg-gray-900 border-gray-800 text-white">
        <DialogHeader className="p-6 pb-4 border-b border-gray-800">
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Target className="h-5 w-5 text-yellow-400" />
            AI Visibility Results
          </DialogTitle>
          <p className="text-sm text-gray-400">
            {scanData.project} • {scanData.promptsCount} prompts analyzed
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Overall Score - Always visible */}
            <div className="text-center py-4 bg-gray-800 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Combined AI Visibility Score</p>
              <p className={`text-5xl font-bold ${getScoreColor(scanData.score)}`}>
                {scanData.score}
                <span className="text-2xl text-gray-500 font-normal">/100</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Based on mentions & citations across AI platforms • Industry avg: 34
              </p>
              {!isUnlocked && (
                <p className="text-xs text-yellow-400 mt-2 font-medium">
                  ↓ Unlock the per-platform breakdown below
                </p>
              )}
            </div>

            {/* Competitor Alert - Teaser */}
            {!isUnlocked && competitors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-white">
                      {competitors.length} competitors appearing instead of you
                    </p>
                    <p className="text-xs text-gray-400">
                      <span className="font-medium text-gray-300">{competitors[0]}</span>
                      {competitors.length > 1 && (
                        <span> and {competitors.length - 1} others</span>
                      )} are getting visibility that could be yours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Platform Breakdown - Blurred until unlocked */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                AI Platform Visibility
              </h3>
              
              {(
                [
                  { key: "gemini", label: "Gemini AI", dot: "bg-blue-500", data: visibility.gemini },
                  { key: "search", label: "ChatGPT / Search", dot: "bg-emerald-500", data: visibility.search },
                  { key: "perplexity", label: "Perplexity AI", dot: "bg-purple-500", data: visibility.perplexity },
                ] as const
              ).map((row) => (
                <div key={row.key} className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${row.dot}`} />
                      <span className="font-medium text-white">{row.label}</span>
                    </div>
                    {isUnlocked ? (
                      <span className={`font-bold ${getScoreColor(row.data.overall)}`}>
                        {row.data.overall}%
                      </span>
                    ) : (
                      <span className="font-bold text-gray-500 blur-sm select-none">??%</span>
                    )}
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isUnlocked ? getProgressColor(row.data.overall) : "bg-gray-600"} transition-all`}
                      style={{ width: isUnlocked ? `${row.data.overall}%` : "45%" }}
                    />
                  </div>
                  {isUnlocked && (
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Mentions: {row.data.mentions}%</span>
                      <span>Citations: {row.data.citations}%</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Combined Score Bar */}
              <div className="p-4 bg-gray-800 border border-yellow-400/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium text-white">Combined Score</span>
                  </div>
                  {isUnlocked ? (
                    <span className={`font-bold text-lg ${getScoreColor(visibility.combined)}`}>
                      {visibility.combined}%
                    </span>
                  ) : (
                    <span className="font-bold text-lg text-gray-500 blur-sm select-none">??%</span>
                  )}
                </div>
                <Progress value={isUnlocked ? visibility.combined : 50} className="h-3" />
                <p className="text-xs text-gray-400">
                  Weighted: 40% Gemini + 35% Perplexity + 25% Search/ChatGPT
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Detailed Results by Prompt</h3>
              
              {scanData.results.slice(0, freePreviewCount).map((result, idx) => (
                <div 
                  key={idx} 
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3"
                >
                  <p className="font-medium text-sm text-white">
                    {idx + 1}. {result.prompt}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Gemini
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.geminiMentioned ? "text-green-400" : "text-gray-500"}>
                          {result.geminiMentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.geminiCited ? "text-green-400" : "text-gray-500"}>
                          {result.geminiCited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Perplexity
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.perplexityMentioned ? "text-green-400" : "text-gray-500"}>
                          {result.perplexityMentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.perplexityCited ? "text-green-400" : "text-gray-500"}>
                          {result.perplexityCited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ChatGPT/Search
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.mentioned ? "text-green-400" : "text-gray-500"}>
                          {result.mentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.cited ? "text-green-400" : "text-gray-500"}>
                          {result.cited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {result.geminiCompetitors && result.geminiCompetitors.length > 0 && (
                    <div className="text-xs text-gray-400">
                      <span className="font-medium text-gray-300">Competitors mentioned: </span>
                      {result.geminiCompetitors.slice(0, 3).join(", ")}
                    </div>
                  )}
                </div>
              ))}

              {/* Inline Email Capture Card - appears after first prompt */}
              {!isUnlocked && lockedCount > 0 && (
                <div className="p-5 bg-gray-800 border-2 border-yellow-400/30 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold text-white">Unlock {lockedCount} More Results</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      <span>Full AI visibility score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      <span>All {scanData.promptsCount} prompt results</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      <span>Competitor breakdown</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      <span>Improvement roadmap</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    />
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Unlock Free"
                      )}
                    </Button>
                  </form>
                  
                  <p className="text-xs text-gray-500 text-center">
                    No spam. Just your AI visibility insights.
                  </p>
                </div>
              )}

              {/* Locked prompts preview */}
              {!isUnlocked && scanData.results.slice(freePreviewCount).map((_, idx) => (
                <div 
                  key={idx + freePreviewCount} 
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3 relative"
                >
                  <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm font-medium">Locked</span>
                    </div>
                  </div>
                  
                  <p className="font-medium text-sm text-gray-500">
                    {idx + freePreviewCount + 1}. Locked prompt content...
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm opacity-30">
                    <div className="h-8 bg-gray-700 rounded" />
                    <div className="h-8 bg-gray-700 rounded" />
                    <div className="h-8 bg-gray-700 rounded" />
                  </div>
                </div>
              ))}

              {/* Unlocked prompts (after email capture) */}
              {isUnlocked && scanData.results.slice(freePreviewCount).map((result, idx) => (
                <div 
                  key={idx + freePreviewCount} 
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3"
                >
                  <p className="font-medium text-sm text-white">
                    {idx + freePreviewCount + 1}. {result.prompt}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Gemini
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.geminiMentioned ? "text-green-400" : "text-gray-500"}>
                          {result.geminiMentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.geminiCited ? "text-green-400" : "text-gray-500"}>
                          {result.geminiCited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Perplexity
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.perplexityMentioned ? "text-green-400" : "text-gray-500"}>
                          {result.perplexityMentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.perplexityCited ? "text-green-400" : "text-gray-500"}>
                          {result.perplexityCited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ChatGPT/Search
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.mentioned ? "text-green-400" : "text-gray-500"}>
                          {result.mentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.cited ? "text-green-400" : "text-gray-500"}>
                          {result.cited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {result.geminiCompetitors && result.geminiCompetitors.length > 0 && (
                    <div className="text-xs text-gray-400">
                      <span className="font-medium text-gray-300">Competitors mentioned: </span>
                      {result.geminiCompetitors.slice(0, 3).join(", ")}
                    </div>
                  )}
                </div>
              ))}

              {/* Optimization CTA - Only show when unlocked and score < 70 */}
              {isUnlocked && scanData.score < 70 && (
                <div className="p-5 bg-gray-800 border-2 border-yellow-400/30 rounded-xl space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold text-white">Your Score Needs Improvement</span>
                  </div>
                  
                  <p className="text-sm text-gray-300">
                    Your visibility score of <strong className="text-red-400">{scanData.score}</strong> means AI assistants 
                    aren't recommending you. Get a personalized plan to fix this.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-yellow-400" />
                      <span>Prompt-specific fixes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span>Quick wins with tools</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      onOpenChange(false);
                      setTimeout(() => {
                        const optimizationHub = document.getElementById('optimization-hub');
                        if (optimizationHub) {
                          optimizationHub.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }} 
                    className="w-full"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Get Your Optimization Plan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          {!isUnlocked && lockedCount > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="h-4 w-4" />
                <span>Join 500+ marketers improving their AI visibility</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                Close
              </Button>
            </div>
          ) : (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
