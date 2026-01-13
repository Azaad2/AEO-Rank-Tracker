import { Link } from "react-router-dom";
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
        title: "Competitor AI Analyzer",
        description: "Compare your AI visibility against competitors. See who gets mentioned more in AI responses.",
        href: "/tools/competitor-analyzer",
        icon: Users,
      },
      {
        title: "Brand Monitor",
        description: "Track where your brand appears in AI-generated responses and monitor sentiment.",
        href: "/tools/brand-monitor",
        icon: Eye,
      },
      {
        title: "LLM Readiness Score",
        description: "Get a score on how AI-friendly your website is. Check schema markup, content structure, and more.",
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
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Free AI Visibility Tools
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Everything you need to optimize your website for AI search engines. 
            Get discovered by ChatGPT, Gemini, Perplexity, and more.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              16 Free Tools
            </span>
            <span className="text-border">•</span>
            <span>No signup required</span>
            <span className="text-border">•</span>
            <span>100% Free</span>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <main className="container mx-auto px-4 py-12 md:py-16">
        {tools.map((category) => (
          <div key={category.category} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
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
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Start with the AI Visibility Checker
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our flagship tool analyzes how AI assistants see your website. 
            Get actionable insights to improve your AI search visibility.
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Search className="h-5 w-5" />
              Check Your AI Visibility
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AI Visibility Checker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Tools;
