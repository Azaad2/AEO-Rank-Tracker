import { Link } from "react-router-dom";
import logo from "@/assets/logo-light.png";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="AI Mention You" className="h-6 w-6" />
              <span className="font-semibold text-foreground">AI Mention You</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Track how AI assistants mention your brand across ChatGPT, Gemini, and Perplexity.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/#scan" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Free Scan
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  All Tools
                </Link>
              </li>
              <li>
                <Link to="/integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/blog/ai-visibility-checker-guide" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link to="/blog/ai-visibility-tools-comparison-2026" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Tool Comparison
                </Link>
              </li>
              <li>
                <Link to="/tools/llm-readiness-score" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  LLM Readiness Score
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Mention You. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Powered by advanced AI analysis
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
