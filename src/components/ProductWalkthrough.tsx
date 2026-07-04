import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, ZoomIn } from "lucide-react";
import { Link } from "react-router-dom";

interface WalkthroughStep {
  title: string;
  caption: string;
  description: string;
  image: string;
}

const STEPS: WalkthroughStep[] = [
  {
    title: "1. Run an AI Visibility Scan",
    caption: "Homepage scan interface — enter your domain and optional competitor.",
    description:
      "Drop in your website (and a competitor if you like). We run real prompts across ChatGPT, Gemini, Perplexity, and Google AI Overviews to see who actually gets mentioned.",
    image: "/screenshots/01-scan.png",
  },
  {
    title: "2. Competitor Visibility Gap",
    caption: "Side-by-side visibility comparison card.",
    description:
      "See exactly where AI recommends your competitor instead of you — prompt by prompt, model by model. No more guessing where you're losing deals.",
    image: "/screenshots/02-competitor-gap.png",
  },
  {
    title: "3. Why Competitors Win",
    caption: "Why Competitors Win report with citations and authority signals.",
    description:
      "We break down the citation sources, authority signals, and comparison content that push competitors into AI answers — so you know what to build.",
    image: "/screenshots/03-why-win.png",
  },
  {
    title: "4. Recommendation Intelligence",
    caption: "Prioritized recommendations dashboard.",
    description:
      "Every recommendation is ranked by projected visibility impact and backed by peer data — so you fix the things that actually move the needle first.",
    image: "/screenshots/04-recommendations.png",
  },
  {
    title: "5. Industry Benchmark",
    caption: "Industry benchmark section comparing you to peers.",
    description:
      "Compare your AI visibility score against anonymized companies in the same category. Know instantly whether you're leading, average, or being lapped.",
    image: "/screenshots/05-benchmark.png",
  },
  {
    title: "6. Citation Intelligence",
    caption: "Citation sources grouped by domain.",
    description:
      "AI assistants build trust from citations. We show which domains they trust for your topics — and how to earn a spot on that list.",
    image: "/screenshots/06-citations.png",
  },
  {
    title: "7. LLM Rank Tracker",
    caption: "Prompt tracking across ChatGPT, Gemini, Claude, and Perplexity.",
    description:
      "Track your position on the prompts that matter across every major LLM. Watch rankings move as you ship optimizations.",
    image: "/screenshots/07-llm-rank.png",
  },
  {
    title: "8. AI Overview Tracker",
    caption: "Google AI Overview tracking view.",
    description:
      "Monitor whether your brand appears in Google's AI Overviews for the queries your buyers actually search.",
    image: "/screenshots/08-ai-overview.png",
  },
  {
    title: "9. AI Keyword Analyzer",
    caption: "Prompt and keyword discovery view.",
    description:
      "Discover the prompts and keywords driving AI mentions in your category — and the ones you're missing entirely.",
    image: "/screenshots/09-keyword-analyzer.png",
  },
  {
    title: "10. Dashboard Overview",
    caption: "Main dashboard with saved scans, trends, and monitoring.",
    description:
      "Your command center: saved domains, score trends over time, competitor watch, and automated monitoring — all in one place.",
    image: "/screenshots/10-dashboard.png",
  },
];

function BrowserFrame({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-[0_20px_60px_-20px_rgba(250,204,21,0.15)] transition hover:border-yellow-400/40 hover:shadow-[0_20px_60px_-20px_rgba(250,204,21,0.35)]"
      aria-label={`Enlarge screenshot: ${alt}`}
    >
      <div className="flex items-center gap-1.5 border-b border-gray-800 bg-gray-950/80 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        <span className="ml-3 truncate text-[10px] text-gray-500">aimentionyou.com</span>
      </div>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-black">
            <ZoomIn className="h-4 w-4" /> Click to enlarge
          </div>
        </div>
      </div>
    </button>
  );
}

export function ProductWalkthrough() {
  const [lightbox, setLightbox] = useState<WalkthroughStep | null>(null);

  return (
    <section className="space-y-12">
      <div className="space-y-3 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          See AI Mention You in Action
        </h2>
        <p className="mx-auto max-w-2xl text-gray-400 text-sm md:text-base">
          A walkthrough of the full product — from your first scan to daily monitoring — using real screenshots from the app.
        </p>
      </div>

      <div className="space-y-16 md:space-y-24">
        {STEPS.map((step, i) => {
          const reverse = i % 2 === 1;
          return (
            <div
              key={step.title}
              className={`grid gap-8 md:grid-cols-2 md:gap-12 items-center ${
                reverse ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="space-y-3">
                <BrowserFrame
                  src={step.image}
                  alt={step.title}
                  onClick={() => setLightbox(step)}
                />
                <p className="text-xs text-gray-500 italic px-1">{step.caption}</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-white">{step.title}</h3>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-width CTA */}
      <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/10 via-gray-900 to-black p-8 md:p-12 text-center space-y-6">
        <h3 className="text-2xl md:text-4xl font-bold text-white max-w-3xl mx-auto">
          Ready to see where AI recommends your competitors instead of you?
        </h3>
        <div className="flex justify-center">
          <Link to="/#scan">
            <Button
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-base md:text-lg h-12 px-8"
              onClick={() => {
                document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Run Your Free AI Visibility Scan
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-6xl border-gray-800 bg-gray-950 p-0">
          {lightbox && (
            <div className="space-y-3 p-4">
              <img
                src={lightbox.image}
                alt={lightbox.title}
                className="w-full rounded-lg border border-gray-800"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="px-2 pb-2">
                <p className="text-white font-semibold">{lightbox.title}</p>
                <p className="text-sm text-gray-400">{lightbox.caption}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
