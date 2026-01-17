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
];

const blogPosts = [
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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-12 bg-gradient-to-b from-slate-50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Breadcrumbs
              items={[{ label: "Home", href: "/" }, { label: "Blog" }]}
            />
            <h1 className="text-4xl md:text-5xl font-bold mt-6 mb-4">
              AI Visibility Blog
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expert guides on AI search visibility, SEO optimization, and
              content strategies. Learn how to get your website mentioned by
              AI assistants.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-6 border-b bg-background sticky top-14 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <BlogCard key={post.slug} {...post} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Check Your AI Visibility?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Use our free AI Visibility Checker to see if ChatGPT, Gemini, and
            Perplexity mention your website.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/#scan">Check Your AI Visibility</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/tools">Explore All Tools</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Visibility Checker. All rights
            reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              to="/blog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/tools"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Tools
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;
