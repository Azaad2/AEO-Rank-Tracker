import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Tools from "./pages/Tools";
import Blog from "./pages/Blog";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AIPromptGenerator from "./pages/tools/AIPromptGenerator";
import AIFAQGenerator from "./pages/tools/AIFAQGenerator";
import AIAnswerGenerator from "./pages/tools/AIAnswerGenerator";
import AIEmailGenerator from "./pages/tools/AIEmailGenerator";
import AIBlogOutline from "./pages/tools/AIBlogOutline";
import SchemaGenerator from "./pages/tools/SchemaGenerator";
import MetaOptimizer from "./pages/tools/MetaOptimizer";
import ContentAuditor from "./pages/tools/ContentAuditor";
import KeywordAnalyzer from "./pages/tools/KeywordAnalyzer";
import SERPPreviewer from "./pages/tools/SERPPreviewer";
import TitleGenerator from "./pages/tools/TitleGenerator";
import DescriptionGenerator from "./pages/tools/DescriptionGenerator";
import CompetitorAnalyzer from "./pages/tools/CompetitorAnalyzer";
import BrandMonitor from "./pages/tools/BrandMonitor";
import LLMReadinessScore from "./pages/tools/LLMReadinessScore";
import PerplexityRankTracker from "./pages/tools/PerplexityRankTracker";
import ChatGPTMentionTracker from "./pages/tools/ChatGPTMentionTracker";
import ClaudeRankTracker from "./pages/tools/ClaudeRankTracker";
import AIOverviewsTracker from "./pages/tools/AIOverviewsTracker";
import CopilotRankTracker from "./pages/tools/CopilotRankTracker";
import LLMRankTracker from "./pages/tools/LLMRankTracker";
import GEOOptimizationChecker from "./pages/tools/GEOOptimizationChecker";
import AICitationTracker from "./pages/tools/AICitationTracker";
import NotFound from "./pages/NotFound";
// Blog posts
import AIVisibilityCheckerGuide from "./pages/blog/AIVisibilityCheckerGuide";
import CompetitorAIAnalysis from "./pages/blog/CompetitorAIAnalysis";
import AIBrandMonitoring from "./pages/blog/AIBrandMonitoring";
import LLMReadinessOptimization from "./pages/blog/LLMReadinessOptimization";
import AIPromptGeneratorGuide from "./pages/blog/AIPromptGeneratorGuide";
import AIAnswerOptimization from "./pages/blog/AIAnswerOptimization";
import AIEmailGeneratorGuide from "./pages/blog/AIEmailGeneratorGuide";
import AIBlogOutlineGenerator from "./pages/blog/AIBlogOutlineGenerator";
import AIFAQGeneratorGuide from "./pages/blog/AIFAQGeneratorGuide";
import SchemaMarkupGenerator from "./pages/blog/SchemaMarkupGenerator";
import MetaTagOptimization from "./pages/blog/MetaTagOptimization";
import ContentAuditAIVisibility from "./pages/blog/ContentAuditAIVisibility";
import AIKeywordResearch from "./pages/blog/AIKeywordResearch";
import SERPPreviewTool from "./pages/blog/SERPPreviewTool";
import SEOTitleGenerator from "./pages/blog/SEOTitleGenerator";
import MetaDescriptionGenerator from "./pages/blog/MetaDescriptionGenerator";
import AIVisibilityToolsComparison from "./pages/blog/AIVisibilityToolsComparison";
import PerplexityRankTrackerGuide from "./pages/blog/PerplexityRankTrackerGuide";
import ChatGPTMentionTrackingGuide from "./pages/blog/ChatGPTMentionTrackingGuide";
import ClaudeRankTrackerGuide from "./pages/blog/ClaudeRankTrackerGuide";
import AIOverviewsTrackingGuide from "./pages/blog/AIOverviewsTrackingGuide";
import CopilotSEOTrackingGuide from "./pages/blog/CopilotSEOTrackingGuide";
import LLMRankTrackingGuide from "./pages/blog/LLMRankTrackingGuide";
import GEOOptimizationGuide from "./pages/blog/GEOOptimizationGuide";
import AICitationTrackingGuide from "./pages/blog/AICitationTrackingGuide";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/blog" element={<Blog />} />
          {/* Company pages */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* Blog posts */}
          <Route path="/blog/ai-visibility-tools-comparison-2026" element={<AIVisibilityToolsComparison />} />
          <Route path="/blog/ai-visibility-checker-guide" element={<AIVisibilityCheckerGuide />} />
          <Route path="/blog/competitor-ai-analysis" element={<CompetitorAIAnalysis />} />
          <Route path="/blog/ai-brand-monitoring" element={<AIBrandMonitoring />} />
          <Route path="/blog/llm-readiness-optimization" element={<LLMReadinessOptimization />} />
          <Route path="/blog/ai-prompt-generator-guide" element={<AIPromptGeneratorGuide />} />
          <Route path="/blog/ai-answer-optimization" element={<AIAnswerOptimization />} />
          <Route path="/blog/ai-email-generator-guide" element={<AIEmailGeneratorGuide />} />
          <Route path="/blog/ai-blog-outline-generator" element={<AIBlogOutlineGenerator />} />
          <Route path="/blog/ai-faq-generator-guide" element={<AIFAQGeneratorGuide />} />
          <Route path="/blog/schema-markup-generator" element={<SchemaMarkupGenerator />} />
          <Route path="/blog/meta-tag-optimization" element={<MetaTagOptimization />} />
          <Route path="/blog/content-audit-ai-visibility" element={<ContentAuditAIVisibility />} />
          <Route path="/blog/ai-keyword-research" element={<AIKeywordResearch />} />
          <Route path="/blog/serp-preview-tool" element={<SERPPreviewTool />} />
          <Route path="/blog/seo-title-generator" element={<SEOTitleGenerator />} />
          <Route path="/blog/meta-description-generator" element={<MetaDescriptionGenerator />} />
          {/* Tools */}
          <Route path="/tools/ai-prompt-generator" element={<AIPromptGenerator />} />
          <Route path="/tools/ai-faq-generator" element={<AIFAQGenerator />} />
          <Route path="/tools/ai-answer-generator" element={<AIAnswerGenerator />} />
          <Route path="/tools/ai-email-generator" element={<AIEmailGenerator />} />
          <Route path="/tools/ai-blog-outline" element={<AIBlogOutline />} />
          <Route path="/tools/schema-generator" element={<SchemaGenerator />} />
          <Route path="/tools/meta-optimizer" element={<MetaOptimizer />} />
          <Route path="/tools/content-auditor" element={<ContentAuditor />} />
          <Route path="/tools/keyword-analyzer" element={<KeywordAnalyzer />} />
          <Route path="/tools/serp-previewer" element={<SERPPreviewer />} />
          <Route path="/tools/title-generator" element={<TitleGenerator />} />
          <Route path="/tools/description-generator" element={<DescriptionGenerator />} />
          <Route path="/tools/competitor-analyzer" element={<CompetitorAnalyzer />} />
          <Route path="/tools/brand-monitor" element={<BrandMonitor />} />
          <Route path="/tools/llm-readiness-score" element={<LLMReadinessScore />} />
          <Route path="/tools/perplexity-rank-tracker" element={<PerplexityRankTracker />} />
          <Route path="/tools/chatgpt-mention-tracker" element={<ChatGPTMentionTracker />} />
          <Route path="/tools/claude-rank-tracker" element={<ClaudeRankTracker />} />
          <Route path="/tools/ai-overviews-tracker" element={<AIOverviewsTracker />} />
          <Route path="/tools/copilot-rank-tracker" element={<CopilotRankTracker />} />
          <Route path="/tools/llm-rank-tracker" element={<LLMRankTracker />} />
          <Route path="/tools/geo-optimization-checker" element={<GEOOptimizationChecker />} />
          <Route path="/tools/ai-citation-tracker" element={<AICitationTracker />} />
          {/* New blog posts */}
          <Route path="/blog/perplexity-rank-tracker-guide" element={<PerplexityRankTrackerGuide />} />
          <Route path="/blog/chatgpt-mention-tracking-guide" element={<ChatGPTMentionTrackingGuide />} />
          <Route path="/blog/claude-rank-tracker-guide" element={<ClaudeRankTrackerGuide />} />
          <Route path="/blog/ai-overviews-tracking-guide" element={<AIOverviewsTrackingGuide />} />
          <Route path="/blog/copilot-seo-tracking-guide" element={<CopilotSEOTrackingGuide />} />
          <Route path="/blog/llm-rank-tracking-guide" element={<LLMRankTrackingGuide />} />
          <Route path="/blog/geo-optimization-guide" element={<GEOOptimizationGuide />} />
          <Route path="/blog/ai-citation-tracking-guide" element={<AICitationTrackingGuide />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
