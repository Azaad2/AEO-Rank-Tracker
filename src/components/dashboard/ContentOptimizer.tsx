import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, CheckCircle2, Lightbulb, Code, HelpCircle } from 'lucide-react';

interface OptimizationResult {
  suggestions: string[];
  faqRecommendations: string[];
  schemaSnippet: string;
  rewrittenContent: string;
}

export function ContentOptimizer() {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  async function handleOptimize() {
    if (!content.trim()) {
      toast({ title: 'Paste your content first', variant: 'destructive' });
      return;
    }

    setIsOptimizing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('optimize-content', {
        body: {
          content: content.trim(),
          targetKeyword: targetKeyword.trim() || undefined,
        },
      });

      if (error) throw error;
      setResult(data);
      toast({ title: 'Optimization complete!' });
    } catch (error) {
      console.error('Content optimization error:', error);
      toast({
        title: 'Optimization failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            AI Content Optimizer
          </CardTitle>
          <p className="text-sm text-gray-400">
            Paste your content and get AI suggestions to make it more citable by ChatGPT, Gemini & Perplexity.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Target keyword (optional)"
            value={targetKeyword}
            onChange={(e) => setTargetKeyword(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
            disabled={isOptimizing}
          />
          <Textarea
            placeholder="Paste your article, page content, or product description here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
            disabled={isOptimizing}
          />
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing || !content.trim()}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Optimize for AI Visibility
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  Optimization Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-gray-800/50">
                    <CheckCircle2 className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-300">{suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* FAQ Recommendations */}
          {result.faqRecommendations && result.faqRecommendations.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-yellow-400" />
                  Recommended FAQs to Add
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.faqRecommendations.map((faq, i) => (
                  <div key={i} className="p-2 rounded bg-gray-800/50">
                    <p className="text-sm text-gray-300">Q: {faq}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Rewritten Content */}
          {result.rewrittenContent && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  AI-Optimized Version
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded bg-gray-800/50 text-sm text-gray-300 whitespace-pre-wrap">
                  {result.rewrittenContent}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schema Snippet */}
          {result.schemaSnippet && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Code className="h-4 w-4 text-yellow-400" />
                  Schema Markup Snippet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-3 rounded bg-gray-800 text-xs text-green-400 overflow-x-auto">
                  {result.schemaSnippet}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
