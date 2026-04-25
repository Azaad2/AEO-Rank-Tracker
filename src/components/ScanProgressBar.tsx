import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ScanProgressBarProps {
  isScanning: boolean;
}

const STEPS = [
  { label: "Checking ChatGPT...", duration: 12000 },
  { label: "Checking Perplexity...", duration: 14000 },
  { label: "Checking Gemini...", duration: 16000 },
  { label: "Analyzing competitors...", duration: 10000 },
  { label: "Calculating visibility score...", duration: 8000 },
];

const TOTAL_DURATION = STEPS.reduce((sum, s) => sum + s.duration, 0);

export function ScanProgressBar({ isScanning }: ScanProgressBarProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isScanning) {
      setElapsed(0);
      return;
    }

    const startedAt = Date.now();
    const interval = setInterval(() => {
      const ms = Date.now() - startedAt;
      // Cap at 95% so it doesn't pretend to be done before the API returns
      setElapsed(Math.min(ms, TOTAL_DURATION * 0.95));
    }, 200);

    return () => clearInterval(interval);
  }, [isScanning]);

  if (!isScanning) return null;

  // Determine current step based on cumulative durations
  let cumulative = 0;
  let currentStepIdx = 0;
  for (let i = 0; i < STEPS.length; i++) {
    cumulative += STEPS[i].duration;
    if (elapsed < cumulative) {
      currentStepIdx = i;
      break;
    }
    currentStepIdx = i;
  }

  const progressPct = Math.min(Math.round((elapsed / TOTAL_DURATION) * 100), 95);

  return (
    <div className="mt-4 p-4 rounded-lg border border-yellow-400/30 bg-gray-900/60 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between text-sm">
        <span className="text-yellow-400 font-medium">Scanning in progress</span>
        <span className="text-gray-400 font-mono">{progressPct}%</span>
      </div>

      <Progress value={progressPct} className="h-2" />

      <ul className="space-y-2">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIdx;
          const isActive = idx === currentStepIdx;
          return (
            <li
              key={step.label}
              className={`flex items-center gap-2 text-xs transition-opacity ${
                isDone || isActive ? "opacity-100" : "opacity-40"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 text-yellow-400 animate-spin shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-gray-600 shrink-0" />
              )}
              <span
                className={
                  isActive
                    ? "text-white"
                    : isDone
                    ? "text-gray-400 line-through"
                    : "text-gray-500"
                }
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-gray-500 text-center">
        This usually takes 30–60 seconds. Hang tight — don't close this tab.
      </p>
    </div>
  );
}
