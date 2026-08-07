import { useEffect } from "react";
import BlogLayout from "@/components/blog/BlogLayout";
import { Link } from "react-router-dom";

const CANONICAL = "https://aimentionyou.com/blog/content-audit-ai-visibility";

const Takeaway = ({ children }: { children: React.ReactNode }) => (
  <div className="my-6 rounded-lg border-l-4 border-yellow-400 bg-gray-900/50 p-4">
    <p className="m-0 text-sm font-semibold uppercase tracking-wide text-yellow-400">
      Key takeaway
    </p>
    <div className="mt-2 [&>p]:m-0 text-gray-300">{children}</div>
  </div>
);

const Definition = ({ term, children }: { term: string; children: React.ReactNode }) => (
  <div className="my-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
    <p className="m-0 text-sm font-semibold text-gray-100">{term}</p>
    <div className="mt-2 [&>p]:m-0 text-gray-300">{children}</div>
  </div>
);

const Table = ({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: string[][];
  caption?: string;
}) => (
  <div className="my-6 overflow-x-auto">
    <table className="w-full border-collapse text-left text-sm">
      {caption && (
        <caption className="mb-2 text-left text-sm text-gray-400">{caption}</caption>
      )}
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} className="border-b border-gray-800 py-2 pr-4 font-semibold text-gray-100">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, i) => (
              <td key={i} className="border-b border-gray-800/60 py-2 pr-4 align-top text-gray-300">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const faqs = [
  {
    question: "What is a content audit for AI visibility?",
    answer:
      "It's a systematic review of your existing pages to identify why AI assistants like ChatGPT, Gemini, Claude and Perplexity may not be citing or recommending your content — looking at structure, factual accuracy, schema markup, crawler access, and third-party corroboration rather than just traditional on-page SEO factors like keyword density.",
  },
  {
    question: "How is this different from a traditional SEO content audit?",
    answer:
      "A traditional SEO audit focuses on rankings, backlinks, keyword targeting and technical crawlability for search engines. An AI-visibility audit adds a layer on top: whether AI crawlers can actually access your pages, whether your content is structured so a model can extract a clean answer, whether your entity facts are consistent everywhere, and whether third-party sources corroborate the claims on the page. Many pages that rank well in Google still get skipped by AI assistants because they lack that extractable structure.",
  },
  {
    question: "How often should I audit content for AI visibility?",
    answer:
      "Quarterly is a reasonable default for most businesses. If you're actively working on AI visibility, in a fast-moving category, or have just launched a new product, a monthly review of your highest-priority pages is worth the time, because model behavior and competitive answers can shift faster than a quarterly cycle catches.",
  },
  {
    question: "What content issues hurt AI visibility the most?",
    answer:
      "In rough order of impact: pages that are too thin or vague to produce a confident answer, inconsistent facts about your business across different pages or platforms, missing or incorrect schema markup, robots.txt rules that block AI crawlers, and a total absence of third-party mentions that could corroborate your own claims.",
  },
  {
    question: "Do I need to audit every page on my site?",
    answer:
      "No. Start with the pages most likely to be relevant to buying-decision prompts: comparison pages, pricing pages, product/service pages, and your top 10-20 blog posts by traffic or topical relevance. A full-site audit is worth doing eventually, but prioritizing by likely impact gets you results faster.",
  },
  {
    question: "Can a page rank well in Google but still be invisible to AI assistants?",
    answer:
      "Yes, and this is common. Google's ranking algorithm rewards a different set of signals than a language model synthesizing an answer. A page can rank #3 for a keyword because of strong backlinks and domain authority, yet never get cited by an AI assistant because it buries its actual answer under paragraphs of preamble the model has no reason to quote.",
  },
  {
    question: "What does 'extractable structure' actually mean in practice?",
    answer:
      "It means a reader — or a model — can find the direct answer to a specific question within a self-contained passage, typically a paragraph or two, without needing to read the rest of the page for context. A page that opens with three paragraphs of scene-setting before answering the question is not extractable; a page that leads with a definition or direct answer, then elaborates, is.",
  },
  {
    question: "How do I check if AI crawlers can access my pages?",
    answer:
      "Check your robots.txt file for disallow rules targeting GPTBot, ClaudeBot, PerplexityBot, Google-Extended, or similar user agents. Cloudflare's 2024 research on AI crawler traffic found a meaningful share of sites block at least one of these crawlers, often as a side effect of a generic bot-blocking rule rather than a deliberate choice, so it's worth checking even if you never intentionally set it up.",
  },
  {
    question: "Does adding schema markup fix AI visibility problems by itself?",
    answer:
      "No. Schema markup — Organization, Article, FAQPage, Product, BreadcrumbList — reduces ambiguity about what your content is and who you are, which helps machines parse it correctly. But Google's own structured data documentation is explicit that schema is an eligibility signal, not a ranking or citation guarantee. It won't compensate for thin, vague, or inconsistent content.",
  },
  {
    question: "What counts as 'thin content' in an AI-visibility audit?",
    answer:
      "A page is thin for AI-visibility purposes if it can't produce a specific, confident answer to the question the page is meant to address — even if the word count looks substantial. A 1,500-word page that talks around a topic without committing to specifics (pricing, use cases, direct comparisons) is thinner, in the ways that matter here, than a tight 400-word page that answers one question precisely.",
  },
  {
    question: "How do I check factual consistency across my site?",
    answer:
      "Pull every place your company's name, pricing, founding date, headquarters, and core value proposition appear — your homepage, about page, footer, LinkedIn, Crunchbase, G2, and any directory listings — and compare them side by side. Inconsistencies (old pricing on a directory, a different founding year on LinkedIn) create ambiguity that models resolve by hedging or guessing, which usually works against you.",
  },
  {
    question: "Should I prioritize new content or fixing old content?",
    answer:
      "Fix old content first, in most cases. Your existing high-traffic and high-relevance pages already have some authority and indexing history; restructuring them for extractability is usually faster and higher-leverage than starting from zero on a new page. Reserve new content creation for genuine gaps the audit surfaces — questions you don't currently answer anywhere on the site.",
  },
  {
    question: "How do I know if the audit actually improved AI visibility?",
    answer:
      "Freeze a set of representative prompts before you start making changes, and record which brands are mentioned and how your own brand is described. Re-run the same prompts against ChatGPT, Gemini, Claude and Perplexity a few weeks after your fixes go live and after a recrawl has had time to happen. A tool like the AI Mention You dashboard automates this comparison so you're not manually re-testing prompts by hand.",
  },
  {
    question: "What role do third-party mentions play in a content audit?",
    answer:
      "A large one, and it's often the most overlooked. AI assistants weight corroboration heavily — a claim about your product is more trustworthy to a model if it's echoed by a review site, industry publication, or comparison article than if it only appears on your own domain. Part of a thorough audit is checking whether your category's trusted third-party sources mention you at all, and if not, treating that as a priority gap alongside on-page fixes.",
  },
  {
    question: "How long does it take to see results after fixing audit findings?",
    answer:
      "On-page structural fixes and schema changes are usually reflected once your pages are recrawled, which can take anywhere from a few days to a few weeks depending on your site's crawl frequency. Improvements driven by new third-party corroboration or added authority typically take longer — weeks to a couple of months — because they depend on other sites publishing and getting indexed, not just your own recrawl cycle.",
  },
];

const relatedPosts = [
  { title: "LLM Readiness Optimization", slug: "llm-readiness-optimization", category: "AI Visibility" },
  { title: "AI Visibility Checker Guide", slug: "ai-visibility-checker-guide", category: "AI Visibility" },
  { title: "Schema Markup Generator", slug: "schema-markup-generator", category: "SEO Tools" },
  { title: "How to Check AI Search Visibility", slug: "how-to-check-ai-search-visibility", category: "AI Visibility" },
  { title: "AI Keyword Research", slug: "ai-keyword-research", category: "SEO Tools" },
];

const ContentAuditAIVisibility = () => {
  useEffect(() => {
    const id = "content-audit-ai-visibility-extra-schema";
    document.getElementById(id)?.remove();

    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": CANONICAL,
          url: CANONICAL,
          name: "Content Audit for AI Visibility: A Practical Framework for Auditing Existing Pages",
          description:
            "A step-by-step framework for auditing your existing content to find and fix the reasons AI assistants aren't citing or recommending your brand.",
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "AI Mention You", url: "https://aimentionyou.com" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://aimentionyou.com/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "https://aimentionyou.com/blog" },
            {
              "@type": "ListItem",
              position: 3,
              name: "Content Audit for AI Visibility",
              item: CANONICAL,
            },
          ],
        },
        {
          "@type": "HowTo",
          name: "How to run a content audit for AI visibility",
          description:
            "A five-step process for auditing existing content, scoring it against AI-visibility criteria, and prioritizing fixes by impact.",
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Inventory and prioritize your pages",
              text: "List your highest-traffic and highest-relevance pages: comparisons, pricing, product pages and top blog posts, and start there rather than the whole site.",
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Check crawler access",
              text: "Review robots.txt for rules blocking GPTBot, ClaudeBot, PerplexityBot or Google-Extended that would prevent AI systems from retrieving the page.",
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Score structure and extractability",
              text: "Evaluate whether each page opens with a direct, self-contained answer to its core question rather than burying it in preamble.",
            },
            {
              "@type": "HowToStep",
              position: 4,
              name: "Check factual consistency and schema",
              text: "Compare entity facts (name, pricing, founding details) across your site and third-party listings, and verify Organization, Article, FAQPage and Product schema are present and accurate.",
            },
            {
              "@type": "HowToStep",
              position: 5,
              name: "Fix, re-test and track",
              text: "Prioritize fixes by traffic and relevance, then re-run a fixed prompt set against AI assistants after changes go live to measure impact.",
            },
          ],
        },
      ],
    };

    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(graph);
    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return (
    <BlogLayout
      title="Content Audit for AI Visibility: A Practical Framework for Auditing Existing Pages"
      description="How to audit your existing content for AI search visibility — crawler access, structure, factual consistency, schema and third-party corroboration — with a prioritized action plan."
      publishDate="January 4, 2025"
      readTime="18 min"
      category="Content Tools"
      toolLink="/tools/content-auditor"
      toolName="Content Auditor"
      author="Azaad Pandey"
      faqs={faqs}
      relatedPosts={relatedPosts}
    >
      <p>
        Most companies don't have a content problem in the sense of "not enough words on the
        internet." They have hundreds, sometimes thousands, of existing pages — product pages,
        blog posts, help docs, landing pages — and most of that content was written for a search
        engine's ranking algorithm, not for a language model trying to decide whether to name your
        brand in an answer.
      </p>

      <p>
        That's the gap a content audit for AI visibility is meant to close. You're not starting
        from zero. You're going through what you already have, page by page, and asking a
        different set of questions than a traditional SEO audit would: can an AI crawler even
        reach this page, does it contain a clean answer a model could quote, and is the information
        on it consistent with what's said about your business everywhere else on the web.
      </p>

      <p>
        This matters because rewriting or publishing from scratch is expensive, and in most cases
        unnecessary. If you've already earned rankings, backlinks and some domain authority on a
        page, restructuring it is usually a faster path to AI visibility than starting a brand new
        page competing from zero.
      </p>

      <Takeaway>
        <p>
          An AI-visibility content audit isn't a rewrite of your SEO audit with a new name on it.
          It adds four dimensions traditional SEO doesn't check for: AI crawler access, extractable
          answer structure, cross-platform factual consistency, and third-party corroboration.
        </p>
      </Takeaway>

      <h2 id="what-is-audit">What is a content audit for AI visibility?</h2>

      <Definition term="Content audit for AI visibility">
        <p>
          A systematic review of existing pages to identify why they may not be retrieved, quoted
          or recommended by AI assistants — assessing crawler accessibility, answer structure,
          factual accuracy and consistency, schema markup, and the presence of corroborating
          third-party sources, then prioritizing fixes by likely impact on visibility.
        </p>
      </Definition>

      <p>
        It's worth being precise about what this audit is not. It's not a keyword-density check,
        and it's not primarily about word count. A page can be 3,000 words and still fail every
        criterion that matters here if it never commits to a specific, confident claim a model
        could safely repeat. Conversely, a tight 500-word page with a clear definition, a
        comparison table and consistent facts can outperform a much longer page that hedges
        everything.
      </p>

      <h2 id="why-old-content">Why start with existing content instead of writing new pages?</h2>

      <p>
        New content has to earn everything from zero: crawl priority, backlinks, topical authority,
        and time in the index before a model's retrieval systems treat it as a reliable source.
        Existing content that already ranks reasonably well, gets some traffic, or has accumulated
        a few backlinks has a head start on all of that. If the reason it's not being cited by AI
        assistants is structural — buried answers, missing schema, inconsistent facts — those are
        fixable in days, not months.
      </p>

      <p>
        This doesn't mean you'll never need new content. The audit will surface real gaps: questions
        your buyers ask that you don't answer anywhere on the site. But treating "we need more
        content" as the default response before auditing what you have is usually a mistake that
        costs time and doesn't fix the underlying structural issues.
      </p>

      <h2 id="framework">The five-part audit framework</h2>

      <h3>1. Crawler access</h3>
      <p>
        Before anything else, confirm AI crawlers can actually reach your pages. Check robots.txt
        for disallow rules on GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and similar
        user agents. Cloudflare's public research on AI crawler traffic has documented that a
        meaningful share of sites block at least one of these, frequently without intending to —
        often a legacy bot-blocking rule written years before these crawlers existed gets applied
        broadly by accident. It's also worth remembering that blocking Google-Extended specifically
        affects Gemini and Vertex AI grounding, not Google's core Search index or AI Overviews,
        which Google's own documentation clarifies runs on standard Googlebot access.
      </p>

      <h3>2. Structure and extractability</h3>
      <p>
        For each priority page, ask: if someone asked an AI assistant the question this page is
        meant to answer, could the model lift a clean, accurate paragraph out of this page and use
        it? Pages fail this test in predictable ways — burying the answer under three paragraphs of
        introduction, never actually stating a specific number or fact, or spreading the answer
        across so many qualifiers that there's no clean sentence to extract. The fix is usually
        structural: move the direct answer to the first paragraph, add a definition block or
        comparison table, and make each H2 section self-contained enough to be read on its own.
      </p>

      <h3>3. Factual consistency</h3>
      <p>
        Pull every place your company's core facts appear: pricing on your website versus pricing
        listed on G2 or Capterra, founding date on your about page versus LinkedIn, your value
        proposition on your homepage versus how a partner site describes you. Inconsistencies are
        common after a pricing change, a rebrand, or simply because nobody's updated a directory
        listing in two years — and they create ambiguity that a model has to resolve somehow,
        usually by hedging its description of you or, worse, repeating outdated information
        confidently.
      </p>

      <h3>4. Schema markup</h3>
      <p>
        Check whether Organization, Article, Product, FAQPage and BreadcrumbList schema are present
        and accurate on the relevant pages, and whether the schema actually matches the visible
        content — mismatched schema (an FAQPage schema listing different questions than what's on
        the page) is a common and avoidable error. Our{" "}
        <Link to="/blog/schema-markup-generator" className="text-yellow-400 underline">
          schema markup generator guide
        </Link>{" "}
        covers implementation in more depth if this is a gap for you. Remember that schema reduces
        ambiguity; it doesn't substitute for genuinely answering the question.
      </p>

      <h3>5. Third-party corroboration</h3>
      <p>
        Search for your brand name alongside your core category terms and see what comes up beyond
        your own domain. If there's little to nothing — no reviews, no comparison articles, no
        mentions in roundups your competitors appear in — that's a real gap, and often a bigger
        lever than any on-page fix, because AI systems weight independent corroboration heavily
        when deciding whether a claim about your business is trustworthy enough to repeat.
      </p>

      <Table
        headers={["Audit dimension", "What to check", "Typical fix"]}
        rows={[
          ["Crawler access", "robots.txt rules for GPTBot, ClaudeBot, PerplexityBot, Google-Extended", "Remove unintended disallow rules"],
          ["Structure", "Does the page open with a direct answer to its core question?", "Move the answer up, add definition blocks/tables"],
          ["Factual consistency", "Pricing, founding date, positioning across all platforms", "Update outdated directory and profile listings"],
          ["Schema markup", "Organization, Article, FAQPage, Product schema present and accurate", "Add or correct schema to match visible content"],
          ["Third-party corroboration", "Reviews, comparison articles, roundups mentioning your brand", "Pursue listings and coverage on sources your category already trusts"],
        ]}
      />

      <h2 id="scoring">Scoring and prioritizing what you find</h2>

      <p>
        A simple scoring approach works better than an elaborate one here. For each page, score the
        five dimensions above on a rough scale (fail / partial / pass), then prioritize fixes by
        multiplying urgency by expected traffic or relevance: a comparison page that gets meaningful
        traffic and fails three of five checks is a higher priority than an old blog post that gets
        almost no traffic and fails one.
      </p>

      <p>
        Start with the pages most likely to intersect with buying-decision prompts — pricing pages,
        comparison pages, core product or service pages, and your highest-traffic blog content.
        These are the pages where AI-driven discovery is most likely to translate into a real
        business outcome, and where fixing structural issues pays off fastest.
      </p>

      <h2 id="common-issues">The issues that show up most often</h2>

      <p>
        In practice, a handful of problems account for most of what an audit like this turns up.
        Thin, vague content is the most common — pages that talk around a topic for a thousand
        words without ever stating a specific, quotable fact. Outdated information is close
        behind, especially pricing pages and comparison pages that haven't been updated since a
        competitor changed their offering. Missing or mismatched schema is common on sites that
        added structured data once, years ago, and never revisited it as content changed. And a
        near-total absence of third-party mentions is common for younger or smaller companies that
        have invested heavily in owned content but never pursued reviews, listings or press.
      </p>

      <h2 id="myths">Common myths about content audits and AI visibility</h2>

      <p>
        <strong>Myth: "If my content ranks well in Google, it's fine for AI too."</strong> Not
        necessarily. Google's ranking signals and a language model's retrieval and synthesis
        process reward different things — a page can rank on backlink authority while still being
        too unstructured or vague for a model to confidently quote.
      </p>

      <p>
        <strong>Myth: "Adding more content fixes everything."</strong> Often the opposite —
        publishing more thin pages dilutes your topical authority. Fixing the structure and
        specificity of what you already have usually beats adding volume.
      </p>

      <p>
        <strong>Myth: "One audit and I'm done."</strong> Model behavior shifts, competitors publish
        new content, and your own business facts change over time (pricing, positioning, team). An
        audit is a recurring practice, not a one-time project — quarterly is a reasonable cadence
        for most businesses, as covered in the FAQs above.
      </p>

      <h2 id="action-plan">A practical 30-day action plan</h2>

      <ul>
        <li><strong>Week 1:</strong> Inventory your top 20-30 pages by traffic and relevance to buying decisions; check robots.txt for AI crawler access issues across the whole site.</li>
        <li><strong>Week 2:</strong> Score each priority page against the five-dimension framework above; note which fail on structure versus schema versus facts.</li>
        <li><strong>Week 3:</strong> Fix the highest-priority pages first — restructure openings, correct schema, and reconcile facts against third-party listings.</li>
        <li><strong>Week 4:</strong> Freeze a prompt set relevant to your category, run it against ChatGPT, Gemini, Claude and Perplexity, and record a baseline to compare against in a month.</li>
      </ul>

      <p>
        For the measurement step, a manual re-check every few weeks works, but it's slow and easy to
        let slip. The{" "}
        <Link to="/dashboard" className="text-yellow-400 underline">AI Mention You dashboard</Link>{" "}
        automates that repeated sampling so you can see whether the fixes from your audit are
        actually moving your mention rate, rather than relying on an occasional manual spot check.
        If you're building out your prompt set for the first time, our{" "}
        <Link to="/blog/ai-keyword-research" className="text-yellow-400 underline">
          guide to AI keyword research
        </Link>{" "}
        is a good companion piece — it covers how to find the right questions to test against
        before you start auditing whether your content answers them well.
      </p>

      <p>
        None of this replaces the fundamentals of{" "}
        <Link to="/blog/llm-readiness-optimization" className="text-yellow-400 underline">
          LLM readiness optimization
        </Link>{" "}
        or the broader work of building third-party authority — an audit is where you find the
        specific, fixable problems on pages you've already invested in, so the authority-building
        work you do elsewhere has somewhere solid to land.
      </p>
    </BlogLayout>
  );
};

export default ContentAuditAIVisibility;
