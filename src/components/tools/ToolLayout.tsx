import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface ToolLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  metaTitle?: string;
  metaDescription?: string;
  relatedTools?: Array<{
    title: string;
    href: string;
    description: string;
  }>;
}

const ToolLayout = ({ 
  title, 
  description, 
  children, 
  metaTitle,
  metaDescription,
  relatedTools 
}: ToolLayoutProps) => {
  // Set SEO meta tags dynamically
  useEffect(() => {
    const finalTitle = metaTitle || `${title} | AI Visibility Checker`;
    const finalDescription = metaDescription || description;

    // Update document title
    document.title = finalTitle;

    // Update or create meta description
    let metaDescTag = document.querySelector('meta[name="description"]');
    if (!metaDescTag) {
      metaDescTag = document.createElement('meta');
      metaDescTag.setAttribute('name', 'description');
      document.head.appendChild(metaDescTag);
    }
    metaDescTag.setAttribute('content', finalDescription);

    // Update Open Graph tags
    const ogTags = [
      { property: 'og:title', content: finalTitle },
      { property: 'og:description', content: finalDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: window.location.href },
    ];

    ogTags.forEach(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });

    // Add JSON-LD schema
    const schemaId = 'tool-schema';
    let schemaScript = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = schemaId;
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": title,
      "description": finalDescription,
      "url": window.location.href,
      "applicationCategory": "SEO Tool",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "provider": {
        "@type": "Organization",
        "name": "AI Visibility Checker"
      }
    };
    
    schemaScript.textContent = JSON.stringify(schema);

    // Cleanup on unmount
    return () => {
      document.title = 'AI Visibility Checker';
    };
  }, [title, description, metaTitle, metaDescription]);

  // Breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
    { label: title }
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Hero with Breadcrumbs - Dark Theme */}
      <section className="bg-black pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
              {title}
            </h1>
            <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
              {description}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {children}
      </main>

      {/* Related Tools */}
      {relatedTools && relatedTools.length > 0 && (
        <section className="border-t border-gray-800 bg-gray-900/50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center text-white mb-8">Related Tools</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="p-4 rounded-lg border border-gray-700 bg-gray-900 hover:border-yellow-400/50 transition-colors"
                >
                  <h3 className="font-semibold mb-2 text-white">{tool.title}</h3>
                  <p className="text-sm text-gray-400">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer - Dark Theme with Yellow Accents */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Resources */}
            <div>
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/tools" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    All 16 Free Tools →
                  </a>
                </li>
                <li>
                  <a href="/#how-it-works" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="/#faq" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="/#use-cases" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    Use Cases
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/about" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Tools Preview */}
            <div>
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Popular Tools</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    AI Visibility Checker
                  </a>
                </li>
                <li>
                  <a href="/tools/ai-prompt-generator" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    AI Prompt Generator
                  </a>
                </li>
                <li>
                  <a href="/tools/schema-generator" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    Schema Generator
                  </a>
                </li>
                <li>
                  <a href="/tools/meta-optimizer" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    Meta Optimizer
                  </a>
                </li>
              </ul>
            </div>

            {/* Blog */}
            <div>
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Blog</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/blog" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    All Articles
                  </a>
                </li>
                <li>
                  <a href="/blog/ai-visibility-checker-guide" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    AI Visibility Guide
                  </a>
                </li>
                <li>
                  <a href="/blog/geo-optimization-guide" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                    GEO Optimization
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} AI Visibility Checker. All rights reserved.
              </p>
              <a href="mailto:hello@aimentionyou.com" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                hello@aimentionyou.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ToolLayout;
