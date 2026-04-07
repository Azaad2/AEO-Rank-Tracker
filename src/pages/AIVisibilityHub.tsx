import { Link } from "react-router-dom";
import { useEffect } from "react";
import { pseoPages } from "@/data/programmaticSEO";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AIVisibilityHub = () => {
  useEffect(() => {
    document.title = "AI Visibility Tools by Use Case | AIMentionYou";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Track your AI visibility in ChatGPT, Perplexity, Claude & Gemini. Find guides for your specific use case — SaaS founders, SEO agencies, B2B marketers, ecommerce brands and more.");

    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
    const schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "AI Visibility Tools by Use Case",
      description: "Track and improve your brand's visibility in ChatGPT, Perplexity, Claude and Gemini. Guides for SaaS founders, SEO agencies, B2B marketers, ecommerce brands and more.",
      url: "https://aimentionyou.com/ai-visibility",
      hasPart: pseoPages.map(p => ({
        "@type": "WebPage",
        name: p.headline,
        url: `https://aimentionyou.com/ai-visibility/${p.slug}`,
        description: p.metaDescription,
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "hub-schema";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("hub-schema")?.remove();
      document.title = "AI Visibility Checker";
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <span className="inline-block px-3 py-1 bg-yellow-400/20 text-yellow-400 text-sm font-medium rounded-full mb-6">
            AI Visibility by Use Case
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Track Your AI Visibility — For Your Specific Use Case
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Whether you're a SaaS founder, SEO agency, B2B marketer, or ecommerce brand — see how your brand appears in ChatGPT, Perplexity, Claude, and Gemini, and exactly how to improve it.
          </p>
          <Button asChild size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold">
            <Link to="/#scan">Run Free AI Visibility Scan <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <section className="py-16 bg-gray-950">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold mb-10 text-center">Find Your Use Case</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pseoPages.map(page => (
              <Link
                key={page.slug}
                to={`/ai-visibility/${page.slug}`}
                className="group p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-yellow-400/50 transition-all hover:bg-gray-800"
              >
                <div className="text-xs text-yellow-400 font-medium uppercase tracking-wide mb-2">
                  {page.useCase}
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors mb-3">
                  {page.headline}
                </h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {page.heroSubtitle}
                </p>
                <div className="flex items-center text-sm text-yellow-400 font-medium">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-black">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">Track All 4 Major AI Platforms</h2>
          <p className="text-gray-400 mb-8">AIMentionYou monitors your brand across the AI platforms your customers actually use — in a single dashboard.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["ChatGPT", "Perplexity", "Claude", "Gemini"].map(platform => (
              <div key={platform} className="p-4 bg-gray-900 rounded-lg border border-gray-800 text-center">
                <div className="font-semibold text-white">{platform}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950 border-t border-gray-800">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Start for Free</h2>
          <p className="text-gray-400 mb-8">No credit card required. See your AI citation rate across ChatGPT, Perplexity, Claude, and Gemini in 2 minutes.</p>
          <Button asChild size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold text-lg">
            <Link to="/#scan">Run My Free Scan <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AIVisibilityHub;
