import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  Zap,
  Users,
  Building2,
  ArrowRight,
  Loader2,
  Sparkles,
  Search,
  Link2,
  Target,
  LineChart,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRazorpay } from "@/hooks/useRazorpay";
import { toast } from "sonner";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "See if AI assistants recommend your brand today.",
    benefits: [
      "AI Visibility Score",
      "Competitor comparison",
      "1 scan per day",
      "Sample recommendations",
      "Limited report access",
    ],
    limits: "1 scan/day · 5 prompts/scan · 10 AI Assistant messages/mo",
    cta: "Get Started Free",
    popular: false,
    icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    period: "/month",
    description: "For brands actively trying to increase AI recommendations.",
    benefits: [
      "Discover why competitors are recommended",
      "Track visibility across ChatGPT, Gemini, Claude & Perplexity",
      "See citation sources AI trusts",
      "Weekly recommendation intelligence",
      "Prioritized action plans",
      "Progress tracking over time",
    ],
    limits: "10 scans/mo · 50 prompts/mo · 1 domain monitored daily",
    cta: "Upgrade to Pro",
    popular: true,
    icon: Zap,
    tagline: "Starts at less than $1/day",
  },
  {
    id: "team",
    name: "Growth",
    price: 79,
    period: "/month",
    description: "For growing brands managing multiple products, websites, or business units.",
    benefits: [
      "Everything in Pro",
      "Multiple domains monitored",
      "Shared team access",
      "Collaborative reporting",
      "Expanded tracking capacity",
    ],
    limits: "30 scans/mo · 150 prompts/mo · 3 domains monitored daily",
    cta: "Start Growth Plan",
    popular: false,
    icon: Users,
  },
  {
    id: "agency",
    name: "Agency",
    price: 199,
    period: "/month",
    description: "For agencies helping clients improve AI visibility.",
    benefits: [
      "Unlimited client scans",
      "Multi-client dashboard",
      "White-label reporting",
      "Priority processing",
      "Client management tools",
    ],
    limits: "Unlimited scans · 500 prompts/mo · Unlimited domains",
    cta: "Contact Sales",
    popular: false,
    icon: Building2,
  },
  {
    id: "advisory",
    name: "AI Visibility Advisory",
    price: null as number | null,
    period: "",
    description: "Hands-on help implementing the recommendations.",
    benefits: [
      "Monthly strategy calls",
      "AI visibility audits",
      "Competitor analysis",
      "Citation opportunity review",
      "Content roadmap",
      "Team training",
      "Implementation guidance",
    ],
    limits: "",
    cta: "Book Consultation",
    popular: false,
    icon: Sparkles,
    advisory: true,
  },
];

const trustCards = [
  {
    icon: Target,
    title: "Recommendation Intelligence",
    body: "Understand why competitors are being recommended instead of your brand.",
  },
  {
    icon: Link2,
    title: "Citation Intelligence",
    body: "See which websites and sources AI assistants trust.",
  },
  {
    icon: Search,
    title: "Opportunity Discovery",
    body: "Find the highest-impact actions to improve visibility.",
  },
  {
    icon: LineChart,
    title: "Continuous Monitoring",
    body: "Track AI recommendation trends over time.",
  },
];

const beforeItems = [
  "AI recommends competitors",
  "No visibility into citation sources",
  "No understanding of why competitors win",
  "No AI recommendation strategy",
];

const afterItems = [
  "See who AI recommends instead of you",
  "Discover citation sources AI trusts",
  "Identify missing authority signals",
  "Get a prioritized action plan",
  "Track visibility improvements over time",
];

export default function Pricing() {
  useEffect(() => {
    document.title = "AI Visibility Pricing — Plans & Costs";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Find out why AI recommends your competitors — then fix it. Track AI recommendations across ChatGPT, Gemini, Claude and Perplexity. Plans from free to agency.");
    let can = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!can) { can = document.createElement("link"); can.rel = "canonical"; document.head.appendChild(can); }
    can.href = "https://aimentionyou.com/pricing";
    const ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) ogT.setAttribute("content", "AI Visibility Pricing — Free, Pro, Growth, Agency & Advisory | AIMentionYou");
    const id = "pricing-schema";
    document.getElementById(id)?.remove();
    const s = document.createElement("script"); s.id = id; s.type = "application/ld+json";
    s.textContent = JSON.stringify([
      { "@context": "https://schema.org", "@type": "WebPage", name: "AI Visibility Pricing", url: "https://aimentionyou.com/pricing" },
      { "@context": "https://schema.org", "@type": "ItemList", name: "AIMentionYou Pricing Plans", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Free — $0/month" },
        { "@type": "ListItem", position: 2, name: "Pro — $29/month" },
        { "@type": "ListItem", position: 3, name: "Growth — $79/month" },
        { "@type": "ListItem", position: 4, name: "Agency — $199/month" },
        { "@type": "ListItem", position: 5, name: "AI Visibility Advisory — Custom" },
      ]},
    ]);
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); can?.remove(); document.title = "AI Visibility Checker"; };
  }, []);

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { initiateCheckout, isLoading } = useRazorpay({
    onSuccess: () => { setLoadingPlan(null); navigate('/dashboard'); },
    onError: () => { setLoadingPlan(null); },
  });

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') { navigate('/#scan'); return; }
    if (planId === 'agency' || planId === 'advisory') { navigate('/contact'); return; }
    if (!user) {
      toast.info('Please sign in to upgrade your plan');
      navigate('/auth?redirect=/pricing');
      return;
    }
    setLoadingPlan(planId);
    await initiateCheckout(planId, user.email || '', user.id);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="flex-1 pt-28">
        {/* Hero */}
        <section className="py-16 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <Badge className="mb-4 bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
              Recommendation Intelligence
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Find Out Why AI Recommends Your Competitors — Then Fix It
            </h1>
            <p className="text-lg md:text-xl text-gray-400">
              Track AI recommendations, discover citation sources, uncover competitor advantages, and get action plans to improve visibility across ChatGPT, Gemini, Claude, and Perplexity.
            </p>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-10 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-center text-2xl md:text-3xl font-bold text-white mb-8">
              Why Brands Use AIMentionYou
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trustCards.map((c) => (
                <Card key={c.title} className="bg-gray-900 border-gray-700">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-lg bg-yellow-400/20 flex items-center justify-center mb-3">
                      <c.icon className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{c.title}</h3>
                    <p className="text-gray-400 text-sm">{c.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-10 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
              {plans.map((plan) => {
                const isPlanLoading = loadingPlan === plan.id || (isLoading && loadingPlan === plan.id);
                const isAdvisory = (plan as any).advisory;

                return (
                  <Card
                    key={plan.id}
                    className={`relative bg-gray-900 border-gray-700 hover:border-yellow-400/50 transition-all duration-300 flex flex-col ${
                      plan.popular ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20" : ""
                    } ${isAdvisory ? "border-yellow-400/70 ring-1 ring-yellow-400/40" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-yellow-400 text-black font-semibold">Most Popular</Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center mb-3">
                        <plan.icon className="w-6 h-6 text-yellow-400" />
                      </div>
                      <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-gray-400 min-h-[48px]">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="text-center flex-1">
                      <div className="mb-2">
                        {plan.price === null ? (
                          <span className="text-3xl font-bold text-white">Custom</span>
                        ) : (
                          <>
                            <span className="text-4xl font-bold text-white">${plan.price}</span>
                            <span className="text-gray-400">{plan.period}</span>
                          </>
                        )}
                      </div>
                      {(plan as any).tagline && (
                        <p className="text-xs text-yellow-400 mb-4">{(plan as any).tagline}</p>
                      )}
                      {!(plan as any).tagline && <div className="mb-4" />}

                      <div className="space-y-3 text-left">
                        {plan.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">{b}</span>
                          </div>
                        ))}
                      </div>

                      {plan.limits && (
                        <p className="mt-5 text-[11px] text-gray-500 leading-relaxed text-left">
                          {plan.limits}
                        </p>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? "bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                            : isAdvisory
                              ? "bg-yellow-400/10 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                              : "bg-gray-800 hover:bg-gray-700 text-white"
                        }`}
                        onClick={() => handlePlanSelect(plan.id)}
                        disabled={isPlanLoading}
                      >
                        {isPlanLoading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                        ) : (
                          <>{plan.cta}<ArrowRight className="w-4 h-4 ml-2" /></>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
            <p className="text-center text-gray-500 text-sm mt-6">
              No contracts. Cancel anytime.
            </p>
          </div>
        </section>

        {/* Outcome Comparison */}
        <section className="py-16 px-4 bg-gray-900">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-white">
              What Success Looks Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-black border-red-900/40">
                <CardHeader>
                  <CardTitle className="text-red-400 text-lg">Before AIMentionYou</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {beforeItems.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-gray-400 text-sm">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-black border-yellow-400/40">
                <CardHeader>
                  <CardTitle className="text-yellow-400 text-lg">After AIMentionYou</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {afterItems.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-2">What does a scan actually tell me?</h3>
                <p className="text-gray-400">
                  Each scan reveals whether AI assistants recommend your brand for key prompts, who they recommend instead, and which sources they cite — so you know exactly where to improve.
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-2">Can I upgrade or downgrade anytime?</h3>
                <p className="text-gray-400">
                  Yes. Upgrades take effect immediately, downgrades apply at the end of your billing period. No contracts.
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-2">Which AI assistants do you track?</h3>
                <p className="text-gray-400">
                  ChatGPT, Gemini, Claude, and Perplexity — the assistants users actually rely on to discover brands and products.
                </p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-2">Do you offer refunds?</h3>
                <p className="text-gray-400">
                  Yes — a 14-day money-back guarantee on all paid plans.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gray-900">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Ready to See Who AI Recommends Instead of You?
            </h2>
            <p className="text-gray-400 mb-8">
              Start with a free scan and uncover your AI visibility gap.
            </p>
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold" asChild>
              <Link to="/#scan">Run Free Scan Now<ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
