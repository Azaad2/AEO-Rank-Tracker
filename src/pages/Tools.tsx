import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Search, MessageSquare, FileText, Code, Lightbulb, Users, BarChart3, Mail, PenLine, Eye, Zap, Type, AlignLeft, Globe, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolCard from "@/components/tools/ToolCard";
import { Header } from "@/components/Header";

const tools = [
  {
    category: "AI Visibility Tools",
    items: [
      {
        title: "AI Visibility Checker",
        description: "Check if your website is mentioned and cited by AI assistants like ChatGPT, Gemini, and Perplexity.",
        href: "/",
        icon: Search,
        isPopular: true,
        badge: "Featured",
      },
      {
        title: "Perplexity Rank Tracker",
        description: "Track your visibility in Perplexity AI search. Monitor citations and mentions.",
        href: "/tools/perplexity-rank-tracker",
        icon: Search,
        isPopular: true,
      },
      {
        title: "ChatGPT Mention Tracker",
        description: "Monitor how ChatGPT mentions your brand. Track visibility and sentiment.",
        href: "/tools/chatgpt-mention-tracker",
        icon: MessageSquare,
      },
      {
        title: "Claude Rank Tracker",
        description: "Track your visibility in Claude AI responses and recommendations.",
        href: "/tools/claude-rank-tracker",
        icon: Users,
      },
      {
        title: "AI Overviews Tracker",
        description: "Monitor your visibility in Google AI Overviews and AI Mode.",
        href: "/tools/ai-overviews-tracker",
        icon: Globe,
      },
      {
        title: "Copilot Rank Tracker",
        description: "Track visibility in Microsoft Copilot across Bing and Windows.",
        href: "/tools/copilot-rank-tracker",
        icon: Eye,
      },
      {
        title: "LLM Rank Tracker",
        description: "Track visibility across all major LLMs in one unified view.",
        href: "/tools/llm-rank-tracker",
        icon: BarChart3,
      },
      {
        title: "GEO Optimization Checker",
        description: "Check your Generative Engine Optimization score for AI search.",
        href: "/tools/geo-optimization-checker",
        icon: Target,
      },
      {
        title: "AI Citation Tracker",
        description: "Monitor when AI assistants cite your website as a source.",
        href: "/tools/ai-citation-tracker",
        icon: Zap,
      },
      {
        title: "Competitor AI Analyzer",
        description: "Compare your AI visibility against competitors.",
        href: "/tools/competitor-analyzer",
        icon: Users,
      },
      {
        title: "Brand Monitor",
        description: "Track where your brand appears in AI-generated responses.",
        href: "/tools/brand-monitor",
        icon: Eye,
      },
      {
        title: "LLM Readiness Score",
        description: "Get a score on how AI-friendly your website is.",
        href: "/tools/llm-readiness",
        icon: BarChart3,
      },
    ],
  },
  {
    category: "AI Generator Tools",
    items: [
      {
        title: "AI Prompt Generator",
        description: "Generate industry-specific prompts your customers ask AI assistants. Optimize your content for these queries.",
        href: "/tools/ai-prompt-generator",
        icon: Lightbulb,
        isPopular: true,
      },
      {
        title: "AI Answer Generator",
        description: "Create comprehensive, citation-optimized answers that AI assistants are likely to reference.",
        href: "/tools/ai-answer-generator",
        icon: MessageSquare,
      },
      {
        title: "AI Email Generator",
        description: "Generate professional email copy with AI. Choose tone, purpose, and get multiple variations.",
        href: "/tools/ai-email-generator",
        icon: Mail,
      },
      {
        title: "AI Blog Outline",
        description: "Create complete blog structures with SEO-optimized headings, sections, and key points.",
        href: "/tools/ai-blog-outline",
        icon: PenLine,
      },
    ],
  },
  {
    category: "Content Optimization Tools",
    items: [
      {
        title: "AI FAQ Generator",
        description: "Generate FAQs with schema markup that AI assistants love to cite. Boost your chances of being mentioned.",
        href: "/tools/ai-faq-generator",
        icon: MessageSquare,
        isPopular: true,
      },
      {
        title: "Schema Generator",
        description: "Create JSON-LD schema markup for your business. Help AI understand your content better.",
        href: "/tools/schema-generator",
        icon: Code,
      },
      {
        title: "Meta Optimizer",
        description: "Optimize your meta titles and descriptions for both search engines and AI discovery.",
        href: "/tools/meta-optimizer",
        icon: Zap,
      },
      {
        title: "Content Auditor",
        description: "Analyze your content for AI-friendliness. Get actionable recommendations to improve visibility.",
        href: "/tools/content-auditor",
        icon: FileText,
      },
    ],
  },
  {
    category: "SEO & Research Tools",
    items: [
      {
        title: "Keyword Analyzer",
        description: "Discover AI-focused keyword opportunities. Find what questions users ask AI about your topic.",
        href: "/tools/keyword-analyzer",
        icon: Target,
      },
      {
        title: "SERP Previewer",
        description: "Preview how your page appears in search results and AI overviews before publishing.",
        href: "/tools/serp-previewer",
        icon: Globe,
      },
      {
        title: "Title Generator",
        description: "Generate 10 SEO-optimized title options for your content. Maximize click-through rates.",
        href: "/tools/title-generator",
        icon: Type,
      },
      {
        title: "Description Generator",
        description: "Create meta descriptions optimized for both search engines and AI assistants.",
        href: "/tools/description-generator",
        icon: AlignLeft,
      },
    ],
  },
];

const Tools = () => {
  useEffect(() => {
    document.title = "Free AI Visibility Tools — 24 Tools for AI SEO | AIMentionYou";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "24 free AI visibility tools: check if ChatGPT mentions you, track Perplexity rankings, generate FAQ schema, create AI-optimised content, and monitor brand visibility across every major LLM.");
    let can = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!can) { can = document.createElement("link"); can.rel = "canonical"; document.head.appendChild(can); }
    can.href = "https://aimentionyou.com/tools";
    const ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) ogT.setAttribute("content", "Free AI Visibility Tools — 24 Tools for AI SEO | AIMentionYou");
    const id = "tools-schema";
    document.getElementById(id)?.remove();
    const s = document.createElement("script"); s.id = id; s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", name: "Free AI Visibility Tools", url: "https://aimentionyou.com/tools", numberOfItems: 24, itemListElement: [
      { "@type": "ListItem", position: 1, name: "AI Visibility Checker", url: "https://aimentionyou.com/" },
      { "@type": "ListItem", position: 2, name: "Perplexity Rank Tracker", url: "https://aimentionyou.com/tools/perplexity-rank-tracker" },
      { "@type": "ListItem", position: 3, name: "ChatGPT Mention Tracker", url: "https://aimentionyou.com/tools/chatgpt-mention-tracker" },
      { "@type": "ListItem", position: 4, name: "Claude Rank Tracker", url: "https://aimentionyou.com/tools/claude-rank-tracker" },
      { "@type": "ListItem", position: 5, name: "AI Prompt Generator", url: "https://aimentionyou.com/tools/ai-prompt-generator" },
      { "@type": "ListItem", position: 6, name: "AI FAQ Generator", url: "https://aimentionyou.com/tools/ai-faq-generator" },
      { "@type": "ListItem", position: 7, name: "Schema Generator", url: "https://aimentionyou.com/tools/schema-generator" },
      { "@type": "ListItem", position: 8, name: "AI Blog Outline", url: "https://aimentionyou.com/tools/ai-blog-outline" },
    ]});
    document.head.appendChild(s);
    return () => { document.getElementById(id)?.remove(); can?.remove(); document.title = "AI Visibility Checker"; };
  }, []);
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="bg-black pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Free AI Visibility Tools
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Everything you need to optimize your website for AI search engines. 
            Get discovered by ChatGPT, Gemini, Perplexity, and more.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              24 Free Tools
            </span>
            <span className="text-gray-600">•</span>
            <span>No signup required</span>
            <span className="text-gray-600">•</span>
            <span>100% Free</span>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <main className="container mx-auto px-4 py-12 md:py-16">
        {tools.map((category) => (
          <div key={category.category} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              {category.category}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.items.map((tool) => (
                <ToolCard
                  key={tool.href}
                  title={tool.title}
                  description={tool.description}
                  href={tool.href}
                  icon={tool.icon}
                  badge={tool.badge}
                  isPopular={tool.isPopular}
                />
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* CTA Section */}
      <section className="border-t border-gray-800 bg-gray-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
            Start with the AI Visibility Checker
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Our flagship tool analyzes how AI assistants see your website. 
            Get actionable insights to improve your AI search visibility.
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2 bg-yellow-400 text-black hover:bg-yellow-500">
              <Search className="h-5 w-5" />
              Check Your AI Visibility
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-white mb-4">AI Visibility</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-yellow-400 hover:text-yellow-300 transition-colors">AI Visibility Checker</Link></li>
                <li><Link to="/tools/perplexity-rank-tracker" className="text-yellow-400 hover:text-yellow-300 transition-colors">Perplexity Tracker</Link></li>
                <li><Link to="/tools/chatgpt-mention-tracker" className="text-yellow-400 hover:text-yellow-300 transition-colors">ChatGPT Tracker</Link></li>
                <li><Link to="/tools/claude-rank-tracker" className="text-yellow-400 hover:text-yellow-300 transition-colors">Claude Tracker</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">AI Generators</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/tools/ai-prompt-generator" className="text-yellow-400 hover:text-yellow-300 transition-colors">Prompt Generator</Link></li>
                <li><Link to="/tools/ai-faq-generator" className="text-yellow-400 hover:text-yellow-300 transition-colors">FAQ Generator</Link></li>
                <li><Link to="/tools/schema-generator" className="text-yellow-400 hover:text-yellow-300 transition-colors">Schema Generator</Link></li>
                <li><Link to="/tools/ai-email-generator" className="text-yellow-400 hover:text-yellow-300 transition-colors">Email Generator</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/blog" className="text-yellow-400 hover:text-yellow-300 transition-colors">Blog</Link></li>
                <li><Link to="/tools" className="text-yellow-400 hover:text-yellow-300 transition-colors">All Tools</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-yellow-400 hover:text-yellow-300 transition-colors">About</Link></li>
                <li><Link to="/contact" className="text-yellow-400 hover:text-yellow-300 transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="text-yellow-400 hover:text-yellow-300 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-yellow-400 hover:text-yellow-300 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} AI Visibility Checker. All rights reserved.</p>
            <a href="mailto:hello@aimentionyou.com" className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm block mt-2">
              hello@aimentionyou.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Tools;
