import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, Users, Eye, BarChart3, Lightbulb, MessageSquare, Mail, PenLine, Code, Zap, FileText, Target, Globe, Type, AlignLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const toolCategories = [
  {
    title: "AI Visibility",
    tools: [
      { name: "AI Visibility Checker", href: "/", icon: Search, popular: true },
      { name: "Competitor Analyzer", href: "/tools/competitor-analyzer", icon: Users },
      { name: "Brand Monitor", href: "/tools/brand-monitor", icon: Eye },
      { name: "LLM Readiness Score", href: "/tools/llm-readiness", icon: BarChart3 },
    ],
  },
  {
    title: "AI Generators",
    tools: [
      { name: "AI Prompt Generator", href: "/tools/ai-prompt-generator", icon: Lightbulb, popular: true },
      { name: "AI Answer Generator", href: "/tools/ai-answer-generator", icon: MessageSquare },
      { name: "AI Email Generator", href: "/tools/ai-email-generator", icon: Mail },
      { name: "AI Blog Outline", href: "/tools/ai-blog-outline", icon: PenLine },
    ],
  },
  {
    title: "Content Tools",
    tools: [
      { name: "AI FAQ Generator", href: "/tools/ai-faq-generator", icon: MessageSquare, popular: true },
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

export const ToolsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors px-3 py-2 rounded-md",
          isOpen ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        Tools
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      <div
        className={cn(
          "absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200",
          isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
        )}
      >
        <div className="bg-popover border rounded-xl shadow-xl p-6 w-[700px]">
          <div className="grid grid-cols-4 gap-6">
            {toolCategories.map((category) => (
              <div key={category.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {category.title}
                </h3>
                <ul className="space-y-1">
                  {category.tools.map((tool) => (
                    <li key={tool.href}>
                      <Link
                        to={tool.href}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors group"
                        onClick={() => setIsOpen(false)}
                      >
                        <tool.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="truncate">{tool.name}</span>
                        {tool.popular && (
                          <span className="ml-auto text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t">
            <Link
              to="/tools"
              className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View All 16 Free Tools
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
