import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, AlertCircle, Lightbulb, HelpCircle, Code2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromptFix {
  prompt: string;
  rootCause: string;
  contentSuggestion: string;
  faqsToAdd: string[];
  schemaType: string;
  priority: "high" | "medium" | "low";
}

interface PromptOptimizerProps {
  promptFixes: PromptFix[];
  domain: string;
}

const priorityConfig = {
  high: { color: "bg-red-500/10 text-red-500 border-red-500/20", label: "High Priority" },
  medium: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Medium Priority" },
  low: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Low Priority" },
};

export function PromptOptimizer({ promptFixes, domain }: PromptOptimizerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  if (!promptFixes || promptFixes.length === 0) return null;

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast({
        title: "Copied!",
        description: "Content suggestion copied to clipboard",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Prompt-Specific Fixes</h3>
        <Badge variant="secondary" className="ml-auto">
          {promptFixes.length} prompts to optimize
        </Badge>
      </div>

      <div className="space-y-3">
        {promptFixes.map((fix, idx) => {
          const isExpanded = expandedItems.has(idx);
          const priorityStyle = priorityConfig[fix.priority] || priorityConfig.medium;

          return (
            <Collapsible key={idx} open={isExpanded} onOpenChange={() => toggleItem(idx)}>
              <Card className={`border-l-4 ${fix.priority === 'high' ? 'border-l-red-500' : fix.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-medium text-muted-foreground shrink-0">
                          #{idx + 1}
                        </span>
                        <CardTitle className="text-sm font-medium truncate">
                          "{fix.prompt}"
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={priorityStyle.color}>
                          {priorityStyle.label}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Root Cause */}
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-destructive mb-1">Why You're Invisible</p>
                          <p className="text-sm text-muted-foreground">{fix.rootCause}</p>
                        </div>
                      </div>
                    </div>

                    {/* Content Suggestion */}
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-primary shrink-0" />
                          <p className="text-xs font-medium text-primary">Content Suggestion</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(fix.contentSuggestion, idx);
                          }}
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm">{fix.contentSuggestion}</p>
                    </div>

                    {/* FAQs to Add */}
                    {fix.faqsToAdd && fix.faqsToAdd.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs font-medium">FAQs to Add</p>
                        </div>
                        <ul className="space-y-1 pl-6">
                          {fix.faqsToAdd.map((faq, faqIdx) => (
                            <li key={faqIdx} className="text-sm text-muted-foreground list-disc">
                              {faq}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Schema Recommendation */}
                    <div className="flex items-center gap-2 text-sm">
                      <Code2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Recommended Schema:</span>
                      <Badge variant="secondary">{fix.schemaType}</Badge>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
