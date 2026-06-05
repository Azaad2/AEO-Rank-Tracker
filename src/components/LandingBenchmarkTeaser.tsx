import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Swords, BarChart3, Sparkles, ArrowRight } from "lucide-react";

const EXAMPLE_COMPETITORS = [
  {
    label: "Brand A",
    citations: 42,
    assets: ["Comparison pages", "Reddit threads", "Listicles"],
  },
  {
    label: "Brand B",
    citations: 31,
    assets: ["Reviews", "Documentation"],
  },
  {
    label: "Brand C",
    citations: 24,
    assets: ["Forum threads", "Blog articles"],
  },
];

export function LandingBenchmarkTeaser() {
  return (
    <section className="space-y-12">
      {/* How your industry is winning right now */}
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            How your industry is winning right now
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            A preview of the anonymized competitor leaderboard you unlock after a scan.
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Swords className="h-4 w-4 text-yellow-400" />
              Competitor leaderboard (example)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EXAMPLE_COMPETITORS.map((c, i) => (
              <div
                key={c.label}
                className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm w-5">#{i + 1}</span>
                  <div>
                    <div className="text-white font-medium">{c.label}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.assets.map((a) => (
                        <Badge
                          key={a}
                          variant="outline"
                          className="border-gray-700 text-gray-400 text-[10px] py-0"
                        >
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-yellow-400 text-sm font-semibold">
                  {c.citations} citations
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Benchmarks-in-every-scan tiles */}
      <div className="space-y-5">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Industry benchmarks built into every scan
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            We don't just hand you a score. We tell you what to fix and who's beating you to it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/auth?redirect=/dashboard?tab=recommendations">
            <Card className="bg-gray-900 border-gray-800 hover:border-yellow-400/40 transition h-full">
              <CardContent className="p-5 space-y-3">
                <Sparkles className="h-6 w-6 text-yellow-400" />
                <h3 className="text-white font-semibold">Recommendation Intelligence</h3>
                <p className="text-xs text-gray-400">
                  Evidence-bound actions ranked by projected impact. Every card backed by peer data.
                </p>
                <div className="text-xs text-yellow-400 flex items-center gap-1">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/auth?redirect=/dashboard?tab=why-win">
            <Card className="bg-gray-900 border-gray-800 hover:border-yellow-400/40 transition h-full">
              <CardContent className="p-5 space-y-3">
                <Swords className="h-6 w-6 text-yellow-400" />
                <h3 className="text-white font-semibold">Why Competitors Win</h3>
                <p className="text-xs text-gray-400">
                  Asset-type gap analysis and an anonymized competitor leaderboard for your industry.
                </p>
                <div className="text-xs text-yellow-400 flex items-center gap-1">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/auth?redirect=/dashboard?tab=metrics">
            <Card className="bg-gray-900 border-gray-800 hover:border-yellow-400/40 transition h-full">
              <CardContent className="p-5 space-y-3">
                <BarChart3 className="h-6 w-6 text-yellow-400" />
                <h3 className="text-white font-semibold">Proprietary Metrics</h3>
                <p className="text-xs text-gray-400">
                  RSS, CAG, and TSD — the metrics that explain why AI cites a brand for a category.
                </p>
                <div className="text-xs text-yellow-400 flex items-center gap-1">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </section>
  );
}
