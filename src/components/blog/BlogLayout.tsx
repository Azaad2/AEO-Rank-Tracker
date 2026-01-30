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
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 pb-8 bg-black">
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
              <span className="inline-block px-3 py-1 bg-yellow-400/20 text-yellow-400 text-sm font-medium rounded-full mb-4">
                {category}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-white">
                {title}
              </h1>
              <p className="text-lg text-gray-400 mb-6">{description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {author && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-white">{author}</span>
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
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
              {/* Article Content */}
              <article className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-400 prose-li:text-gray-400 prose-a:text-yellow-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white">
                {children}

                {/* Tool CTA */}
                {toolLink && toolName && (
                  <div className="my-12 p-6 bg-gray-900 rounded-2xl border border-gray-800">
                    <h3 className="text-xl font-bold mb-2 text-white">
                      Try Our Free {toolName}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Put these insights into action with our free tool. No signup
                      required.
                    </p>
                    <Button asChild className="bg-yellow-400 text-black hover:bg-yellow-500">
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
                    <h2 className="text-2xl font-bold mb-6 text-white">
                      Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                      {faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="p-6 bg-gray-900 rounded-lg border border-gray-800"
                        >
                          <h3 className="text-lg font-semibold mb-2 text-white">
                            {faq.question}
                          </h3>
                          <p className="text-gray-400">{faq.answer}</p>
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
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Ready to Improve Your AI Visibility?
            </h2>
            <p className="text-gray-400 mb-6">
              Use our free tools to analyze and optimize your presence in AI search
              results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Link to="/#scan">Check Your AI Visibility</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-gray-600 text-white hover:bg-gray-800">
                <Link to="/tools">Explore All Tools</Link>
              </Button>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} AI Visibility Checker. All rights reserved.</p>
            <div className="flex justify-center gap-6 mt-4">
              <Link to="/" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                Home
              </Link>
              <Link to="/blog" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                Blog
              </Link>
              <Link to="/tools" className="text-yellow-400 hover:text-yellow-300 transition-colors">
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