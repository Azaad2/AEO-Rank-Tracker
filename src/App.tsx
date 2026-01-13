import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Tools from "./pages/Tools";
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
