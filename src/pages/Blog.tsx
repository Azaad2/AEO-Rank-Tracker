import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BlogCard } from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  "AI Visibility",
  "AI Generators",
  "Content Tools",
  "SEO Tools",
  "GEO",
  "AI Trackers",
];

const blogPosts = [
  {
    title: "What is Answer Engine Optimization (AEO)? Complete Guide for 2026",
    description: "Answer Engine Optimization (AEO) is the new SEO. Learn what it is, how it differs from traditional SEO, and how to track and improve your AEO performance in 2026.",
    slug: "what-is-answer-engine-optimization-aeo-guide",
    category: "AI Visibility",
    readTime: "15 min",
    publishDate: "March 26, 2026",
    featured: true,
  },
  {
    title: "7 Best Online LLM Rank Trackers for AI Visibility in 2026 (Tested and Compared)",
    description: "Tracking your brand in AI search results is the new SEO. We tested the best LLM rank tracker tools in 2026 — here's what each one does and who it's for.",
    slug: "best-online-llm-rank-tracker",
    category: "AI Visibility",
    readTime: "14 min",
    publishDate: "March 19, 2026",
    featured: true,
  },
  {
    title: "AI Visibility Tools 2026: Why AImentionyou Beats Semrush, Peec AI & Profound",
    description: "Complete comparison of top 9 AI visibility tools. AImentionyou crushes on price (Free-$19), free technical tools, and developer workflows.",
    slug: "ai-visibility-tools-comparison-2026",
    category: "AI Visibility",
    readTime: "12 min",
    publishDate: "January 19, 2026",
    featured: true,
  },
  {
    title: "How to Check If AI Mentions Your Website: Complete Guide",
    description: "Discover whether ChatGPT, Gemini, and Perplexity mention your brand when users ask relevant questions. Learn how to improve your AI search visibility.",
    slug: "ai-visibility-checker-guide",
    category: "AI Visibility",
    readTime: "8 min",
    publishDate: "January 15, 2025",
  },
  {
    title: "Competitor AI Analysis: How to Track Your Rivals in AI Search",
    description: "Learn how to analyze your competitors' presence in AI-powered search engines and develop strategies to outperform them in AI citations.",
    slug: "competitor-ai-analysis",
    category: "AI Visibility",
    readTime: "7 min",
    publishDate: "January 14, 2025",
  },
  {
    title: "AI Brand Monitoring: Track Your Mentions Across AI Platforms",
    description: "Complete guide to monitoring how AI assistants like ChatGPT and Gemini talk about your brand. Protect your reputation in AI search.",
    slug: "ai-brand-monitoring",
    category: "AI Visibility",
    readTime: "9 min",
    publishDate: "January 13, 2025",
  },
  {
    title: "LLM Readiness Optimization: Make Your Website AI-Friendly",
    description: "How to optimize your website structure and content for large language models. Improve your chances of being cited by AI assistants.",
    slug: "llm-readiness-optimization",
    category: "AI Visibility",
    readTime: "10 min",
    publishDate: "January 12, 2025",
  },
  {
    title: "AI Prompt Generator Guide: Create Customer Search Queries",
    description: "Learn how to generate the prompts your customers use when searching with AI. Optimize your content for real user queries.",
    slug: "ai-prompt-generator-guide",
    category: "AI Generators",
    readTime: "6 min",
    publishDate: "January 11, 2025",
  },
  {
    title: "AI Answer Optimization: Write Content That Gets Cited",
    description: "Comprehensive guide to creating citation-optimized content that AI assistants will use and reference in their responses.",
    slug: "ai-answer-optimization",
    category: "AI Generators",
    readTime: "8 min",
    publishDate: "January 10, 2025",
  },
  {
    title: "AI Email Generator: Create Professional Emails in Seconds",
    description: "How to use AI to generate professional, personalized emails that save time and improve communication effectiveness.",
    slug: "ai-email-generator-guide",
    category: "AI Generators",
    readTime: "5 min",
    publishDate: "January 9, 2025",
  },
  {
    title: "AI Blog Outline Generator: Structure Content for SEO Success",
    description: "Create SEO-optimized blog outlines using AI. Learn the structure and format that ranks in both traditional and AI search.",
    slug: "ai-blog-outline-generator",
    category: "AI Generators",
    readTime: "7 min",
    publishDate: "January 8, 2025",
  },
  {
    title: "AI FAQ Generator: Create Schema-Ready Question Answers",
    description: "Generate comprehensive FAQs with proper schema markup for featured snippets and AI citations. Complete implementation guide.",
    slug: "ai-faq-generator-guide",
    category: "Content Tools",
    readTime: "8 min",
    publishDate: "January 7, 2025",
  },
  {
    title: "Schema Markup Generator: JSON-LD for AI and SEO",
    description: "Master schema markup with our complete guide. Create structured data that search engines and AI assistants understand.",
    slug: "schema-markup-generator",
    category: "Content Tools",
    readTime: "9 min",
    publishDate: "January 6, 2025",
  },
  {
    title: "Meta Tag Optimization: Perfect Titles and Descriptions",
    description: "Optimize your meta tags for both click-through rates and AI understanding. Data-driven strategies for better visibility.",
    slug: "meta-tag-optimization",
    category: "Content Tools",
    readTime: "6 min",
    publishDate: "January 5, 2025",
  },
  {
    title: "Content Audit for AI Visibility: Improve Your Existing Pages",
    description: "How to audit your content for AI search optimization. Identify gaps and opportunities to improve AI citations.",
    slug: "content-audit-ai-visibility",
    category: "Content Tools",
    readTime: "10 min",
    publishDate: "January 4, 2025",
  },
  {
    title: "AI Keyword Research: Finding Queries That Matter",
    description: "Discover keywords and queries that users ask AI assistants. Optimize your content strategy for AI-first search.",
    slug: "ai-keyword-research",
    category: "SEO Tools",
    readTime: "7 min",
    publishDate: "January 3, 2025",
  },
  {
    title: "SERP Preview Tool: Optimize Your Search Snippets",
    description: "Preview how your pages appear in search results. Optimize titles and descriptions for maximum click-through rates.",
    slug: "serp-preview-tool",
    category: "SEO Tools",
    readTime: "5 min",
    publishDate: "January 2, 2025",
  },
  {
    title: "SEO Title Generator: Headlines That Rank and Convert",
    description: "Create compelling titles that rank in search engines and attract clicks. AI-powered headline optimization strategies.",
    slug: "seo-title-generator",
    category: "SEO Tools",
    readTime: "6 min",
    publishDate: "January 1, 2025",
  },
  {
    title: "Meta Description Generator: Write Descriptions That Convert",
    description: "Generate optimized meta descriptions that improve CTR and provide context for AI search engines. Complete guide with examples.",
    slug: "meta-description-generator",
    category: "SEO Tools",
    readTime: "6 min",
    publishDate: "December 31, 2024",
  },
  {
    title: "Perplexity Rank Tracker: Complete Guide to Tracking Your AI Visibility",
    description: "Learn how to track and improve your visibility in Perplexity AI search. Comprehensive guide to Perplexity SEO.",
    slug: "perplexity-rank-tracker-guide",
    category: "AI Trackers",
    readTime: "12 min",
    publishDate: "January 25, 2026",
  },
  {
    title: "ChatGPT Mention Tracking: Monitor Your Brand in ChatGPT",
    description: "Complete guide to tracking what ChatGPT says about your brand. Monitor mentions, sentiment, and visibility.",
    slug: "chatgpt-mention-tracking-guide",
    category: "AI Trackers",
    readTime: "11 min",
    publishDate: "January 24, 2026",
  },
  {
    title: "Claude Rank Tracker Guide: Monitor Your Visibility in Claude AI",
    description: "Learn Claude SEO strategies, rank tracking, and optimization techniques for Anthropic's Claude.",
    slug: "claude-rank-tracker-guide",
    category: "AI Trackers",
    readTime: "10 min",
    publishDate: "January 23, 2026",
  },
  {
    title: "AI Overviews Tracking: Complete Guide to Google AI Search",
    description: "Track and optimize your visibility in Google AI Overviews and AI Mode. Comprehensive ranking guide.",
    slug: "ai-overviews-tracking-guide",
    category: "AI Trackers",
    readTime: "13 min",
    publishDate: "January 22, 2026",
  },
  {
    title: "Copilot SEO Tracking Guide: Optimize for Microsoft's AI",
    description: "Complete guide to tracking and improving visibility in Microsoft Copilot and Bing AI.",
    slug: "copilot-seo-tracking-guide",
    category: "AI Trackers",
    readTime: "10 min",
    publishDate: "January 21, 2026",
  },
  {
    title: "LLM Rank Tracking: Multi-Platform AI Visibility Guide",
    description: "Track visibility across ChatGPT, Claude, Gemini, and Perplexity. Comprehensive LLM SEO guide.",
    slug: "llm-rank-tracking-guide",
    category: "AI Trackers",
    readTime: "14 min",
    publishDate: "January 20, 2026",
  },
  {
    title: "GEO Optimization Guide: Mastering Generative Engine Optimization",
    description: "Complete guide to Generative Engine Optimization. Optimize for AI search engines and AI Overviews.",
    slug: "geo-optimization-guide",
    category: "GEO",
    readTime: "15 min",
    publishDate: "January 19, 2026",
  },
  {
    title: "AI Citation Tracking: Complete Guide to Getting Cited by AI",
    description: "Learn how to get cited by Perplexity, Google AI Overviews, and other AI platforms.",
    slug: "ai-citation-tracking-guide",
    category: "AI Trackers",
    readTime: "12 min",
    publishDate: "January 18, 2026",
  },
];

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    document.title = "AI Visibility Blog | SEO Tips & AI Search Optimization Guides";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Expert guides on AI search visibility, SEO optimization, and content strategies. Learn how to get your website mentioned by ChatGPT, Gemini, and other AI assistants."
      );
    }

    // Add Blog schema
    const blogSchema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "AI Visibility Checker Blog",
      description: "Expert guides on AI search visibility and SEO optimization",
      url: "https://domain-signal-check.lovable.app/blog",
      publisher: {
        "@type": "Organization",
        name: "AI Visibility Checker",
      },
    };

    const script = document.createElement("script");
    script.id = "blog-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(blogSchema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("blog-schema")?.remove();
      document.title = "AI Visibility Checker";
    };
  }, []);

  const filteredPosts =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((post) => post.category === activeCategory);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "Blog" }]}
            />
            <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-4 text-white">
              AI Visibility Blog
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Expert guides on AI search visibility, SEO optimization, and
              content strategies. Learn how to get your website mentioned by
              AI assistants.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-6 border-b border-gray-800 bg-black sticky top-14 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategory === category
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <BlogCard key={post.slug} {...post} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            Ready to Check Your AI Visibility?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-6">
            Use our free AI Visibility Checker to see if ChatGPT, Gemini, and
            Perplexity mention your website.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500">
              <Link to="/#scan">Check Your AI Visibility</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gray-600 text-white hover:bg-gray-800">
              <Link to="/tools">Explore All Tools</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
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
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} AI Visibility Checker. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;