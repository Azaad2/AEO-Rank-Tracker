import { Link } from "react-router-dom";
import logo from "@/assets/logo-light.png";

const PeerPushBadge = () => (
  <a
    href="https://peerpush.com/p/ai-search-visibility-checker"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block"
  >
    <img
      src="https://peerpush.com/p/ai-search-visibility-checker/badge.png"
      alt="AI Mention You on PeerPush"
      className="h-10 w-auto"
      loading="lazy"
    />
  </a>
);

const engines = ["ChatGPT", "Gemini", "Claude", "Perplexity"];

const linkCls = "text-sm text-gray-300 hover:text-yellow-400 transition-colors";
const headCls = "font-semibold text-white mb-3 text-xs uppercase tracking-wider";

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-yellow-400/20 py-14">
      <div className="container mx-auto px-4">
        {/* Brand block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="AI Mention You" className="h-7 w-7" />
              <span className="font-bold text-white text-lg">AI Mention You</span>
            </Link>
            <p className="text-sm text-gray-300 leading-relaxed">
              Understand why ChatGPT, Gemini, Claude, and Perplexity recommend competitors instead of your brand.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {engines.map((e) => (
                <span
                  key={e}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className={headCls}>Product</h4>
            <ul className="space-y-2">
              <li><Link to="/#scan" className={linkCls}>Free Scan</Link></li>
              <li><Link to="/pricing" className={linkCls}>Pricing</Link></li>
              <li><Link to="/tools" className={linkCls}>All Tools</Link></li>
              <li><Link to="/integrations" className={linkCls}>Integrations</Link></li>
              <li><Link to="/blog" className={linkCls}>Blog</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className={headCls}>Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className={linkCls}>About Us</Link></li>
              <li><Link to="/contact" className={linkCls}>Contact</Link></li>
              <li><Link to="/affiliates" className={linkCls}>Affiliates – Earn 30%</Link></li>
              <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
              <li><Link to="/terms" className={linkCls}>Terms of Service</Link></li>
            </ul>
          </div>

          {/* Featured guides */}
          <div>
            <h4 className={headCls}>Getting Started</h4>
            <ul className="space-y-2">
              <li><Link to="/blog/ai-visibility-checker-guide" className={linkCls}>AI Visibility Guide</Link></li>
              <li><Link to="/blog/ai-visibility-tools-comparison-2026" className={linkCls}>Tool Comparison 2026</Link></li>
              <li><Link to="/blog/best-online-llm-rank-tracker" className={linkCls}>Best LLM Rank Trackers</Link></li>
              <li><Link to="/blog/what-is-answer-engine-optimization-aeo-guide" className={linkCls}>What is AEO?</Link></li>
              <li><Link to="/blog/geo-optimization-guide" className={linkCls}>GEO Optimization Guide</Link></li>
            </ul>
          </div>
        </div>

        {/* Full sitemap grid — site-wide internal links to every tool + guide */}
        <div className="border-t border-gray-800 pt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className={headCls}>AI Trackers</h4>
            <ul className="space-y-2">
              <li><Link to="/tools/llm-rank-tracker" className={linkCls}>LLM Rank Tracker</Link></li>
              <li><Link to="/tools/chatgpt-mention-tracker" className={linkCls}>ChatGPT Mention Tracker</Link></li>
              <li><Link to="/tools/claude-rank-tracker" className={linkCls}>Claude Rank Tracker</Link></li>
              <li><Link to="/tools/perplexity-rank-tracker" className={linkCls}>Perplexity Rank Tracker</Link></li>
              <li><Link to="/tools/copilot-rank-tracker" className={linkCls}>Copilot Rank Tracker</Link></li>
              <li><Link to="/tools/ai-overviews-tracker" className={linkCls}>AI Overviews Tracker</Link></li>
              <li><Link to="/tools/ai-citation-tracker" className={linkCls}>AI Citation Tracker</Link></li>
              <li><Link to="/tools/brand-monitor" className={linkCls}>Brand Monitor</Link></li>
              <li><Link to="/tools/competitor-analyzer" className={linkCls}>Competitor Analyzer</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={headCls}>AI Generators</h4>
            <ul className="space-y-2">
              <li><Link to="/tools/ai-prompt-generator" className={linkCls}>Prompt Generator</Link></li>
              <li><Link to="/tools/ai-answer-generator" className={linkCls}>Answer Generator</Link></li>
              <li><Link to="/tools/ai-faq-generator" className={linkCls}>FAQ Generator</Link></li>
              <li><Link to="/tools/ai-blog-outline" className={linkCls}>Blog Outline</Link></li>
              <li><Link to="/tools/ai-email-generator" className={linkCls}>Email Generator</Link></li>
              <li><Link to="/tools/schema-generator" className={linkCls}>Schema Generator</Link></li>
              <li><Link to="/tools/title-generator" className={linkCls}>Title Generator</Link></li>
              <li><Link to="/tools/description-generator" className={linkCls}>Description Generator</Link></li>
              <li><Link to="/tools/meta-optimizer" className={linkCls}>Meta Optimizer</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={headCls}>SEO & Analysis</h4>
            <ul className="space-y-2">
              <li><Link to="/tools/content-auditor" className={linkCls}>Content Auditor</Link></li>
              <li><Link to="/tools/keyword-analyzer" className={linkCls}>Keyword Analyzer</Link></li>
              <li><Link to="/tools/serp-previewer" className={linkCls}>SERP Previewer</Link></li>
              <li><Link to="/tools/geo-optimization-checker" className={linkCls}>GEO Checker</Link></li>
              <li><Link to="/tools/llm-readiness" className={linkCls}>LLM Readiness Score</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={headCls}>Guides & Playbooks</h4>
            <ul className="space-y-2">
              <li><Link to="/blog/ai-brand-monitoring" className={linkCls}>AI Brand Monitoring</Link></li>
              <li><Link to="/blog/how-to-check-ai-search-visibility" className={linkCls}>Check AI Search Visibility</Link></li>
              <li><Link to="/blog/how-to-track-brand-mentions-in-ai-search" className={linkCls}>Track Brand Mentions</Link></li>
              <li><Link to="/blog/how-to-improve-brand-visibility-in-ai-search-engines" className={linkCls}>Improve AI Visibility</Link></li>
              <li><Link to="/blog/chatgpt-mention-tracking-guide" className={linkCls}>ChatGPT Mention Tracking</Link></li>
              <li><Link to="/blog/claude-rank-tracker-guide" className={linkCls}>Claude Rank Tracking</Link></li>
              <li><Link to="/blog/perplexity-rank-tracker-guide" className={linkCls}>Perplexity Rank Tracking</Link></li>
              <li><Link to="/blog/ai-overviews-tracking-guide" className={linkCls}>AI Overviews Tracking</Link></li>
              <li><Link to="/blog/copilot-seo-tracking-guide" className={linkCls}>Copilot SEO Tracking</Link></li>
              <li><Link to="/blog/llm-rank-tracking-guide" className={linkCls}>LLM Rank Tracking</Link></li>
              <li><Link to="/blog/llm-readiness-optimization" className={linkCls}>LLM Readiness</Link></li>
              <li><Link to="/blog/ai-citation-tracking-guide" className={linkCls}>AI Citation Tracking</Link></li>
              <li><Link to="/blog/competitor-ai-analysis" className={linkCls}>Competitor AI Analysis</Link></li>
              <li><Link to="/blog/content-audit-ai-visibility" className={linkCls}>Content Audit for AI</Link></li>
              <li><Link to="/blog/schema-markup-generator" className={linkCls}>Schema Markup Guide</Link></li>
              <li><Link to="/blog/meta-tag-optimization" className={linkCls}>Meta Tag Optimization</Link></li>
              <li><Link to="/blog/ai-keyword-research" className={linkCls}>AI Keyword Research</Link></li>
              <li><Link to="/blog/ai-answer-optimization" className={linkCls}>AI Answer Optimization</Link></li>
              <li><Link to="/blog/ai-prompt-generator-guide" className={linkCls}>AI Prompt Generator Guide</Link></li>
              <li><Link to="/blog/ai-blog-outline-generator" className={linkCls}>AI Blog Outline Guide</Link></li>
              <li><Link to="/blog/ai-faq-generator-guide" className={linkCls}>AI FAQ Generator Guide</Link></li>
              <li><Link to="/blog/ai-email-generator-guide" className={linkCls}>AI Email Generator Guide</Link></li>
              <li><Link to="/blog/seo-title-generator" className={linkCls}>SEO Title Generator</Link></li>
              <li><Link to="/blog/meta-description-generator" className={linkCls}>Meta Description Generator</Link></li>
              <li><Link to="/blog/serp-preview-tool" className={linkCls}>SERP Preview Tool</Link></li>
              <li><Link to="/blog/50-saas-brands-ai-visibility-data" className={linkCls}>50 SaaS Brands Report</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} AI Mention You. All rights reserved.
          </p>
          <PeerPushBadge />
          <span className="text-xs text-yellow-400/80 font-medium">
            Recommendation Intelligence for AI Search
          </span>
        </div>
      </div>
    </footer>
  );
};
