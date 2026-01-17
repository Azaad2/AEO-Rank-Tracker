import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Tools from "./pages/Tools";
import Blog from "./pages/Blog";
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
          {/* Blog posts */}
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
