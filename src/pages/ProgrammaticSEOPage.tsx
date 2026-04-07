import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { pseoPagesBySlug } from "@/data/programmaticSEO";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, TrendingUp, Zap } from "lucide-react";

const ProgrammaticSEOPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? pseoPagesBySlug[slug] : undefined;

  useEffect(() => {
    if (!page) return;
    document.title = page.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", page.metaDescription);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://aimentionyou.com/ai-visibility/${page.slug}`;

    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
    const schema = [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: page.metaTitle,
        description: page.metaDescription,
        url: `https://aimentionyou.com/ai-visibility/${page.slug}`,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: page.faq1Q, acceptedAnswer: { "@type": "Answer", text: page.faq1A } },
          { "@type": "Question", name: page.faq2Q, acceptedAnswer: { "@type": "Answer", text: page.faq2A } },
          { "@type": "Question", name: page.faq3Q, acceptedAnswer: { "@type": "Answer", text: page.faq3A } },
        ],
      },
    ];
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `pseo-schema-${page.slug}`;
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById(`pseo-schema-${page.slug}`)?.remove();
      canonical?.remove();
      document.title = "AI Visibility Checker";
    };
  }, [page]);

  if (!page) return <Navigate to="/404" replace />;

  const related = page.relatedSlugs
    .map(s => pseoPagesBySlug[s])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-black">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-yellow-400/20 text-yellow-400 text-sm font-medium rounded-full mb-6">
              AI Visibility
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {page.headline}
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              {page.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold">
                <Link to="/#scan">{page.ctaText} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-900">
                <Link to="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">{page.stat1}</div>
              <div className="text-sm text-gray-400">{page.stat1Label}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">{page.stat2}</div>
              <div className="text-sm text-gray-400">{page.stat2Label}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">{page.stat3}</div>
              <div className="text-sm text-gray-400">{page.stat3Label}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">The Problem</h2>
              <p className="text-gray-400 leading-relaxed">{page.painPoint}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4 text-yellow-400">The Solution</h2>
              <p className="text-gray-400 leading-relaxed">{page.outcome}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How AIMentionYou Works for {page.useCase}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="h-6 w-6 text-yellow-400" />, title: "1. Scan", body: "Run a free scan to see your current citation rate across ChatGPT, Perplexity, Claude, and Gemini in 2 minutes." },
              { icon: <TrendingUp className="h-6 w-6 text-yellow-400" />, title: "2. Identify", body: "See your competitive share of voice and the exact gaps — which AI platforms aren't citing you and why." },
              { icon: <CheckCircle className="h-6 w-6 text-yellow-400" />, title: "3. Fix", body: "Get a prioritised list of specific actions — not generic advice — and track whether they're improving your citation rate week by week." },
            ].map((step, i) => (
              <div key={i} className="text-center p-6 bg-gray-900 rounded-xl border border-gray-800">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <blockquote className="text-xl text-gray-300 italic mb-6">
            "{page.testimonialQuote}"
          </blockquote>
          <div className="text-yellow-400 font-semibold">{page.testimonialName}</div>
          <div className="text-gray-500 text-sm">{page.testimonialRole}</div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-950">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              { q: page.faq1Q, a: page.faq1A },
              { q: page.faq2Q, a: page.faq2A },
              { q: page.faq3Q, a: page.faq3A },
            ].map((faq, i) => (
              <div key={i} className="p-6 bg-gray-900 rounded-xl border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Track Your AI Visibility?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of {page.useCase.toLowerCase()} using AIMentionYou to track and improve their brand's presence in AI search. Free scan — no credit card required.
          </p>
          <Button asChild size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold text-lg px-8">
            <Link to="/#scan">{page.ctaText} <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Related pages */}
      {related.length > 0 && (
        <section className="py-16 bg-gray-950 border-t border-gray-800">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-xl font-semibold mb-8 text-gray-300">Also relevant for:</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {related.map(r => (
                <Link
                  key={r.slug}
                  to={`/ai-visibility/${r.slug}`}
                  className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-yellow-400/50 transition-colors group"
                >
                  <div className="font-medium text-white group-hover:text-yellow-400 transition-colors mb-1">
                    {r.useCase}
                  </div>
                  <div className="text-sm text-gray-500">{r.headline}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-8 bg-black border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <Link to="/ai-visibility" className="text-yellow-400 hover:underline text-sm">
            ← View all AI visibility use cases
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ProgrammaticSEOPage;
