import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Circle, X, Rocket } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Step {
  id: string;
  label: string;
  done: boolean;
  targetTab: string;
}

interface OnboardingChecklistProps {
  hasDomain: boolean;
  hasScan: boolean;
  hasCompetitors: boolean;
  hasReviewedRec: boolean;
  hasUsedAssistant: boolean;
  onNavigate: (tab: string) => void;
}

export function OnboardingChecklist({
  hasDomain,
  hasScan,
  hasCompetitors,
  hasReviewedRec,
  hasUsedAssistant,
  onNavigate,
}: OnboardingChecklistProps) {
  const { user } = useAuth();
  const dismissKey = user ? `onboarding_dismissed_${user.id}` : 'onboarding_dismissed';
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(dismissKey) === '1');
    } catch {}
  }, [dismissKey]);

  const steps: Step[] = [
    { id: 'domain', label: 'Add your domain', done: hasDomain, targetTab: 'domains' },
    { id: 'scan', label: 'Run your first AI visibility scan', done: hasScan, targetTab: 'scan' },
    { id: 'competitors', label: 'Explore competitor insights', done: hasCompetitors, targetTab: 'competitors' },
    { id: 'rec', label: 'Review your top recommendation', done: hasReviewedRec, targetTab: 'recommendations' },
    { id: 'assistant', label: 'Try the AI Assistant', done: hasUsedAssistant, targetTab: 'ai-assistant' },
  ];

  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);
  const allDone = completed === steps.length;

  if (dismissed || allDone) return null;

  const dismiss = () => {
    try { localStorage.setItem(dismissKey, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-400/10 via-gray-900 to-gray-900 border-yellow-400/30">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Getting started</h3>
              <p className="text-gray-400 text-xs">Finish setup to unlock the full workspace</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-gray-400 font-mono">{completed}/{steps.length}</span>
        </div>

        <ul className="space-y-1">
          {steps.map((step) => (
            <li key={step.id}>
              <button
                onClick={() => onNavigate(step.targetTab)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-800/60 transition-colors text-left group"
              >
                {step.done ? (
                  <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-black" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-600 shrink-0" />
                )}
                <span className={`text-sm flex-1 ${step.done ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-yellow-400'}`}>
                  {step.label}
                </span>
                {!step.done && (
                  <span className="text-xs text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">Start →</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
