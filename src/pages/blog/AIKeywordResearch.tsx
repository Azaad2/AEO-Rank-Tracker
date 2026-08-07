import { useEffect } from "react";
import BlogLayout from "@/components/blog/BlogLayout";
import { Link } from "react-router-dom";

const CANONICAL = "https://aimentionyou.com/blog/ai-keyword-research";

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
    question: "How is AI keyword research different from traditional keyword research?",
    answer:
      "Traditional keyword research is built around search volume and fragments people type into Google, like 'best CRM small teams.' AI keyword research is built around full questions people ask conversational assistants, like 'What's the best CRM for a 10-person startup on a tight budget?' The intent is the same, but the phrasing, the length, and the context you need to satisfy are different — you're optimizing for a question that gets answered in a sentence, not a link that gets clicked.",
  },
  {
    question: "Should I abandon traditional keyword research?",
    answer:
      "No. Traditional keyword tools still tell you what people search for in volume, which pages have ranking potential, and where competitors are strong. AI keyword research adds a second layer on top: the actual prompts people type into ChatGPT, Gemini, Claude and Perplexity. You need both, because Google Search and AI assistants aren't converging into one channel — they're two channels with overlapping but distinct query patterns.",
  },
  {
    question: "Where do I find the questions people ask AI assistants?",
    answer:
      "You can't pull this from Google Keyword Planner because AI assistant prompts aren't public search data. Instead, mine your own first-party sources: sales call transcripts, support tickets, live chat logs, community forums like Reddit and G2, and your own team's intuition about what a buyer would ask if they had no idea your product existed. Then validate by actually running those prompts against the AI Mention You visibility checker to see who currently gets recommended.",
  },
  {
    question: "Do AI assistants have their own keyword volume data?",
    answer:
      "No public tool exposes ChatGPT or Gemini prompt volume the way Google exposes search volume, and none of the major AI labs has published this data. That's the biggest structural difference in doing this research: you're working from qualitative signal and repeated sampling instead of a volume number, so the research process looks more like customer interviews than spreadsheet keyword mining.",
  },
  {
    question: "What's a 'prompt cluster' and why does it matter?",
    answer:
      "A prompt cluster is a group of differently worded questions that all point at the same underlying intent — for example, 'best project management tool for agencies,' 'what software do agencies use to manage client work,' and 'alternative to Asana for agencies' are one cluster. AI assistants paraphrase constantly, so if you only optimize for one exact phrasing you'll miss the traffic. Building content around the cluster, not the phrase, is what makes it durable.",
  },
  {
    question: "How many prompts should I track per topic?",
    answer:
      "Most teams get useful signal from 8-15 prompts per core topic: a mix of direct ('best X for Y'), comparative ('X vs Y'), and problem-based ('how do I solve Z') phrasings. Fewer than that and you're reacting to noise from one lucky or unlucky answer; many more than that and the list becomes unmanageable to track weekly.",
  },
  {
    question: "Does long-tail still matter for AI search?",
    answer:
      "It matters more, not less. AI assistants handle narrow, highly specific questions well because they can synthesize an answer instead of just matching a page. A prompt like 'best invoicing tool for freelance photographers in the UK' has almost no Google search volume but is exactly the kind of question a specialist can win consistently.",
  },
  {
    question: "How do I turn a prompt list into content?",
    answer:
      "Group prompts into clusters, then build one comprehensive, well-structured page per cluster rather than a thin page per keyword. Each page should open with a direct, quotable answer to the core question, then go deeper with comparisons, evidence and caveats. This mirrors how AI systems retrieve: they want one page that answers the question cleanly, not ten pages competing for the same fragment.",
  },
  {
    question: "Should product pages target these prompts too?",
    answer:
      "Yes, especially comparison and 'best for' style prompts. If someone asks an assistant 'what's the best tool for X,' the assistant is more likely to surface a business that has a page directly addressing that comparison, with pricing and specific use cases, than a generic homepage. Vague marketing copy rarely gets quoted.",
  },
  {
    question: "How often should I refresh AI keyword research?",
    answer:
      "Quarterly for most businesses, monthly if you're in a fast-moving category like AI tools or fintech where new competitors and new phrasing enter the market constantly. Assistant behavior also shifts as models update, so a prompt set that worked six months ago may need new variants today.",
  },
  {
    question: "What tools help with this research?",
    answer:
      "AI prompt generators help you brainstorm phrasing variants, AI visibility checkers show you who currently gets mentioned for a given prompt, and standard SEO tools still help with volume and competitive gap analysis on the traditional side. Combining outputs from a tool like the AI Mention You keyword and prompt tooling with manual customer research gives the most reliable list.",
  },
  {
    question: "Does keyword stuffing or exact-match phrasing help with AI assistants?",
    answer:
      "No. AI assistants use semantic understanding, not exact string matching, so repeating a phrase verbatim doesn't move the needle the way it might have with 2010-era SEO. What helps is directly and clearly answering the underlying question in natural language, with enough specificity that the model can extract a confident, quotable claim.",
  },
  {
    question: "How is this different from traditional 'question keywords' research SEOs already do?",
    answer:
      "It's an evolution of the same practice, not a brand-new discipline. SEOs have targeted 'people also ask' questions for years. AI keyword research extends that to longer, more conversational, more comparative phrasing, and adds a validation step — actually testing the prompt against live assistants — that traditional keyword research never needed because there was no black-box model deciding what to say back.",
  },
  {
    question: "Can I use my competitors' content to find AI prompts?",
    answer:
      "Yes. Look at their FAQ sections, their 'vs' pages, and their blog headings — competitors who've already done keyword research have effectively published their hypothesis about what people ask. Then test whether AI assistants actually cite them for those phrasings, which tells you whether their bet paid off or whether there's a gap you can fill.",
  },
];

const relatedPosts = [
  { title: "AI Prompt Generator Guide", slug: "ai-prompt-generator-guide", category: "AI Generators" },
  { title: "AI Visibility Checker Guide", slug: "ai-visibility-checker-guide", category: "AI Visibility" },
  { title: "How AI Decides What Brands to Recommend", slug: "how-ai-decides-what-brands-to-recommend", category: "AI Visibility" },
  { title: "Content Audit for AI Visibility", slug: "content-audit-ai-visibility", category: "Content Tools" },
  { title: "GEO Optimization Guide", slug: "geo-optimization-guide", category: "AEO" },
];

const AIKeywordResearch = () => {
  useEffect(() => {
    const id = "ai-keyword-research-extra-schema";
    document.getElementById(id)?.remove();

    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": CANONICAL,
          url: CANONICAL,
          name: "AI Keyword Research: Finding the Questions People Actually Ask AI Assistants",
          description:
            "How to research the conversational questions buyers ask ChatGPT, Gemini, Claude and Perplexity, and turn them into content that gets cited.",
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
              name: "AI Keyword Research",
              item: CANONICAL,
            },
          ],
        },
        {
          "@type": "HowTo",
          name: "How to do AI keyword research",
          description:
            "A repeatable process for finding the conversational prompts your buyers ask AI assistants and turning them into content that gets recommended.",
          step: [
            {
              "@type": "HowToStep",
              position: 1,
              name: "Mine first-party sources for real questions",
              text: "Pull raw phrasing from sales calls, support tickets and community forums instead of guessing at keywords.",
            },
            {
              "@type": "HowToStep",
              position: 2,
              name: "Group prompts into intent clusters",
              text: "Combine differently worded prompts that share the same underlying intent into a single cluster to target with one page.",
            },
            {
              "@type": "HowToStep",
              position: 3,
              name: "Validate against live AI assistants",
              text: "Run the prompt set through ChatGPT, Gemini, Claude and Perplexity to see who currently gets mentioned before you write anything.",
            },
            {
              "@type": "HowToStep",
              position: 4,
              name: "Build one comprehensive page per cluster",
              text: "Write a single well-structured page that directly answers the cluster's core question, rather than many thin pages.",
            },
            {
              "@type": "HowToStep",
              position: 5,
              name: "Re-test and refresh quarterly",
              text: "Re-run the prompt set on a fixed cadence and add new phrasing as the market and model behavior shift.",
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
      title="AI Keyword Research: Finding the Questions People Actually Ask AI Assistants"
      description="A practical guide to researching the conversational prompts buyers type into ChatGPT, Gemini, Claude and Perplexity, and turning them into content that gets you recommended."
      publishDate="January 3, 2025"
      readTime="16 min"
      category="SEO Tools"
      toolLink="/tools/keyword-analyzer"
      toolName="Keyword Analyzer"
      author="Azaad Pandey"
      faqs={faqs}
      relatedPosts={relatedPosts}
    >
      <p>
        Every SEO team has a keyword spreadsheet. Search volume, difficulty score, a pile of
        long-tail variants nobody ever writes content for. That spreadsheet is still useful — but
        it's answering a question that's becoming less central every year: "what do people type
        into a search box?"
      </p>

      <p>
        A growing share of buyers don't type into a search box anymore. They open ChatGPT and ask,
        in full sentences, exactly what they want: "I run a 12-person design agency, what's the
        best tool to track client hours and invoice automatically?" That's not a keyword. It's a
        paragraph. And if you've never thought about what that paragraph looks like for your
        category, you have a real gap — not in your SEO, but in your understanding of how people
        are actually finding businesses like yours now.
      </p>

      <p>
        This guide walks through how to find those questions, how they differ from traditional
        keywords, and how to turn what you learn into content that AI assistants can actually
        quote. If you haven't already, it pairs well with our guide on{" "}
        <Link to="/blog/how-ai-decides-what-brands-to-recommend" className="text-yellow-400 underline">
          how AI decides what brands to recommend
        </Link>{" "}
        — keyword research tells you what to write about, that guide tells you how to write it so
        it actually gets picked up.
      </p>

      <Takeaway>
        <p>
          AI keyword research isn't a replacement for traditional keyword research — it's a second,
          parallel discipline. Traditional research optimizes for what people type. AI keyword
          research optimizes for what people ask, in full sentences, with context an assistant has
          to synthesize into a specific answer.
        </p>
      </Takeaway>

      <h2 id="what-is-ai-keyword-research">What is AI keyword research, exactly?</h2>

      <Definition term="AI keyword research">
        <p>
          The process of identifying the natural-language questions and prompts people ask AI
          assistants (ChatGPT, Gemini, Claude, Copilot, Perplexity) when researching a purchase,
          comparing options, or solving a problem in your category — then structuring content
          around those questions so your brand is more likely to be named in the response.
        </p>
      </Definition>

      <p>
        Traditional keyword research assumes a fragment: three or four words, stripped of
        grammar, ranked by monthly search volume you can pull from a tool like Ahrefs or Google
        Keyword Planner. AI keyword research assumes a full question, often with context attached
        — company size, budget, industry, urgency — because that's how people actually talk to a
        chatbot. Nobody types "CRM startup" into ChatGPT. They type "I'm a 3-person startup with a
        $50/month budget, what CRM should I use?"
      </p>

      <p>
        That difference matters because it changes what a "match" looks like. In classical SEO, a
        page ranks if it contains the keyword and demonstrates relevance and authority around it.
        In AI search, an assistant recommends a brand if it can construct a confident, specific
        answer to the actual question asked — and that means your content needs to address the
        specificity, not just the topic.
      </p>

      <h2 id="how-different">How is this actually different from what SEOs already do?</h2>

      <p>
        If you've done SEO for more than a couple of years, this isn't entirely new territory —
        "People Also Ask" boxes and featured snippet optimization have trained a generation of
        content teams to write for questions instead of fragments. AI keyword research is an
        extension of that instinct, pushed further in three ways: the questions are longer and more
        conversational, they often include comparative framing ("X vs Y for my use case"), and —
        critically — you can no longer infer the "right" answer from a ranking position. You have
        to actually test the prompt against a live model and see what it says back, because
        assistant answers are generated fresh, not retrieved from a fixed index position.
      </p>

      <Table
        headers={["Dimension", "Traditional keyword research", "AI keyword research"]}
        rows={[
          ["Input format", "Short fragments (2-4 words)", "Full natural-language questions"],
          ["Volume data", "Available via SEO tools", "Not publicly available — no vendor exposes prompt volume"],
          ["Validation method", "Rank tracking / SERP position", "Direct prompt testing against live assistants"],
          ["Winning unit", "A ranked page", "A quotable, self-contained answer"],
          ["Best sources", "Keyword tools, competitor SERPs", "Sales calls, support tickets, forums, direct prompt testing"],
          ["Refresh cadence", "As algorithms update, roughly yearly", "Quarterly, or monthly in fast-moving categories"],
        ]}
      />

      <h2 id="where-to-find">Where do you actually find these questions?</h2>

      <p>
        This is the part most guides skip, because there's no keyword tool you can log into and
        export a list. The honest answer is that this research is closer to customer interviews
        than spreadsheet work, and it draws on sources most marketing teams already have but rarely
        mine systematically.
      </p>

      <h3>Sales calls and demo transcripts</h3>
      <p>
        If you record sales calls (Gong, Fathom, or even just Zoom transcripts), search them for
        the exact phrasing prospects use to describe their problem before they knew your product
        existed. This is gold, because it's the language of someone who hasn't been trained by your
        marketing yet — which is exactly the state a person is in when they open ChatGPT for the
        first time on this topic.
      </p>

      <h3>Support tickets and onboarding calls</h3>
      <p>
        Customers who are stuck describe their problem in plain language: "how do I get my team to
        stop missing deadlines" rather than "project management software." Those raw phrasings
        often map directly onto the kind of problem-based prompt someone would ask an AI assistant
        before they've even identified a category of solution.
      </p>

      <h3>Forums, review sites and communities</h3>
      <p>
        Reddit threads, G2 and Capterra reviews, and niche Slack or Discord communities are full of
        people asking exactly the comparative questions AI assistants get asked: "is X worth it for
        a small team" or "what do people actually use instead of Y." These threads are also
        frequently the sources AI assistants themselves cite, so studying them does double duty —
        you learn the question and you learn who's currently winning the answer.
      </p>

      <h3>Direct prompt testing</h3>
      <p>
        Once you have a working list of candidate questions, test them. Run each prompt through
        ChatGPT, Gemini, Claude and Perplexity in a fresh session and record what comes back: which
        brands are named, what's cited, how your own brand is described if at all. This step is
        what separates guessing from research, and it's exactly the workflow the{" "}
        <Link to="/tools" className="text-yellow-400 underline">AI Mention You visibility tools</Link>{" "}
        are built to automate, so you get a repeatable trend instead of a one-off screenshot.
      </p>

      <Takeaway>
        <p>
          Volume data doesn't exist for AI prompts the way it does for Google search. Treat this as
          qualitative research first, and use repeated prompt testing as your validation step
          instead of a keyword tool's difficulty score.
        </p>
      </Takeaway>

      <h2 id="clustering">Turning a messy list into prompt clusters</h2>

      <p>
        Once you've collected 50-100 raw questions, the temptation is to write a page for each one.
        Resist it. AI assistants paraphrase heavily — the same underlying intent gets asked a dozen
        different ways — so a page-per-keyword strategy leaves you thin and repetitive. Instead,
        group questions into clusters around a single underlying intent, then build one strong,
        comprehensive page per cluster.
      </p>

      <Table
        headers={["Example cluster", "Sample phrasings that map to it"]}
        rows={[
          [
            "Best tool for X use case",
            "\"best project management tool for agencies\" / \"what software do agencies use for client work\" / \"alternative to Asana for agencies\"",
          ],
          [
            "X vs Y comparison",
            "\"is Notion better than ClickUp for a small team\" / \"ClickUp vs Notion pricing\" / \"which is easier to learn, ClickUp or Notion\"",
          ],
          [
            "Problem-first",
            "\"how do I stop my team from missing deadlines\" / \"best way to track project deadlines automatically\"",
          ],
          [
            "Budget-constrained",
            "\"free project management tool for a 5-person team\" / \"cheapest alternative to Monday.com\"",
          ],
        ]}
      />

      <p>
        A useful rule of thumb: if two questions would be satisfied by the same paragraph, they
        belong in the same cluster. If they'd need different evidence or a different angle, split
        them. Most core topics resolve into somewhere between 8 and 15 prompts once clustered,
        which is also a manageable number to track weekly for measurement purposes.
      </p>

      <h2 id="content">Turning clusters into content that actually gets quoted</h2>

      <p>
        Having the right questions doesn't automatically get you cited. The content itself needs to
        be structured so a model can lift a clean, self-contained passage out of it. A few patterns
        consistently work better than others.
      </p>

      <p>
        Open each page with a direct, specific answer to the core question in the first paragraph —
        not a scene-setting introduction. If the cluster is "best tool for X," the first two
        sentences should say who it's for and why, not build up to it three paragraphs later.
        Follow with the nuance: pricing, tradeoffs, who it's a bad fit for. Assistants tend to
        surface sources that are direct and honest about limitations, not sources that read like
        pure marketing copy, because directness reduces the model's uncertainty about whether the
        claim is safe to repeat.
      </p>

      <p>
        Comparison pages deserve particular attention here, because "X vs Y" prompts are some of
        the most common conversational queries in almost every B2B and consumer category. A
        genuinely useful, specific comparison table beats vague copy every time — it gives the
        model something concrete to extract and attribute.
      </p>

      <h2 id="measuring">How do you know if it's working?</h2>

      <p>
        Because there's no rank tracker for AI assistants the way there is for Google, measurement
        has to be built around repeated sampling instead of a single check. Freeze your cluster
        list, run it against the same set of assistants on a consistent cadence, and track three
        things over time: whether your brand appears at all, how it's described when it does, and
        which sources the assistant cites alongside you. This is the same measurement logic covered
        in more depth in our guide on{" "}
        <Link to="/blog/how-to-check-ai-search-visibility" className="text-yellow-400 underline">
          how to check AI search visibility
        </Link>
        , and it's the core function of the{" "}
        <Link to="/dashboard" className="text-yellow-400 underline">AI Mention You dashboard</Link>.
      </p>

      <h2 id="myths">Common myths about AI keyword research</h2>

      <p>
        <strong>Myth: "There's a secret database of ChatGPT search volume."</strong> There isn't.
        No major AI lab publishes prompt-level query volume, and any tool claiming exact monthly
        prompt counts for AI assistants is estimating, not measuring, because that data isn't
        exposed publicly.
      </p>

      <p>
        <strong>Myth: "Stuffing the exact phrase into your page helps."</strong> It doesn't, and it
        can hurt readability. Assistants work from semantic meaning, not string matching, so the
        goal is to answer the underlying question clearly, not to repeat a phrase.
      </p>

      <p>
        <strong>Myth: "This replaces traditional SEO keyword research."</strong> It doesn't — Google
        Search is still where a large share of purchase research happens, and traditional keyword
        data still tells you where the competitive gaps and volume are on that channel. AI keyword
        research is additive.
      </p>

      <h2 id="checklist">A quick-start checklist</h2>

      <ul>
        <li>Pull raw phrasing from 20+ sales calls, support tickets, or onboarding conversations.</li>
        <li>Scan 3-5 relevant Reddit or G2 threads in your category for real questions and comparisons.</li>
        <li>Group the resulting questions into 8-15 clusters per core topic.</li>
        <li>Test each cluster's representative prompt against ChatGPT, Gemini, Claude and Perplexity.</li>
        <li>Build or rewrite one comprehensive page per cluster, leading with a direct answer.</li>
        <li>Re-test the full prompt set quarterly and track changes in mention rate over time.</li>
      </ul>

      <p>
        None of this requires exotic tooling. It requires treating "what do people ask AI about my
        category" as seriously as you've historically treated "what do people search for on
        Google" — and building the habit of testing your assumptions against live assistants
        instead of guessing. If you want a shortcut for the testing step, our{" "}
        <Link to="/pricing" className="text-yellow-400 underline">AI Mention You plans</Link>{" "}
        automate the repeated prompt sampling so you're not doing it manually every week.
      </p>
    </BlogLayout>
  );
};

export default AIKeywordResearch;
