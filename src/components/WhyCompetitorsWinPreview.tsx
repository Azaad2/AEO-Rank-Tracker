import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Swords, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ScanResult {
  prompt: string;
  geminiCompetitors?: string[];
  perplexityCompetitors?: string[];
}

interface Props {
  results: ScanResult[];
  onTrack?: () => void;
}

export function WhyCompetitorsWinPreview({ results, onTrack }: Props) {
  const { user } = useAuth();

  // Aggregate competitors across prompts
  const counts = new Map<string, number>();
  for (const r of results) {
    const comps = [
      ...(r.geminiCompetitors || []),
      ...(r.perplexityCompetitors || []),
    ];
    const unique = new Set(comps.map((c) => c.trim().toLowerCase()).filter(Boolean));
    for (const c of unique) {
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }
  const top = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, n]) => ({ name, prompts: n }));

  if (top.length === 0) return null;

  const dashLink = user
    ? "/dashboard?tab=why-win"
    : "/auth?redirect=/dashboard?tab=why-win";

  return (
    <Card className="bg-gradient-to-br from-red-500/5 to-transparent border-red-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Swords className="h-4 w-4 text-red-400" />
          Why these competitors are winning your prompts
        </CardTitle>
        <p className="text-xs text-gray-400">
          Ranked by how many of your prompts AI named them in.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.map((c, i) => (
          <div
            key={c.name}
            className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm w-5">#{i + 1}</span>
              <div>
                <div className="text-white font-medium capitalize">{c.name}</div>
                <div className="text-xs text-gray-400">
                  Named in {c.prompts} of your prompt{c.prompts === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="border-yellow-400/40 text-yellow-400 text-[10px]">
              {c.prompts >= 3 ? "Dominant" : "Active"}
            </Badge>
          </div>
        ))}
        <Link to={dashLink} onClick={onTrack} className="block">
          <Button
            variant="outline"
            className="w-full border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
          >
            See the full Why Competitors Win breakdown
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
