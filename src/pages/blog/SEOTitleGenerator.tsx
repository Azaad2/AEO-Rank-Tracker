import { useEffect } from "react";
import BlogLayout from "@/components/blog/BlogLayout";
import { Link } from "react-router-dom";

const CANONICAL = "https://aimentionyou.com/blog/seo-title-generator";

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
            <th key={h} className="border-b border-gray-800 py-2 pr-4 font-semibold text-gray-200">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className="border-b border-gray-800/60 py-2 pr-4 align-top text-gray-300">
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
    question: "What makes a good SEO title in 2026?",
    answer:
      "A good SEO title puts the primary keyword or the exact phrase a buyer would type near the front, stays close to 55-60 characters so Google doesn't truncate or rewrite it, and makes a specific promise instead of a vague one. 'SEO Title Generator: Headlines That Rank and Convert' works because it names the tool and the outcome. 'The Best Way to Write Titles' does not, because it promises nothing concrete.",
  },
  {
    question: "How long should a title tag actually be?",
    answer:
      "Google renders titles by pixel width, not character count, so the real limit is roughly 580-600 pixels on desktop, which usually lands between 50 and 60 characters depending on which letters you use. Wide characters like 'W' and 'M' eat the budget faster than narrow ones like 'i' or 'l'. Aim for 55 characters as a safe target and check the preview before publishing.",
  },
  {
    question: "Does Google always use the title I write?",
    answer:
      "No. Google's own documentation on title link generation states that it may rewrite your title tag if it doesn't match the query well, is stuffed with keywords, is missing entirely, or is boilerplate repeated across many pages. Studies of large SERP samples have found Google rewrites a meaningful share of title tags, so writing a clear, unique, on-topic title is also the best defense against being rewritten.",
  },
  {
    question: "Should I include my brand name in every title?",
    answer:
      "Not necessarily. For the homepage and top navigational pages, yes, because people search for you by name. For blog posts, comparison pages, and tool pages, lead with the keyword and the value proposition first, and append the brand only if there's room left after the meaningful part of the title.",
  },
  {
    question: "How is a title different from an H1?",
    answer:
      "The title tag lives in the page's head element and is what search engines and browser tabs display; the H1 is the visible on-page headline a reader sees at the top of the article. They can be identical, but they don't have to be. Titles are written to win a click in a results list; H1s are written to confirm to a reader that they landed in the right place, so an H1 can be slightly longer or more conversational.",
  },
  {
    question: "Do titles affect AI assistant answers, not just Google?",
    answer:
      "Yes, indirectly but meaningfully. When ChatGPT, Perplexity, or Gemini browse and cite web pages, the title is one of the first signals used to judge relevance and to build the citation card shown to the user. A clear, descriptive title that states exactly what the page answers makes it easier for a retrieval system to match your page to a question and easier for a model to quote you accurately. Read more in our guide on how AI decides what brands to recommend.",
  },
  {
    question: "What is title tag truncation and how do I avoid it?",
    answer:
      "Truncation happens when your title is too long for the display width and Google cuts it off with an ellipsis, sometimes mid-word. It weakens the value proposition and can make a title look unfinished or spammy. Avoid it by front-loading the most important words, keeping the full title under roughly 60 characters, and using a live preview tool before you publish so you see exactly what will be cut.",
  },
  {
    question: "Can I use the same title formula for every page?",
    answer:
      "You can use a repeatable pattern, like '[Keyword]: [Specific Benefit or Number]', but don't literally reuse the same template with only the keyword swapped across dozens of pages. Google flags near-duplicate, boilerplate titles as a reason it rewrites them, and readers scanning a search results page notice repetitive formulas too.",
  },
  {
    question: "Should title tags include numbers?",
    answer:
      "Numbers can help when they're real and specific, such as a step count, a year, or a price, because they set a concrete expectation. A vague number for the sake of pattern-matching a listicle format doesn't help; readers and AI systems both reward specificity over formula.",
  },
  {
    question: "How often should I re-test or update titles?",
    answer:
      "Review titles for your top-traffic pages roughly every quarter, or immediately after you notice a CTR drop in Google Search Console. Titles for time-sensitive content (pricing, comparisons, 'best of' lists) benefit from more frequent updates, since stale years or outdated claims reduce trust and click-through.",
  },
  {
    question: "What's the difference between a title tag and a meta description for CTR?",
    answer:
      "The title is the headline and carries the most ranking-relevant keyword weight; the meta description is the supporting sales pitch underneath it and has no direct ranking effect but strongly influences whether someone clicks. They should work together, not repeat each other verbatim. See our meta description generator guide for how to pair the two.",
  },
  {
    question: "Can AI title generators replace a human editor?",
    answer:
      "AI is excellent at producing 10-20 title variations quickly, which is genuinely useful for breaking writer's block and seeing angles you hadn't considered. But an AI generator doesn't know your actual CTR data, your brand voice, or which claims you can defend. Treat AI output as a first draft to edit, not a final answer to publish unread.",
  },
  {
    question: "Do power words in titles actually improve click-through rate?",
    answer:
      "Words like 'proven', 'ultimate', or 'guaranteed' can lift CTR in some tests, but they also erode trust fast if the content doesn't deliver, and overuse trains readers to skip past your listings. A specific, honest promise ('7-step checklist', '2026 pricing comparison') tends to outperform generic hype words over the long run because it sets an accurate expectation.",
  },
  {
    question: "How does title length interact with mobile search results?",
    answer:
      "Mobile SERPs are narrower than desktop, so the effective pixel budget for a fully visible title is smaller on a phone screen. Since most search traffic is mobile, it's safer to make sure the most important words appear in the first 40-45 characters so the core message survives even on a cramped screen.",
  },
  {
    question: "Should product pages and blog posts use different title strategies?",
    answer:
      "Yes. Product and pricing pages should front-load the product name and its defining attribute (price tier, category, key feature) because buyers scanning results are comparing options. Blog posts should front-load the question or keyword phrase the reader typed, because informational searchers are scanning for an answer, not a brand.",
  },
];

const relatedPosts = [
  { title: "Meta Description Generator", slug: "meta-description-generator", category: "SEO Tools" },
  { title: "SERP Preview Tool", slug: "serp-preview-tool", category: "SEO Tools" },
  { title: "Meta Tag Optimization", slug: "meta-tag-optimization", category: "Content Tools" },
  { title: "Schema Markup Generator", slug: "schema-markup-generator", category: "SEO Tools" },
  { title: "AI Keyword Research", slug: "ai-keyword-research", category: "SEO Tools" },
];

const SEOTitleGenerator = () => {
  useEffect(() => {
    const id = "seo-title-generator-extra-schema";
    document.getElementById(id)?.remove();

    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": CANONICAL,
          url: CANONICAL,
          name: "SEO Title Generator: Headlines That Rank and Convert",
          description:
            "How to write SEO titles that avoid Google rewrites, win clicks, and help AI assistants cite your page accurately, plus a step-by-step process and a free title generator.",
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
              name: "SEO Title Generator",
              item: CANONICAL,
            },
          ],
        },
        {
          "@type": "HowTo",
          name: "How to write an SEO title that ranks and converts",
          description:
            "A repeatable process for writing title tags that avoid Google rewrites and earn clicks.",
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Identify the exact query",
              text: "Write down the literal phrase your target reader would type or ask an AI assistant before writing a single word of the title.",
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Front-load the keyword",
              text: "Place the primary keyword or phrase within the first 40-45 characters so it survives truncation on mobile.",
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Add a specific value signal",
              text: "Append a concrete number, outcome, or differentiator rather than a vague adjective.",
            },
            {
              "@type": "HowToStep",
              position: 4,
              name: "Preview and trim",
              text: "Check the rendered pixel width in a SERP preview tool and cut words until the full title is visible on desktop and mobile.",
            },
            {
              "@type": "HowToStep",
              position: 5,
              name: "Measure and iterate",
              text: "Track click-through rate in Search Console for 2-4 weeks and revise titles that underperform their ranking position.",
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
      title="SEO Title Generator: Headlines That Rank and Convert"
      description="Create compelling titles that rank in search engines, survive Google's rewrite algorithm, and help AI assistants cite your page accurately."
      publishDate="January 1, 2025"
      readTime="14 min"
      category="SEO Tools"
      toolLink="/tools/title-generator"
      toolName="Title Generator"
      faqs={faqs}
      relatedPosts={relatedPosts}
    >
      <p>
        Most people writing a title tag treat it as an afterthought — something to fill in after
        the article is done, in whatever thirty seconds are left before hitting publish. That's a
        mistake, because the title is the single highest-leverage piece of copy on the page. It's
        the first thing a person sees in a search result, the first thing a browser tab shows, and
        increasingly, the first signal an AI assistant uses to decide whether your page is worth
        citing at all.
      </p>

      <p>
        A title tag has to do three jobs at once: match what someone actually searched for, survive
        Google's tendency to rewrite titles it doesn't like, and make a stranger scrolling through
        ten blue links want to click yours instead of the other nine. Most titles fail at least one
        of those jobs. This guide walks through why, and gives you a repeatable process — plus our
        free <Link to="/tools/title-generator" className="text-yellow-400 underline">Title Generator</Link> —
        for writing ones that don't.
      </p>

      <Takeaway>
        <p>
          A title tag is not just decoration. Google's Search Central documentation explicitly says
          it may rewrite titles that don't match a query, are stuffed with keywords, or are
          boilerplate — which means a weak title isn't just a missed opportunity, it's a liability
          that increases the odds a machine will overwrite your words with its own.
        </p>
      </Takeaway>

      <h2 id="what-is-a-title-tag">What exactly is an SEO title, and why does it matter more than people think?</h2>

      <Definition term="Title tag (SEO title)">
        <p>
          The HTML element (<code>&lt;title&gt;</code>) that defines the text shown as the clickable
          headline in search results, the label on a browser tab, and often the default text used
          when a page is shared on social media or cited by an AI assistant.
        </p>
      </Definition>

      <p>
        The title is separate from your on-page H1, and separate from your URL slug, though all
        three should tell a consistent story about what the page is. Search engines use the title
        as a strong relevance signal for ranking, but its bigger job in practice is behavioral: it's
        the deciding factor in whether a person who already sees your page ranked on the results
        page actually clicks it. Two pages can rank in the same position with wildly different
        click-through rates purely because of title quality.
      </p>

      <p>
        There's also a newer reason to care. When an AI assistant like ChatGPT with browsing,
        Perplexity, or Gemini pulls in a live web result, it typically surfaces the page title as
        part of the citation card the user sees, and it uses the title text to help decide which of
        several similar pages best answers the question being asked. A vague or generic title
        doesn't just lose a Google click — it can lose an AI citation entirely, because the model
        has no strong signal that your page is the right match. Our guide on{" "}
        <Link to="/blog/how-ai-decides-what-brands-to-recommend" className="text-yellow-400 underline">
          how AI decides what brands to recommend
        </Link>{" "}
        goes deeper into this mechanism.
      </p>

      <h2 id="length-and-truncation">How long should a title actually be?</h2>

      <p>
        The common advice is "keep it under 60 characters," and that's a reasonable rule of thumb,
        but it's an approximation of the real constraint, which is pixel width, not character count.
        Google renders titles in a proportional font and cuts them off — usually with an ellipsis —
        once they exceed roughly 580-600 pixels on desktop. A title full of narrow letters like "i",
        "l", and "t" can run longer than 60 characters and still display fully. A title full of wide
        capital letters can truncate at 50.
      </p>

      <Table
        headers={["Title length", "What typically happens", "Recommendation"]}
        rows={[
          ["Under 30 characters", "Displays fully but often too vague to be compelling", "Add a specific benefit or number"],
          ["50-60 characters", "The safest range; usually displays in full on desktop and mobile", "Target this range for most pages"],
          ["60-70 characters", "Risk of truncation depends heavily on which letters are used", "Preview before publishing"],
          ["70+ characters", "Very likely to be cut off, sometimes mid-word", "Trim to the essential phrase"],
        ]}
      />

      <p>
        This is exactly why a live preview matters more than a character counter. Our{" "}
        <Link to="/blog/serp-preview-tool" className="text-yellow-400 underline">SERP Preview Tool</Link>{" "}
        renders your title and description the way Google actually displays them, so you can see
        truncation before it happens instead of guessing from a character count.
      </p>

      <h2 id="why-google-rewrites-titles">Why does Google rewrite some titles?</h2>

      <p>
        Google has been public about this since 2021: its systems generate a "title link" that
        isn't always identical to your <code>&lt;title&gt;</code> tag. According to Google's Search
        Central documentation, this happens when the tag is missing, is generic boilerplate repeated
        across many pages, is stuffed with repeated keywords, or doesn't match what the query is
        actually asking. Independent studies analyzing large samples of SERPs over the years have
        consistently found that Google rewrites a meaningful share of title tags — anywhere from
        roughly a third to well over half, depending on the study and query type.
      </p>

      <p>
        The practical takeaway isn't that titles don't matter because Google might change them
        anyway. It's the opposite: writing a title that's specific, unique to the page, and closely
        matched to real search intent is the single best way to reduce the odds Google decides it
        needs to intervene. A rewritten title is usually a symptom of a title that was trying too
        hard to be clever or too hard to stuff in keywords, rather than trying hard to be accurate.
      </p>

      <h2 id="anatomy-of-a-good-title">What does a good title actually look like, structurally?</h2>

      <p>
        Most high-performing titles follow one of a small number of structural patterns. None of
        these are magic formulas — they work because they're specific, not because of some hidden
        algorithm preference — but they're a useful starting point when you're staring at a blank
        field.
      </p>

      <Table
        headers={["Pattern", "Example", "Best for"]}
        rows={[
          ["Keyword: Specific outcome", "SEO Title Generator: Headlines That Rank and Convert", "Tool and product pages"],
          ["How to [do specific thing]", "How to Fix Duplicate Title Tags Across 500 Pages", "Tutorial and how-to content"],
          ["Number + noun + benefit", "7 Meta Description Templates That Lift CTR", "Listicles with real, countable items"],
          ["Question the reader is asking", "What Is a Good CTR for Position 1 in Google?", "FAQ-style and definition content"],
          ["Comparison format", "SERP Preview Tool vs. Manual Screenshot Testing", "Comparison and versus pages"],
        ]}
      />

      <p>
        Notice that none of these rely on hype words like "ultimate," "best-ever," or "insane."
        Specificity does more work than enthusiasm. A title that promises "7 templates" or explains
        "how to fix duplicate titles across 500 pages" sets a concrete, credible expectation, and
        credible expectations get clicked more reliably than vague superlatives, because readers have
        learned to distrust the latter.
      </p>

      <h2 id="using-ai-to-generate-titles">How should you actually use AI to generate titles?</h2>

      <p>
        AI is genuinely good at one specific part of this job: producing a wide spread of angles
        fast. Feed a model your target keyword, your audience, and the core value proposition of
        the page, and it can hand you fifteen structurally different options in a few seconds —
        some question-based, some number-based, some benefit-led. That's useful for escaping the
        first three ideas that come to your own head, which are usually the most generic ones
        anyone in your position would think of.
      </p>

      <p>
        Where AI falls short is judgment. It doesn't know your actual click-through data, it doesn't
        know which claims your business can legally or practically back up, and it has no opinion on
        your brand voice unless you give it very explicit constraints. Treat AI-generated titles as
        a shortlist to edit, not a vending machine to publish from blindly. Run the shortlist through
        a length check, read each one out loud, and ask honestly whether you'd click it if a stranger
        wrote it.
      </p>

      <Takeaway>
        <p>
          The fastest way to improve AI-generated titles is to give the model constraints, not just
          a topic: exact character budget, the literal keyword phrase, the specific number or fact
          to include, and one thing to avoid (like hype words or your own brand name). Constraints
          turn generic output into usable output.
        </p>
      </Takeaway>

      <h2 id="testing-titles">How do you actually test and improve titles over time?</h2>

      <p>
        Google Search Console is the primary free tool for this. For any page, you can see
        impressions, clicks, and average position over time, which lets you calculate click-through
        rate for that specific ranking position. If your page ranks position 4 for a query but its
        CTR is well below what similar position-4 pages typically get, that's usually a title (or
        meta description) problem, not a ranking problem.
      </p>

      <p>
        True A/B testing of titles is harder in organic search than in paid ads, since you can't
        show two versions to two random halves of the same search traffic simultaneously the way
        you can with an ad. The practical approach most sites use instead is sequential testing:
        change the title, note the date, and compare CTR for a few weeks before and after, while
        controlling as best you can for seasonality and ranking position changes.
      </p>

      <Table
        headers={["Signal in Search Console", "Likely diagnosis", "What to try"]}
        rows={[
          ["High impressions, low CTR, good position", "Title/description not compelling for the query", "Rewrite the title with a sharper value promise"],
          ["Low impressions", "Title doesn't match how people actually search", "Realign the keyword phrase in the title"],
          ["Good CTR but high bounce", "Title over-promises relative to content", "Make the title match what the page delivers"],
          ["Title shown differs from what you wrote", "Google rewrote it", "Simplify and de-duplicate the title, then recheck in a few weeks"],
        ]}
      />

      <h2 id="titles-and-ai-visibility">Does your title tag affect whether AI assistants mention your brand?</h2>

      <p>
        Indirectly, yes, and it's worth separating two different mechanisms. First, when an
        assistant is actively browsing the web to answer a question, a clear and accurately matched
        title makes your page an easier candidate to retrieve and cite, the same way it helps a
        human scanning search results. Second, and more subtly, a consistent, descriptive title
        across your pages helps build the kind of clean entity signal that AI systems use to
        understand what your business does and what it's an authority on — something we cover in
        depth in{" "}
        <Link to="/blog/what-is-answer-engine-optimization-do-you-need-it" className="text-yellow-400 underline">
          our guide to Answer Engine Optimization
        </Link>
        .
      </p>

      <p>
        None of this means you should write titles "for AI" instead of for people. The same
        qualities that make a title good for a human — specific, honest, matched to intent — are
        exactly what makes it easy for a machine to quote accurately. If you want a broader view of
        how your brand shows up across ChatGPT, Gemini, Claude, and Perplexity today, you can run a
        free check with our{" "}
        <Link to="/" className="text-yellow-400 underline">AI Mention You</Link> visibility tool.
      </p>

      <h2 id="common-mistakes">What are the most common title mistakes?</h2>

      <p>
        Keyword stuffing is the most obvious one, but it's rarer than it used to be. The subtler and
        more common mistake today is genericness — dozens of pages across a site all titled some
        variant of "[Product] | Company Name" with no differentiation, which is exactly the kind of
        boilerplate pattern Google's own documentation flags as a rewrite trigger. Another common
        mistake is a title that describes the topic broadly ("SEO Tips") instead of the specific
        angle the page actually takes ("SEO Title Tag Length Limits for 2026"), which loses both
        ranking specificity and click appeal.
      </p>

      <p>
        A third mistake, more common on larger sites, is letting a CMS auto-generate titles from
        page templates without ever reviewing them individually. Auto-generated titles are
        frequently truncated, duplicated across near-identical pages, or missing the keyword
        entirely because the template wasn't built with SEO in mind. If you manage a large site, a
        periodic{" "}
        <Link to="/blog/content-audit-ai-visibility" className="text-yellow-400 underline">
          content audit
        </Link>{" "}
        that specifically checks titles for duplication and truncation catches these before they
        quietly cost you months of clicks.
      </p>

      <h2 id="myths">Common myths about title tags</h2>

      <p>
        <strong>Myth: longer titles rank better because they contain more keywords.</strong> Modern
        search algorithms understand semantic relevance well beyond exact keyword matches, and a
        title stuffed with variations reads as spam to both algorithms and humans. One clear phrase
        beats five crammed-in synonyms.
      </p>

      <p>
        <strong>Myth: the title must exactly match the H1.</strong> They should be consistent in
        meaning, but the title is written for a search results context and the H1 for an on-page
        reading context — they can legitimately differ in phrasing and length.
      </p>

      <p>
        <strong>Myth: once you write a good title, it's done forever.</strong> Titles referencing a
        year, a price, or a "best of" claim age. Revisiting your top pages' titles on a quarterly
        cadence, especially anything tied to pricing or comparisons, keeps them accurate and keeps
        CTR from quietly decaying.
      </p>

      <h2 id="checklist">SEO title checklist</h2>

      <ul>
        <li>Does the title contain the exact phrase or a close variant of what the reader would search?</li>
        <li>Is the most important information within the first 40-45 characters?</li>
        <li>Is the full title under roughly 55-60 characters, or verified in a pixel-accurate preview?</li>
        <li>Does it make one specific, honest promise instead of a vague superlative?</li>
        <li>Is it unique across your entire site — no repeated boilerplate template?</li>
        <li>Does it match what the page actually delivers, so bounce rate doesn't spike?</li>
        <li>Have you previewed it on both desktop and mobile widths?</li>
      </ul>

      <h2 id="conclusion">Where to go from here</h2>

      <p>
        A title tag takes two minutes to write and can influence a page's performance for years.
        That ratio is why it deserves more attention than the thirty seconds most people give it
        before hitting publish. Start with our free{" "}
        <Link to="/tools/title-generator" className="text-yellow-400 underline">Title Generator</Link>{" "}
        to get a spread of options, trim to a pixel-accurate length with the{" "}
        <Link to="/blog/serp-preview-tool" className="text-yellow-400 underline">SERP Preview Tool</Link>,
        and pair the finished title with a matching description using the{" "}
        <Link to="/blog/meta-description-generator" className="text-yellow-400 underline">
          Meta Description Generator
        </Link>
        . If you want to see how your existing titles and pages are already performing in AI search,
        explore the full <Link to="/tools" className="text-yellow-400 underline">tools directory</Link>{" "}
        or check <Link to="/pricing" className="text-yellow-400 underline">pricing</Link> for ongoing
        monitoring.
      </p>
    </BlogLayout>
  );
};

export default SEOTitleGenerator;
