import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SuggestedPrompts } from './SuggestedPrompts';

interface QuickResult {
  scanId: string;
  score: number;
  project: string;
  promptsCount: number;
}

interface QuickScanProps {
  onScanComplete?: () => void;
}

export function QuickScan({ onScanComplete }: QuickScanProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [promptsText, setPromptsText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<QuickResult | null>(null);
  const [atLimit, setAtLimit] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

  // Check usage limits on mount and after scans
  useEffect(() => {
    async function checkLimits() {
      if (!user?.id) return;
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('scans_used, prompts_used, plan_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!sub) return;
      const { data: plan } = await supabase
        .from('plans')
        .select('scans_limit, prompts_limit')
        .eq('id', sub.plan_id)
        .single();
      if (!plan) return;
      const scansAtLimit = plan.scans_limit !== -1 && (sub.scans_used ?? 0) >= plan.scans_limit;
      const promptsAtLimit = (sub.prompts_used ?? 0) >= plan.prompts_limit;
      if (scansAtLimit) {
        setAtLimit(true);
        setLimitMessage('Scan limit reached. Upgrade to continue.');
      } else if (promptsAtLimit) {
        setAtLimit(true);
        setLimitMessage('Prompt limit reached. Upgrade to continue.');
      } else {
        setAtLimit(false);
        setLimitMessage('');
      }
    }
    checkLimits();
  }, [user?.id, result]);

  async function handleQuickScan() {
    if (atLimit) {
      toast({ title: limitMessage, description: 'Go to Pricing to upgrade your plan.', variant: 'destructive' });
      return;
    }
    if (!domain.trim() || !promptsText.trim()) {
      toast({ title: 'Enter domain and prompts', variant: 'destructive' });
      return;
    }

    setIsScanning(true);
    setResult(null);

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

      setResult({
        scanId: data.scanId,
        score: data.score,
        project: data.project,
        promptsCount: data.promptsCount,
      });

      toast({ 
        title: `Scan complete — Score: ${data.score}`,
        description: 'Your optimization package is being generated automatically!',
      });
      onScanComplete?.();
    } catch (error) {
      console.error('Quick scan error:', error);
      toast({
        title: 'Scan failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Quick Scan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
          disabled={isScanning}
        />
        <SuggestedPrompts
          domain={domain}
          onAddPrompt={(prompt) => {
            setPromptsText(prev => prev ? `${prev}\n${prompt}` : prompt);
          }}
          disabled={isScanning}
        />
        <Textarea
          placeholder="best product for X&#10;how to solve Y"
          value={promptsText}
          onChange={(e) => setPromptsText(e.target.value)}
          rows={3}
          className="font-mono text-sm bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
          disabled={isScanning}
        />
        {atLimit && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{limitMessage}</span>
            <Link to="/pricing" className="ml-auto text-yellow-400 hover:underline text-xs font-semibold whitespace-nowrap">Upgrade</Link>
          </div>
        )}
        <Button
          onClick={handleQuickScan}
          disabled={isScanning || atLimit}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            'Run Scan'
          )}
        </Button>

        {result && (
          <div className="mt-4 p-4 rounded-lg bg-gray-800 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{result.project}</p>
                <p className="text-xs text-gray-500">{result.promptsCount} prompts analyzed</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}
                </p>
                <p className="text-xs text-gray-500">AI Score</p>
              </div>
            </div>
            <Link to={`/?scanId=${result.scanId}#scan`}>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                View Full Results
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
