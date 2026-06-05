import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, AlertCircle } from "lucide-react";

interface Props {
  score: number;
  competitorsFound: number;
  promptsMissingIn: number;
  totalPrompts: number;
}

export function IndustryBenchmarkStrip({
  score,
  competitorsFound,
  promptsMissingIn,
  totalPrompts,
}: Props) {
  const visibilityPct = Math.round((1 - promptsMissingIn / Math.max(totalPrompts, 1)) * 100);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-gray-800">
          <TrendingUp className="h-5 w-5 text-yellow-400 shrink-0" />
          <div>
            <div className="text-xs text-gray-400">Your visibility</div>
            <div className="text-xl font-bold text-white">
              {visibilityPct}%
              <span className="text-xs text-gray-500 ml-2">score {score}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-gray-800">
          <Users className="h-5 w-5 text-yellow-400 shrink-0" />
          <div>
            <div className="text-xs text-gray-400">Competitors AI named instead</div>
            <div className="text-xl font-bold text-white">{competitorsFound}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-gray-800">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <div className="text-xs text-gray-400">Prompts you're missing from</div>
            <div className="text-xl font-bold text-white">
              {promptsMissingIn}
              <span className="text-xs text-gray-500 ml-1">/ {totalPrompts}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
