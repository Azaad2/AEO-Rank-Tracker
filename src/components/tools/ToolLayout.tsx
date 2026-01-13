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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero with Breadcrumbs */}
      <section className="bg-gradient-to-b from-primary/5 to-background pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
