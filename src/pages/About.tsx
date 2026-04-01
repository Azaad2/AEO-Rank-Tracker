import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const About = () => {
  useEffect(() => {
    document.title = "About AIMentionYou — AI Visibility Checker for Brands & Agencies";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "AIMentionYou helps businesses track and improve their presence in AI-powered search engines like ChatGPT, Perplexity, and Gemini. Free tools for any website.");
    let can = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!can) { can = document.createElement("link"); can.rel = "canonical"; document.head.appendChild(can); }
    can.href = "https://aimentionyou.com/about";
    const ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) ogT.setAttribute("content", "About AIMentionYou — AI Visibility Checker for Brands & Agencies");
    const id = "about-schema";
    document.getElementById(id)?.remove();
    const s = document.createElement("script"); s.id = id; s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "AIMentionYou", url: "https://aimentionyou.com", logo: "https://aimentionyou.com/favicon.png", description: "Free AI visibility tools for brands, agencies, and marketers.", contactPoint: { "@type": "ContactPoint", email: "hello@aimentionyou.com", contactType: "customer support" } });
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); can?.remove(); document.title = "AI Visibility Checker"; };
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              About <span className="text-yellow-400">Us</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Helping businesses get discovered by AI search engines
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-gray-300">
            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
              <p className="leading-relaxed">
                AI Visibility Checker was created to help businesses understand and improve their presence 
                in AI-powered search engines like ChatGPT, Perplexity, and Google Gemini. As AI search 
                becomes the primary way people discover information, we believe every business deserves 
                the tools to thrive in this new landscape.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">What We Do</h2>
              <p className="leading-relaxed mb-4">
                We provide a suite of free tools designed to help you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>Check if AI systems mention your brand and website</li>
                <li>Analyze how competitors appear in AI-generated responses</li>
                <li>Generate optimized content that AI systems prefer to cite</li>
                <li>Track your AI visibility over time</li>
                <li>Improve your content for better AI discovery</li>
              </ul>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Why AI Visibility Matters</h2>
              <p className="leading-relaxed">
                Traditional SEO focused on ranking in Google's blue links. But today, millions of users 
                ask ChatGPT, Perplexity, and other AI assistants for recommendations. If your business 
                isn't being mentioned in these AI responses, you're missing out on a growing segment of 
                potential customers. Our tools help bridge that gap.
              </p>
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Get Started</h2>
              <p className="leading-relaxed mb-4">
                Ready to check your AI visibility? Our scanner is completely free and takes just a minute to run.
              </p>
              <Link 
                to="/"
                className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Run a Free AI Visibility Scan
              </Link>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} AI Visibility Checker. All rights reserved.
          </p>
          <a href="mailto:hello@aimentionyou.com" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors block mt-2">
            hello@aimentionyou.com
          </a>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">Home</Link>
            <Link to="/tools" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">All Tools</Link>
            <Link to="/contact" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
