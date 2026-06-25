import { Link } from "react-router-dom";
import logo from "@/assets/logo-light.png";

const engines = ["ChatGPT", "Gemini", "Claude", "Perplexity"];

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-yellow-400/20 py-14">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
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
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/#scan" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Free Scan</Link></li>
              <li><Link to="/pricing" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Pricing</Link></li>
              <li><Link to="/tools" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">All Tools</Link></li>
              <li><Link to="/integrations" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Integrations</Link></li>
              <li><Link to="/blog" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Contact</Link></li>
              <li><Link to="/affiliates" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Affiliates – Earn 30%</Link></li>
              <li><Link to="/privacy" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-3">
              <li><Link to="/blog/ai-visibility-checker-guide" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Getting Started</Link></li>
              <li><Link to="/blog/ai-visibility-tools-comparison-2026" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">Tool Comparison</Link></li>
              <li><Link to="/tools/llm-readiness-score" className="text-sm text-gray-300 hover:text-yellow-400 transition-colors">LLM Readiness Score</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} AI Mention You. All rights reserved.
          </p>
          <span className="text-xs text-yellow-400/80 font-medium">
            Recommendation Intelligence for AI Search
          </span>
        </div>
      </div>
    </footer>
  );
};
