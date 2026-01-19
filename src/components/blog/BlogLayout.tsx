import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "./ShareButtons";
import { AuthorBox } from "./AuthorBox";
import { TableOfContents } from "./TableOfContents";
import { RelatedPosts } from "./RelatedPosts";

interface BlogLayoutProps {
  title: string;
  description: string;
  publishDate: string;
  readTime: string;
  category: string;
  toolLink?: string;
  toolName?: string;
  children: React.ReactNode;
  faqs?: { question: string; answer: string }[];
  relatedPosts?: { title: string; slug: string; category: string }[];
  author?: string;
}

export const BlogLayout = ({
  title,
  description,
  publishDate,
  readTime,
  category,
  toolLink,
  toolName,
  children,
  faqs = [],
  relatedPosts = [],
  author,
}: BlogLayoutProps) => {
  useEffect(() => {
    // Update document title
    document.title = `${title} | AI Visibility Checker Blog`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    // Add JSON-LD Article schema
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: description,
      datePublished: publishDate,
      dateModified: publishDate,
      author: author
        ? {
            "@type": "Person",
            name: author,
          }
        : {
            "@type": "Organization",
            name: "AI Visibility Checker",
            url: "https://domain-signal-check.lovable.app",
          },
      publisher: {
        "@type": "Organization",
        name: "AI Visibility Checker",
        logo: {
          "@type": "ImageObject",
          url: "https://domain-signal-check.lovable.app/favicon.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": window.location.href,
      },
    };

    // Add FAQPage schema if FAQs exist
    const faqSchema =
      faqs.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }
        : null;

    // Create script tags
    const articleScriptId = "blog-article-schema";
    const faqScriptId = "blog-faq-schema";

    // Remove existing schemas
    document.getElementById(articleScriptId)?.remove();
    document.getElementById(faqScriptId)?.remove();

    // Add article schema
    const articleScript = document.createElement("script");
    articleScript.id = articleScriptId;
    articleScript.type = "application/ld+json";
    articleScript.textContent = JSON.stringify(articleSchema);
    document.head.appendChild(articleScript);

    // Add FAQ schema if exists
    if (faqSchema) {
      const faqScript = document.createElement("script");
      faqScript.id = faqScriptId;
      faqScript.type = "application/ld+json";
      faqScript.textContent = JSON.stringify(faqSchema);
      document.head.appendChild(faqScript);
    }

    return () => {
      document.getElementById(articleScriptId)?.remove();
      document.getElementById(faqScriptId)?.remove();
      document.title = "AI Visibility Checker";
    };
  }, [title, description, publishDate, faqs, author]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-8 bg-gradient-to-b from-slate-50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Blog", href: "/blog" },
                { label: title },
              ]}
            />
            <div className="mt-6">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                {category}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {title}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">{description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {author && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{author}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{publishDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{readTime} read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
              {/* Article Content */}
              <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                {children}

                {/* Tool CTA */}
                {toolLink && toolName && (
                  <div className="my-12 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                    <h3 className="text-xl font-bold mb-2 text-foreground">
                      Try Our Free {toolName}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Put these insights into action with our free tool. No signup
                      required.
                    </p>
                    <Button asChild>
                      <Link to={toolLink}>
                        Try {toolName} Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}

                {/* FAQ Section */}
                {faqs.length > 0 && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6 text-foreground">
                      Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                      {faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="p-6 bg-slate-50 rounded-lg border"
                        >
                          <h3 className="text-lg font-semibold mb-2 text-foreground">
                            {faq.question}
                          </h3>
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Author Box */}
                <AuthorBox />

                {/* Share Buttons */}
                <ShareButtons title={title} />
              </article>

              {/* Sidebar */}
              <aside className="hidden lg:block space-y-8">
                <TableOfContents />
                {relatedPosts.length > 0 && (
                  <RelatedPosts posts={relatedPosts} />
                )}
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Improve Your AI Visibility?
            </h2>
            <p className="text-muted-foreground mb-6">
              Use our free tools to analyze and optimize your presence in AI search
              results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/#scan">Check Your AI Visibility</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/tools">Explore All Tools</Link>
              </Button>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} AI Visibility Checker. All rights reserved.</p>
            <div className="flex justify-center gap-6 mt-4">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link to="/tools" className="hover:text-foreground transition-colors">
                Tools
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogLayout;
