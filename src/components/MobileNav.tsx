import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, Users, Eye, BarChart3, Lightbulb, MessageSquare, Mail, PenLine, Code, Zap, FileText, Target, Globe, Type, AlignLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";
import logo from "@/assets/logo-light.png";

const toolCategories = [
  {
    title: "AI Visibility",
    tools: [
      { name: "AI Visibility Checker", href: "/", icon: Search },
      { name: "Competitor Analyzer", href: "/tools/competitor-analyzer", icon: Users },
      { name: "Brand Monitor", href: "/tools/brand-monitor", icon: Eye },
      { name: "LLM Readiness Score", href: "/tools/llm-readiness", icon: BarChart3 },
    ],
  },
  {
    title: "AI Generators",
    tools: [
      { name: "AI Prompt Generator", href: "/tools/ai-prompt-generator", icon: Lightbulb },
      { name: "AI Answer Generator", href: "/tools/ai-answer-generator", icon: MessageSquare },
      { name: "AI Email Generator", href: "/tools/ai-email-generator", icon: Mail },
      { name: "AI Blog Outline", href: "/tools/ai-blog-outline", icon: PenLine },
    ],
  },
  {
    title: "Content Tools",
    tools: [
      { name: "AI FAQ Generator", href: "/tools/ai-faq-generator", icon: MessageSquare },
      { name: "Schema Generator", href: "/tools/schema-generator", icon: Code },
      { name: "Meta Optimizer", href: "/tools/meta-optimizer", icon: Zap },
      { name: "Content Auditor", href: "/tools/content-auditor", icon: FileText },
    ],
  },
  {
    title: "SEO Tools",
    tools: [
      { name: "Keyword Analyzer", href: "/tools/keyword-analyzer", icon: Target },
      { name: "SERP Previewer", href: "/tools/serp-previewer", icon: Globe },
      { name: "Title Generator", href: "/tools/title-generator", icon: Type },
      { name: "Description Generator", href: "/tools/description-generator", icon: AlignLeft },
    ],
  },
];

export const MobileNav = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("AI Visibility");

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="AI Visibility Checker" className="h-8 w-8" />
          <span className="font-bold">AI Visibility Checker</span>
        </Link>
        <SheetClose asChild>
          <button className="p-2 hover:bg-muted rounded-md">
            <X className="h-5 w-5" />
          </button>
        </SheetClose>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Quick Links */}
        <div className="px-4 mb-4">
          <SheetClose asChild>
            <a
              href="/#scan"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium"
            >
              <Search className="h-5 w-5" />
              Free AI Visibility Scan
            </a>
          </SheetClose>
        </div>

        {/* Tool Categories */}
        <div className="px-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
            Tools
          </p>
          {toolCategories.map((category) => (
            <div key={category.title} className="border rounded-lg overflow-hidden">
              <button
                className="flex items-center justify-between w-full px-4 py-3 text-left font-medium hover:bg-muted transition-colors"
                onClick={() => setExpandedCategory(
                  expandedCategory === category.title ? null : category.title
                )}
              >
                {category.title}
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expandedCategory === category.title && "rotate-180"
                  )} 
                />
              </button>
              
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  expandedCategory === category.title ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="bg-muted/50 py-2">
                  {category.tools.map((tool) => (
                    <SheetClose asChild key={tool.href}>
                      <Link
                        to={tool.href}
                        className="flex items-center gap-3 px-6 py-2.5 hover:bg-muted transition-colors"
                      >
                        <tool.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{tool.name}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="px-4 mt-6">
          <SheetClose asChild>
            <Link
              to="/tools"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
            >
              View All 16 Free Tools
            </Link>
          </SheetClose>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AI Visibility Checker
      </div>
    </div>
  );
};
