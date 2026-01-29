import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Sparkles, Target, Zap, CheckCircle2, AlertTriangle, Users, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityTracking } from "@/hooks/useActivityTracking";

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

      toast({
        title: "Access unlocked!",
        description: "You now have full access to your scan results.",
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
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-primary" />
            AI Visibility Results
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {scanData.project} • {scanData.promptsCount} prompts analyzed
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Overall Score - Hidden until unlocked */}
            <div className="text-center py-4 bg-muted/30 rounded-lg relative">
              <p className="text-sm text-muted-foreground mb-1">Combined AI Visibility Score</p>
              {isUnlocked ? (
                <p className={`text-5xl font-bold ${getScoreColor(scanData.score)}`}>
                  {scanData.score}
                </p>
              ) : (
                <div className="relative">
                  <p className="text-5xl font-bold text-muted-foreground/30 select-none blur-sm">
                    {scanData.score}
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-background/90 px-4 py-2 rounded-full border shadow-sm">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Enter email to reveal</span>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Based on mentions & citations across AI platforms
              </p>
            </div>

            {/* Competitor Alert - Teaser */}
            {!isUnlocked && competitors.length > 0 && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {competitors.length} competitors appearing instead of you
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">{competitors[0]}</span>
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
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Platform Visibility
              </h3>
              
              {/* Gemini AI */}
              <div className="p-4 border rounded-lg space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-medium">Gemini AI</span>
                  </div>
                  {isUnlocked ? (
                    <span className={`font-bold ${getScoreColor(visibility.gemini.overall)}`}>
                      {visibility.gemini.overall}%
                    </span>
                  ) : (
                    <span className="font-bold text-muted-foreground/50 blur-sm select-none">??%</span>
                  )}
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isUnlocked ? getProgressColor(visibility.gemini.overall) : 'bg-muted-foreground/30'} transition-all`}
                    style={{ width: isUnlocked ? `${visibility.gemini.overall}%` : '60%' }}
                  />
                </div>
                {isUnlocked && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mentions: {visibility.gemini.mentions}%</span>
                    <span>Citations: {visibility.gemini.citations}%</span>
                  </div>
                )}
              </div>

              {/* ChatGPT/Search */}
              <div className="p-4 border rounded-lg space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-medium">ChatGPT / Search Simulation</span>
                  </div>
                  {isUnlocked ? (
                    <span className={`font-bold ${getScoreColor(visibility.search.overall)}`}>
                      {visibility.search.overall}%
                    </span>
                  ) : (
                    <span className="font-bold text-muted-foreground/50 blur-sm select-none">??%</span>
                  )}
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isUnlocked ? getProgressColor(visibility.search.overall) : 'bg-muted-foreground/30'} transition-all`}
                    style={{ width: isUnlocked ? `${visibility.search.overall}%` : '45%' }}
                  />
                </div>
                {isUnlocked && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mentions: {visibility.search.mentions}%</span>
                    <span>Citations: {visibility.search.citations}%</span>
                  </div>
                )}
              </div>

              {/* Perplexity AI */}
              <div className="p-4 border rounded-lg space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="font-medium">Perplexity AI</span>
                  </div>
                  {isUnlocked ? (
                    <span className={`font-bold ${getScoreColor(visibility.perplexity.overall)}`}>
                      {visibility.perplexity.overall}%
                    </span>
                  ) : (
                    <span className="font-bold text-muted-foreground/50 blur-sm select-none">??%</span>
                  )}
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isUnlocked ? getProgressColor(visibility.perplexity.overall) : 'bg-muted-foreground/30'} transition-all`}
                    style={{ width: isUnlocked ? `${visibility.perplexity.overall}%` : '35%' }}
                  />
                </div>
                {isUnlocked && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mentions: {visibility.perplexity.mentions}%</span>
                    <span>Citations: {visibility.perplexity.citations}%</span>
                  </div>
                )}
              </div>

              {/* Combined Score Bar */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-medium">Combined Score</span>
                  </div>
                  {isUnlocked ? (
                    <span className={`font-bold text-lg ${getScoreColor(visibility.combined)}`}>
                      {visibility.combined}%
                    </span>
                  ) : (
                    <span className="font-bold text-lg text-muted-foreground/50 blur-sm select-none">??%</span>
                  )}
                </div>
                <Progress value={isUnlocked ? visibility.combined : 50} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Weighted: 40% Gemini + 35% Perplexity + 25% Search/ChatGPT
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              <h3 className="font-semibold">Detailed Results by Prompt</h3>
              
              {scanData.results.slice(0, freePreviewCount).map((result, idx) => (
                <div 
                  key={idx} 
                  className="p-4 border rounded-lg space-y-3"
                >
                  <p className="font-medium text-sm">
                    {idx + 1}. {result.prompt}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Gemini
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.geminiMentioned ? "text-green-500" : "text-muted-foreground"}>
                          {result.geminiMentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.geminiCited ? "text-green-500" : "text-muted-foreground"}>
                          {result.geminiCited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Perplexity
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.perplexityMentioned ? "text-green-500" : "text-muted-foreground"}>
                          {result.perplexityMentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.perplexityCited ? "text-green-500" : "text-muted-foreground"}>
                          {result.perplexityCited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ChatGPT/Search
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.mentioned ? "text-green-500" : "text-muted-foreground"}>
                          {result.mentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.cited ? "text-green-500" : "text-muted-foreground"}>
                          {result.cited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {result.geminiCompetitors && result.geminiCompetitors.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Competitors mentioned: </span>
                      {result.geminiCompetitors.slice(0, 3).join(", ")}
                    </div>
                  )}
                </div>
              ))}

              {/* Inline Email Capture Card - appears after first prompt */}
              {!isUnlocked && lockedCount > 0 && (
                <div className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Unlock {lockedCount} More Results</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Full AI visibility score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>All {scanData.promptsCount} prompt results</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Competitor breakdown</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
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
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Unlock Free"
                      )}
                    </Button>
                  </form>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    No spam. Just your AI visibility insights.
                  </p>
                </div>
              )}

              {/* Locked prompts preview */}
              {!isUnlocked && scanData.results.slice(freePreviewCount).map((_, idx) => (
                <div 
                  key={idx + freePreviewCount} 
                  className="p-4 border rounded-lg space-y-3 relative"
                >
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm font-medium">Locked</span>
                    </div>
                  </div>
                  
                  <p className="font-medium text-sm text-muted-foreground/50">
                    {idx + freePreviewCount + 1}. Locked prompt content...
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm opacity-30">
                    <div className="h-8 bg-muted rounded" />
                    <div className="h-8 bg-muted rounded" />
                    <div className="h-8 bg-muted rounded" />
                  </div>
                </div>
              ))}

              {/* Unlocked prompts (after email capture) */}
              {isUnlocked && scanData.results.slice(freePreviewCount).map((result, idx) => (
                <div 
                  key={idx + freePreviewCount} 
                  className="p-4 border rounded-lg space-y-3"
                >
                  <p className="font-medium text-sm">
                    {idx + freePreviewCount + 1}. {result.prompt}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Gemini
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.geminiMentioned ? "text-green-500" : "text-muted-foreground"}>
                          {result.geminiMentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.geminiCited ? "text-green-500" : "text-muted-foreground"}>
                          {result.geminiCited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Perplexity
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.perplexityMentioned ? "text-green-500" : "text-muted-foreground"}>
                          {result.perplexityMentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.perplexityCited ? "text-green-500" : "text-muted-foreground"}>
                          {result.perplexityCited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ChatGPT/Search
                      </p>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className={result.mentioned ? "text-green-500" : "text-muted-foreground"}>
                          {result.mentioned ? "✓ Mentioned" : "✗ No mention"}
                        </span>
                        <span className={result.cited ? "text-green-500" : "text-muted-foreground"}>
                          {result.cited ? "✓ Cited" : "✗ No citation"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {result.geminiCompetitors && result.geminiCompetitors.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Competitors mentioned: </span>
                      {result.geminiCompetitors.slice(0, 3).join(", ")}
                    </div>
                  )}
                </div>
              ))}

              {/* Optimization CTA - Only show when unlocked and score < 70 */}
              {isUnlocked && scanData.score < 70 && (
                <div className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 rounded-xl space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Your Score Needs Improvement</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Your visibility score of <strong className="text-destructive">{scanData.score}</strong> means AI assistants 
                    aren't recommending you. Get a personalized plan to fix this.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span>Prompt-specific fixes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
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
        <div className="p-4 border-t bg-background">
          {!isUnlocked && lockedCount > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Join 500+ marketers improving their AI visibility</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
