import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  relatedTools?: Array<{
    title: string;
    href: string;
    description: string;
  }>;
}

const ToolLayout = ({ title, description, children, relatedTools }: ToolLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">AI Visibility Checker</span>
            </Link>
            <Link to="/tools">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Tools
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {children}
      </main>

      {/* Related Tools */}
      {relatedTools && relatedTools.length > 0 && (
        <section className="border-t bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Related Tools</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                >
                  <h3 className="font-semibold mb-2">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} AI Visibility Checker. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/tools" className="hover:text-foreground transition-colors">All Tools</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ToolLayout;
