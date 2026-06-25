import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import {
  DollarSign,
  Cookie,
  Repeat,
  Wallet,
  Megaphone,
  LineChart,
  Users,
  Sparkles,
  CheckCircle2,
  Mail,
} from "lucide-react";

const APPLY_EMAIL = "hello@aimentionyou.com";
const APPLY_SUBJECT = "Affiliate Program Application";
const APPLY_BODY =
  "Hi AI Mention You team,%0D%0A%0D%0AI'd like to join your affiliate program.%0D%0A%0D%0AName:%0D%0AWebsite / audience:%0D%0AAudience size:%0D%0AHow I'd promote AI Mention You:%0D%0A%0D%0AThanks!";
const applyHref = `mailto:${APPLY_EMAIL}?subject=${encodeURIComponent(
  APPLY_SUBJECT
)}&body=${APPLY_BODY}`;

const Affiliates = () => {
  useSeoMeta({
    title: "Affiliate Program – Earn 30% Recurring | AI Mention You",
    description:
      "Promote AI Mention You and earn 30% recurring commission for the lifetime of every customer. 90-day cookie, $45 minimum payout.",
    canonical: "https://aimentionyou.com/affiliates",
  });

  const perks = [
    {
      icon: Repeat,
      title: "30% Recurring",
      desc: "Earn 30% of every payment for the lifetime of the customer you refer. Forever.",
    },
    {
      icon: Cookie,
      title: "90-Day Cookie",
      desc: "Generous attribution window. If they sign up within 90 days, they're yours.",
    },
    {
      icon: Wallet,
      title: "$45 Minimum Payout",
      desc: "Low threshold. Get paid as soon as your balance hits $45.",
    },
    {
      icon: Sparkles,
      title: "Hot Category",
      desc: "AI search visibility is the fastest-growing SEO niche. Easy to pitch in 2026.",
    },
  ];

  const audience = [
    "SEO consultants & agencies",
    "AI / GEO content creators",
    "SaaS YouTubers & newsletter writers",
    "Marketing course creators",
    "Reddit / LinkedIn / X creators",
    "Indie hackers reviewing AI tools",
  ];

  const math = [
    { plan: "Pro", price: 19, refs: 20 },
    { plan: "Team", price: 49, refs: 10 },
    { plan: "Agency", price: 149, refs: 5 },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-400 text-xs font-medium mb-6">
            <Megaphone className="h-3.5 w-3.5" /> Affiliate Program
          </div>
          <h1
            className="text-3xl md:text-5xl text-white mb-6 leading-tight"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            Earn 30% Recurring.
            <br />
            <span className="text-yellow-400">For Life.</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Help brands get cited by ChatGPT, Gemini, Claude, and Perplexity —
            and earn 30% of every subscription payment they make, forever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
            >
              <a href={applyHref}>
                <Mail className="h-4 w-4 mr-2" /> Apply to Join
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
            >
              <Link to="/pricing">See What You'll Promote</Link>
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            No application fee. Most affiliates are approved within 48 hours.
          </p>
        </section>

        {/* Perks grid */}
        <section className="container mx-auto px-4 max-w-5xl mt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {perks.map((p) => (
              <Card
                key={p.title}
                className="bg-gray-900 border-gray-800 p-6 hover:border-yellow-400/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-yellow-400/15 text-yellow-400 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="text-white font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Earnings math */}
        <section className="container mx-auto px-4 max-w-5xl mt-20">
          <h2
            className="text-2xl md:text-3xl text-white text-center mb-3"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span className="text-yellow-400">Real</span> Earnings
          </h2>
          <p className="text-center text-gray-400 mb-10">
            What recurring commission looks like at our current pricing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {math.map((m) => {
              const monthly = m.price * 0.3 * m.refs;
              const yearly = monthly * 12;
              return (
                <Card
                  key={m.plan}
                  className="bg-gray-900 border-gray-800 p-6 text-center"
                >
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                    {m.refs} {m.plan} referrals
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">
                    ${monthly.toFixed(0)}
                    <span className="text-sm text-gray-400 font-normal">
                      /mo
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    = ${yearly.toFixed(0)} / year recurring
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 text-center mt-6">
            Illustrative based on 30% recurring at listed plan prices. Actual
            earnings vary with retention.
          </p>
        </section>

        {/* Who it's for */}
        <section className="container mx-auto px-4 max-w-5xl mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2
                className="text-2xl md:text-3xl text-white mb-4"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                Who <span className="text-yellow-400">Should Apply</span>
              </h2>
              <p className="text-gray-400 mb-6">
                Anyone with an audience that cares about SEO, AI search, or
                growing brand visibility — from solo creators to full agencies.
              </p>
              <ul className="space-y-3">
                {audience.map((a) => (
                  <li key={a} className="flex items-center gap-3 text-gray-200">
                    <CheckCircle2 className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-yellow-400" /> What You Get
              </h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">›</span> Unique referral
                  link with 90-day cookie attribution
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">›</span> Real-time
                  dashboard tracking clicks, signups, and commissions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">›</span> Pre-made swipe
                  copy, banners, and demo videos
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">›</span> Monthly payouts
                  via PayPal or Wise once you hit $45
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">›</span> Direct line to our
                  team for custom co-marketing
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 max-w-5xl mt-20">
          <h2
            className="text-2xl md:text-3xl text-white text-center mb-10"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            How It <span className="text-yellow-400">Works</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { n: "01", t: "Apply", d: "Send a short application — tell us about your audience." },
              { n: "02", t: "Get Approved", d: "We review within 48 hours and send your unique link." },
              { n: "03", t: "Promote", d: "Share your link in content, newsletters, social, or to clients." },
              { n: "04", t: "Get Paid", d: "Earn 30% of every payment, every month, for life." },
            ].map((s) => (
              <Card key={s.n} className="bg-gray-900 border-gray-800 p-5">
                <div className="text-yellow-400 text-sm font-mono mb-2">{s.n}</div>
                <div className="text-white font-semibold mb-1">{s.t}</div>
                <div className="text-sm text-gray-400">{s.d}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* Program terms */}
        <section className="container mx-auto px-4 max-w-3xl mt-20">
          <Card className="bg-gray-900 border-gray-800 p-8">
            <h2 className="text-xl text-white mb-6 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-400" /> Program Terms
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {[
                ["Commission", "30% recurring (lifetime)"],
                ["Cookie window", "90 days, last-click"],
                ["Minimum payout", "$45"],
                ["Payout schedule", "Monthly (Net-30)"],
                ["Payout methods", "PayPal, Wise"],
                ["Self-referrals", "Not allowed"],
                ["Paid search on brand", "Not allowed"],
                ["Refund clawback", "60 days"],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-gray-800 pb-3">
                  <dt className="text-gray-500 text-xs uppercase tracking-wide">
                    {k}
                  </dt>
                  <dd className="text-white mt-1">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 max-w-3xl mt-20 text-center">
          <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-b from-yellow-400/10 to-transparent p-10">
            <Users className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
            <h2
              className="text-2xl md:text-3xl text-white mb-3"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              Ready to <span className="text-yellow-400">Earn?</span>
            </h2>
            <p className="text-gray-300 mb-6">
              Apply now and start earning recurring commission this week.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
            >
              <a href={applyHref}>
                <Mail className="h-4 w-4 mr-2" /> Apply to Join
              </a>
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Or email us directly at{" "}
              <a
                href={`mailto:${APPLY_EMAIL}`}
                className="text-yellow-400 hover:underline"
              >
                {APPLY_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Affiliates;
