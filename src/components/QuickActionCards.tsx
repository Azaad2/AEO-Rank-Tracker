import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Code2, FileSearch, BarChart3, Zap, Clock, ArrowRight } from "lucide-react";

interface QuickWin {
  action: string;
  impact: string;
  effort: string;
  toolLink?: string;
}

interface QuickActionCardsProps {
  quickWins: QuickWin[];
  domain?: string;
  onActionClick?: (action: string) => void;
}

const toolConfig: Record<string, { path: string; icon: React.ReactNode; label: string }> = {
  "ai-faq-generator": { path: "/tools/ai-faq-generator", icon: <MessageSquarePlus className="h-4 w-4" />, label: "FAQ Generator" },
  "faq-generator": { path: "/tools/ai-faq-generator", icon: <MessageSquarePlus className="h-4 w-4" />, label: "FAQ Generator" },
  "schema-generator": { path: "/tools/schema-generator", icon: <Code2 className="h-4 w-4" />, label: "Schema Generator" },
  "content-auditor": { path: "/tools/content-auditor", icon: <FileSearch className="h-4 w-4" />, label: "Content Auditor" },
  "llm-readiness": { path: "/tools/llm-readiness-score", icon: <BarChart3 className="h-4 w-4" />, label: "LLM Readiness" },
  "meta-optimizer": { path: "/tools/meta-optimizer", icon: <FileSearch className="h-4 w-4" />, label: "Meta Optimizer" },
};

const getImpactColor = (impact: string) => {
  if (impact.includes("+10") || impact.includes("+15") || impact.includes("+20")) {
    return "text-green-500 bg-green-500/10";
  }
  if (impact.includes("+5") || impact.includes("+8")) {
    return "text-yellow-500 bg-yellow-500/10";
  }
  return "text-blue-500 bg-blue-500/10";
};

export function QuickActionCards({ quickWins, domain, onActionClick }: QuickActionCardsProps) {
  if (!quickWins || quickWins.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Quick Wins</h3>
        <span className="text-xs text-muted-foreground">Actions with the highest impact-to-effort ratio</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {quickWins.map((win, idx) => {
          const tool = win.toolLink ? toolConfig[win.toolLink] : null;
          
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight flex-1">{win.action}</p>
                  {tool && (
                    <div className="shrink-0">
                      {tool.icon}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getImpactColor(win.impact)}`}>
                    {win.impact}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {win.effort}
                  </span>
                </div>

                {tool ? (
                  <Button 
                    asChild 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onActionClick?.(win.action)}
                  >
                    <Link to={tool.path}>
                      {tool.label}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="w-full text-muted-foreground"
                    onClick={() => onActionClick?.(win.action)}
                  >
                    Manual Action
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
