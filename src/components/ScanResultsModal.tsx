import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lock, Download, Sparkles, Target, Zap } from "lucide-react";

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
}

interface ScanResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanData: {
    project: string;
    promptsCount: number;
    score: number;
    results: ScanResult[];
  } | null;
  isUnlocked: boolean;
  onUnlock: () => void;
  freePreviewCount?: number;
}

const calculateAIVisibility = (results: ScanResult[]) => {
  const total = results.length;
  if (total === 0) return {
    gemini: { mentions: 0, citations: 0, overall: 0 },
    search: { mentions: 0, citations: 0, overall: 0 },
    combined: 0
  };
  
  // Gemini visibility
  const geminiMentions = results.filter(r => r.geminiMentioned).length;
  const geminiCitations = results.filter(r => r.geminiCited).length;
  const geminiVisibility = Math.round(((geminiMentions + geminiCitations) / (total * 2)) * 100);
  
  // Search/ChatGPT simulation visibility
  const searchMentions = results.filter(r => r.mentioned).length;
  const searchCitations = results.filter(r => r.cited).length;
  const searchVisibility = Math.round(((searchMentions + searchCitations) / (total * 2)) * 100);
  
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
    combined: Math.round((geminiVisibility * 0.6) + (searchVisibility * 0.4))
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

export function ScanResultsModal({
  open,
  onOpenChange,
  scanData,
  isUnlocked,
  onUnlock,
  freePreviewCount = 2
}: ScanResultsModalProps) {
  if (!scanData) return null;

  const visibility = calculateAIVisibility(scanData.results);

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
            {/* Overall Score */}
            <div className="text-center py-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Combined AI Visibility Score</p>
              <p className={`text-5xl font-bold ${getScoreColor(scanData.score)}`}>
                {scanData.score}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Based on mentions & citations across AI platforms
              </p>
            </div>

            {/* AI Platform Breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Platform Visibility
              </h3>
              
              {/* Gemini AI */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-medium">Gemini AI</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(visibility.gemini.overall)}`}>
                    {visibility.gemini.overall}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(visibility.gemini.overall)} transition-all`}
                    style={{ width: `${visibility.gemini.overall}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mentions: {visibility.gemini.mentions}%</span>
                  <span>Citations: {visibility.gemini.citations}%</span>
                </div>
              </div>

              {/* ChatGPT/Search */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-medium">ChatGPT / Search Simulation</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(visibility.search.overall)}`}>
                    {visibility.search.overall}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(visibility.search.overall)} transition-all`}
                    style={{ width: `${visibility.search.overall}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mentions: {visibility.search.mentions}%</span>
                  <span>Citations: {visibility.search.citations}%</span>
                </div>
              </div>

              {/* Combined Score Bar */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-medium">Combined Score</span>
                  </div>
                  <span className={`font-bold text-lg ${getScoreColor(visibility.combined)}`}>
                    {visibility.combined}%
                  </span>
                </div>
                <Progress value={visibility.combined} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Weighted: 60% Gemini + 40% Search/ChatGPT
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              <h3 className="font-semibold">Detailed Results by Prompt</h3>
              
              {scanData.results.map((result, idx) => {
                const isLocked = !isUnlocked && idx >= freePreviewCount;
                
                return (
                  <div 
                    key={idx} 
                    className={`p-4 border rounded-lg space-y-3 ${isLocked ? "relative" : ""}`}
                  >
                    {isLocked && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Lock className="h-4 w-4" />
                          <span className="text-sm font-medium">Locked</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="font-medium text-sm">
                      {idx + 1}. {isLocked ? "Locked prompt content..." : result.prompt}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Gemini AI</p>
                        <div className="flex gap-3">
                          <span className={result.geminiMentioned ? "text-green-500" : "text-muted-foreground"}>
                            {result.geminiMentioned ? "✓ Mentioned" : "✗ Not Mentioned"}
                          </span>
                          <span className={result.geminiCited ? "text-green-500" : "text-muted-foreground"}>
                            {result.geminiCited ? "✓ Cited" : "✗ Not Cited"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">ChatGPT / Search</p>
                        <div className="flex gap-3">
                          <span className={result.mentioned ? "text-green-500" : "text-muted-foreground"}>
                            {result.mentioned ? "✓ Mentioned" : "✗ Not Mentioned"}
                          </span>
                          <span className={result.cited ? "text-green-500" : "text-muted-foreground"}>
                            {result.cited ? "✓ Cited" : "✗ Not Cited"}
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
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="p-6 border-t bg-background">
          {!isUnlocked && scanData.results.length > freePreviewCount ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>{scanData.results.length - freePreviewCount} results locked</span>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Unlock full results, improvement roadmap & downloadable report
                </p>
                <Button onClick={onUnlock} size="lg" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Unlock Full Strategy – Enter Email
                </Button>
              </div>
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
