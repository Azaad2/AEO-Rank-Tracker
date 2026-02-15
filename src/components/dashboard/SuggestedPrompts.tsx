import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Sparkles, Plus, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  prompt: string;
  difficulty: 'low' | 'medium' | 'high';
  volume: 'low' | 'medium' | 'high';
  keywords: string[];
}

interface SuggestedPromptsProps {
  domain: string;
  onAddPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const difficultyColors: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const volumeLabels: Record<string, string> = {
  low: '🔹 Low',
  medium: '🔸 Medium',
  high: '🔥 High',
};

export function SuggestedPrompts({ domain, onAddPrompt, disabled }: SuggestedPromptsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [addedPrompts, setAddedPrompts] = useState<Set<string>>(new Set());

  const fetchSuggestions = async () => {
    if (!domain.trim()) {
      toast({ title: 'Enter a domain first', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setSuggestions([]);
    setAddedPrompts(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('suggest-prompts', {
        body: { domain: domain.trim(), userId: user?.id },
      });

      if (error) {
        // Check for 403 (free plan)
        if (error.message?.includes('403') || data?.error?.includes('Upgrade')) {
          setIsLocked(true);
          setHasLoaded(true);
          return;
        }
        throw error;
      }

      if (data?.error) {
        if (data.error.includes('Upgrade')) {
          setIsLocked(true);
          setHasLoaded(true);
          return;
        }
        throw new Error(data.error);
      }

      setSuggestions(data.suggestions || []);
      setIsLocked(false);
      setHasLoaded(true);
    } catch (error) {
      console.error('Suggest prompts error:', error);
      toast({
        title: 'Failed to get suggestions',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (prompt: string) => {
    onAddPrompt(prompt);
    setAddedPrompts(prev => new Set(prev).add(prompt));
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={fetchSuggestions}
        disabled={isLoading || disabled || !domain.trim()}
        className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-3 w-3" />
            Suggest Prompts
          </>
        )}
      </Button>

      {isLocked && hasLoaded && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-sm">
          <Lock className="h-4 w-4 shrink-0 text-yellow-400" />
          <span>AI prompt suggestions are available on paid plans.</span>
          <Link to="/pricing" className="ml-auto text-yellow-400 hover:underline text-xs font-semibold whitespace-nowrap">
            Upgrade
          </Link>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm text-white leading-tight">{s.prompt}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${difficultyColors[s.difficulty]}`}>
                    {s.difficulty}
                  </Badge>
                  <span className="text-[10px] text-gray-500">{volumeLabels[s.volume]}</span>
                  {s.keywords.map((kw, ki) => (
                    <span key={ki} className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAdd(s.prompt)}
                disabled={addedPrompts.has(s.prompt)}
                className="shrink-0 h-7 w-7 p-0 text-yellow-400 hover:bg-yellow-400/10"
              >
                {addedPrompts.has(s.prompt) ? '✓' : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
