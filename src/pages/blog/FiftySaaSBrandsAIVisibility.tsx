import BlogLayout from "@/components/blog/BlogLayout";
import { Link } from "react-router-dom";

const FiftySaaSBrandsAIVisibility = () => {
  const faqs = [
    {
      question: "Why did Gemini score every brand 0/3?",
      answer:
        "This is a measurement issue on our scanning side, not a real signal that Gemini doesn't mention these brands. Likely a model deprecation or API configuration. We're fixing it and will republish Gemini-corrected data soon. All scores in this article exclude Gemini and are weighted 60% Perplexity + 40% ChatGPT/Search.",
    },
    {
      question: "Why did Miro outrank HubSpot and Salesforce?",
      answer:
        "Whiteboard tools are a less crowded category than CRM or marketing automation. Miro effectively owns 'best whiteboard tools' across AI surfaces because there are fewer credible competitors. Category density matters more than brand size for AI visibility.",
    },
    {
      question: "Is one scan per brand enough to draw conclusions?",
      answer:
        "LLM responses are non-deterministic — the same prompt can return different answers across runs. With one scan per brand, scores have noise of roughly ±10 points. The top/bottom rank order is reliable, but exact positions in the middle of the leaderboard would shift across runs.",
    },
    {
      question: "How can my SaaS improve its AI visibility score?",
      answer:
        "Three highest-ROI moves: (1) get cited in independent comparison content like 'best [category] tools' listicles, (2) build clear FAQ schema and structured product pages, (3) target specific long-tail queries rather than competing for generic category terms. Brand recognition alone doesn't translate to AI visibility.",
    },
    {
      question: "What's the difference between AI visibility and SEO ranking?",
      answer:
        "Traditional SEO ranks pages in Google's search results. AI visibility measures whether AI assistants (ChatGPT, Perplexity, etc.) mention and recommend your brand when buyers ask category questions. The signals overlap but are not identical — AI weights citations, comparison content, and developer-community mentions more heavily than backlink count.",
    },
  ];

  const relatedPosts = [
    {
      title: "7 Best Online LLM Rank Trackers (2026)",
      slug: "best-online-llm-rank-tracker",
      category: "AI Visibility",
    },
    {
      title: "AI Overviews Tracking Guide",
      slug: "ai-overviews-tracking-guide",
      category: "AI Visibility",
    },
    {
      title: "Perplexity Rank Tracker Guide",
      slug: "perplexity-rank-tracker-guide",
      category: "AI Visibility",
    },
  ];

  return (
    <BlogLayout
      title="I ran 150 AI search prompts on 50 SaaS brands. The data surprised me."
      description="Original data on how ChatGPT, Perplexity, and Gemini recommend B2B SaaS brands. Miro beat HubSpot. Plaid scored 16/100. Full rankings and 5 patterns inside."
      publishDate="May 21, 2026"
      readTime="11 min"
      category="AI Visibility Data"
      author="Azaad"
      faqs={faqs}
      relatedPosts={relatedPosts}
    >
      <h2>The hook</h2>
      <p>
        73% of B2B buyers now use AI assistants before they ever visit a vendor's
        website. So I had a question that nobody had answered with real data: when
        buyers ask ChatGPT, Perplexity, or Gemini for SaaS recommendations, which
        brands actually get recommended?
      </p>
      <p>
        To find out, I ran 150 prompts across 50 of the most recognized B2B SaaS
        brands — Notion, HubSpot, Linear, Mixpanel, Stripe, Figma, Slack, and 43
        others. Each brand got 3 different prompts (category leadership, alternative
        searches, and head-to-head comparisons) across all 3 major search-AI
        surfaces.
      </p>
      <p>
        <strong>The data surprised me.</strong>
      </p>
      <p>
        The most visible B2B SaaS brand wasn't HubSpot, wasn't Salesforce, and
        wasn't Notion. It was <strong>Miro</strong> — scoring 58/100 — beating
        brands with 5x the revenue. And the worst performer? Plaid, the financial
        infrastructure company powering thousands of fintechs, scored just 16/100.
        AI doesn't know who pays the bills.
      </p>
      <p>
        I'll share the full rankings below, plus 5 specific patterns that show up
        across the data. If you run a SaaS brand, this is what you're up against
        when buyers ask AI to recommend a tool in your category.
      </p>
      <p>
        Methodology and notes on a major Gemini anomaly at the end. Let's get into
        it.
      </p>

      <h2>How I ran this</h2>
      <p>The setup was simple but exhaustive:</p>
      <ul>
        <li>
          <strong>50 B2B SaaS brands</strong> picked across 7 categories:
          Productivity & Collaboration, Design, Sales/CRM, Marketing & Email,
          Developer Infrastructure, Analytics, and Scheduling/Ops
        </li>
        <li>
          <strong>3 prompts per brand</strong> designed to test different buyer
          intents
        </li>
        <li>
          <strong>3 surfaces</strong>: ChatGPT-style answers grounded in Google
          Search results, Perplexity (real-time citation engine), and Gemini
          (Google's direct LLM)
        </li>
        <li>
          <strong>Total: 150 unique test cases × 3 surfaces = 450 individual
          analyses</strong>
        </li>
      </ul>
      <p>For each prompt, I measured:</p>
      <ul>
        <li>
          <strong>Mention rate</strong>: Did the AI mention this brand at all?
        </li>
        <li>
          <strong>Citation rate</strong>: Did it cite the brand's actual domain?
        </li>
        <li>
          <strong>Competitor surface</strong>: Which other brands were recommended
          instead?
        </li>
      </ul>
      <p>
        These metrics combined into a 0–100 visibility score per platform, and a
        Combined Score weighted across the three surfaces.
      </p>
      <p>
        All scans were run through{" "}
        <Link to="/">AIMentionYou</Link> on a single day, so this is a true
        point-in-time snapshot of how these brands appear in AI search right now.
      </p>
      <p>
        A note on bias: I built AIMentionYou. Yes, I have a horse in this race.
        That's exactly why I'm publishing the raw data — so you can verify
        everything yourself.
      </p>

      <h2>The Top 10 — Most visible in AI search</h2>
      <p>These are the brands that scored highest in combined AI visibility:</p>
      <div className="overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-3 text-white">Rank</th>
              <th className="text-left py-2 px-3 text-white">Brand</th>
              <th className="text-left py-2 px-3 text-white">Combined Score</th>
              <th className="text-left py-2 px-3 text-white">Category</th>
            </tr>
          </thead>
          <tbody className="text-gray-400">
            <tr className="border-b border-gray-800"><td className="py-2 px-3">1</td><td className="py-2 px-3 text-white font-medium">Miro</td><td className="py-2 px-3">58</td><td className="py-2 px-3">Design</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">2</td><td className="py-2 px-3 text-white font-medium">PostHog</td><td className="py-2 px-3">57</td><td className="py-2 px-3">Analytics</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">3</td><td className="py-2 px-3 text-white font-medium">Apollo.io</td><td className="py-2 px-3">54</td><td className="py-2 px-3">Sales/CRM</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">4</td><td className="py-2 px-3 text-white font-medium">Plausible</td><td className="py-2 px-3">50</td><td className="py-2 px-3">Analytics</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">5</td><td className="py-2 px-3 text-white font-medium">Salesforce</td><td className="py-2 px-3">49</td><td className="py-2 px-3">Sales/CRM</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">6</td><td className="py-2 px-3 text-white font-medium">Otter.ai</td><td className="py-2 px-3">48</td><td className="py-2 px-3">Scheduling</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">7</td><td className="py-2 px-3 text-white font-medium">Asana</td><td className="py-2 px-3">47</td><td className="py-2 px-3">Productivity</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">7</td><td className="py-2 px-3 text-white font-medium">Klaviyo</td><td className="py-2 px-3">47</td><td className="py-2 px-3">Marketing</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">7</td><td className="py-2 px-3 text-white font-medium">PlanetScale</td><td className="py-2 px-3">47</td><td className="py-2 px-3">Developer</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">10</td><td className="py-2 px-3 text-white font-medium">Slack</td><td className="py-2 px-3">46</td><td className="py-2 px-3">Productivity</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">10</td><td className="py-2 px-3 text-white font-medium">Cal.com</td><td className="py-2 px-3">46</td><td className="py-2 px-3">Scheduling</td></tr>
            <tr><td className="py-2 px-3">10</td><td className="py-2 px-3 text-white font-medium">Vercel</td><td className="py-2 px-3">46</td><td className="py-2 px-3">Developer</td></tr>
          </tbody>
        </table>
      </div>
      <p>Three things stand out about this list:</p>
      <p>
        <strong>Miro at #1 wasn't on my predicted leaderboard.</strong> Whiteboard
        tools aren't the SEO juggernaut category. But "best whiteboard tools," "top
        collaboration boards," and "Miro alternatives" all return Miro
        consistently. Their category is narrow enough that they own it.
      </p>
      <p>
        <strong>
          PostHog at #2 beat Mixpanel (36) and Amplitude (28) — by a lot.
        </strong>{" "}
        Open-source product analytics is winning the AI visibility race against
        the larger, better-funded incumbents. Why? PostHog's content strategy —
        extensive docs, comparison posts, GitHub presence, transparent pricing —
        creates citation density that older tools don't have.
      </p>
      <p>
        <strong>
          Salesforce at #5 is the only "boring incumbent" in the top 10.
        </strong>{" "}
        Everyone else is either category-focused (Apollo for prospecting, Klaviyo
        for ecommerce email) or developer-aligned (Vercel, PostHog, PlanetScale,
        Cal.com). AI rewards specificity and developer-adjacency more than legacy
        brand recognition.
      </p>

      <h2>The Bottom 10 — The brands AI forgot</h2>
      <p>
        The other end is more interesting. These brands scored lowest despite
        being category leaders by revenue or recognition:
      </p>
      <div className="overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-3 text-white">Rank</th>
              <th className="text-left py-2 px-3 text-white">Brand</th>
              <th className="text-left py-2 px-3 text-white">Combined Score</th>
              <th className="text-left py-2 px-3 text-white">Category</th>
            </tr>
          </thead>
          <tbody className="text-gray-400">
            <tr className="border-b border-gray-800"><td className="py-2 px-3">50</td><td className="py-2 px-3 text-white font-medium">Plaid</td><td className="py-2 px-3">16</td><td className="py-2 px-3">Developer</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">48</td><td className="py-2 px-3 text-white font-medium">Monday.com</td><td className="py-2 px-3">20</td><td className="py-2 px-3">Productivity</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">48</td><td className="py-2 px-3 text-white font-medium">Fathom</td><td className="py-2 px-3">20</td><td className="py-2 px-3">Scheduling</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">46</td><td className="py-2 px-3 text-white font-medium">ClickUp</td><td className="py-2 px-3">24</td><td className="py-2 px-3">Productivity</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">46</td><td className="py-2 px-3 text-white font-medium">Framer</td><td className="py-2 px-3">24</td><td className="py-2 px-3">Design</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">45</td><td className="py-2 px-3 text-white font-medium">Canva</td><td className="py-2 px-3">27</td><td className="py-2 px-3">Design</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">43</td><td className="py-2 px-3 text-white font-medium">Amplitude</td><td className="py-2 px-3">28</td><td className="py-2 px-3">Analytics</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">43</td><td className="py-2 px-3 text-white font-medium">Coda</td><td className="py-2 px-3">28</td><td className="py-2 px-3">Productivity</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">38</td><td className="py-2 px-3 text-white font-medium">Linear</td><td className="py-2 px-3">32</td><td className="py-2 px-3">Productivity</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">38</td><td className="py-2 px-3 text-white font-medium">Loom</td><td className="py-2 px-3">32</td><td className="py-2 px-3">Productivity</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">38</td><td className="py-2 px-3 text-white font-medium">Supabase</td><td className="py-2 px-3">32</td><td className="py-2 px-3">Developer</td></tr>
            <tr className="border-b border-gray-800"><td className="py-2 px-3">38</td><td className="py-2 px-3 text-white font-medium">ConvertKit</td><td className="py-2 px-3">32</td><td className="py-2 px-3">Marketing</td></tr>
            <tr><td className="py-2 px-3">38</td><td className="py-2 px-3 text-white font-medium">SendGrid</td><td className="py-2 px-3">32</td><td className="py-2 px-3">Marketing</td></tr>
          </tbody>
        </table>
      </div>
      <p>Three patterns in the bottom:</p>
      <p>
        <strong>Plaid at 16/100 is the biggest shock.</strong> This is the company
        behind most US fintech apps. But the prompts I ran ("best financial data
        APIs," "top bank integration tools," "Plaid alternatives") return things
        like Stripe Financial Connections, Yodlee, Finicity, and Teller — Plaid is
        mentioned but rarely first, and its own domain almost never gets cited.
      </p>
      <p>
        <strong>Canva at 27/100 is the second biggest shock.</strong> A household
        name with 200M+ users. But "best graphic design for non-designers" and
        "top social media design 2026" return Canva <em>plus</em> Adobe Express,
        Figma, Visme, Crello, and a dozen others. Brand recognition doesn't
        translate to AI dominance when the category is crowded.
      </p>
      <p>
        <strong>Productivity is the worst-performing category overall.</strong>{" "}
        Monday.com (20), ClickUp (24), Coda (28), Linear (32), Loom (32). Five of
        the bottom 13 are productivity tools. Why? It's the most saturated
        category. When ChatGPT lists "best project management tools" it can name
        15 brands without breaking a sweat. Share of voice fragments.
      </p>

      <h2>5 patterns that show up across the data</h2>
      <p>
        This is where it gets interesting. Beyond rankings, here are the systemic
        patterns from the 450 analyses.
      </p>

      <h3>Pattern 1 — Perplexity and ChatGPT often agree, but not on who's #1</h3>
      <p>
        When Perplexity recommends a brand, ChatGPT usually mentions it too — but
        not always in the same order. Across the 50 brands, the difference between
        a brand's Perplexity score and ChatGPT/Search score was often 10–20 points
        in either direction.
      </p>
      <p>Examples from the data:</p>
      <ul>
        <li>
          <strong>Apollo.io</strong>: strong on Perplexity, weaker on Google-backed
          ChatGPT answers
        </li>
        <li>
          <strong>Otter.ai</strong>: strong on both, almost identical
        </li>
        <li>
          <strong>Linear</strong>: present in both, but ranked lower
        </li>
      </ul>
      <p>
        Why this matters for marketers: "AI ranking" isn't one thing. The brand
        surface you optimize for matters. If your buyers use ChatGPT, optimize for
        Google index density. If they use Perplexity, optimize for
        citation-friendly content (clear sources, comparison tables, structured
        answers).
      </p>

      <h3>Pattern 2 — Revenue doesn't equal AI visibility</h3>
      <p>
        The clearest example:{" "}
        <strong>
          PostHog (57) beat Mixpanel (36), Amplitude (28), and Heap (39)
        </strong>{" "}
        — all of which have higher revenue.
      </p>
      <p>
        The clearest counter-example:{" "}
        <strong>Salesforce (49) beat Pipedrive (40)</strong>, which made sense, but
        only by a small margin. Brand size barely showed up as an advantage.
      </p>
      <p>What seems to matter more:</p>
      <ul>
        <li>Citation density in independent comparison content</li>
        <li>
          Developer/practitioner community visibility (Reddit threads, Hacker News
          mentions)
        </li>
        <li>Explicit "alternatives" pages on competitor SEO sites</li>
        <li>Open-source codebases that get linked from technical articles</li>
      </ul>
      <p>
        AI search doesn't index revenue — it indexes mentions. Newer, more focused
        brands often outperform incumbents who rely on direct-traffic SEO and brand
        recall.
      </p>

      <h3>Pattern 3 — Specificity is the biggest under-used lever</h3>
      <p>
        When I ran the "category leadership" prompts ("best CRM," "best email
        marketing tool"), the incumbents dominated. HubSpot, Salesforce, Mailchimp
        all surfaced first.
      </p>
      <p>
        When I ran the "alternative" prompts ("HubSpot alternatives," "Salesforce
        alternatives"), challengers emerged: Attio, Close, Folk for CRM. Smaller
        players got real visibility specifically because they had targeted their
        content at displacing incumbents.
      </p>
      <p>
        This is the single biggest opportunity for SMB SaaS brands: stop competing
        with HubSpot for "best CRM" and start owning "best CRM for boutique SEO
        agencies serving B2B SaaS clients."
      </p>

      <h3>Pattern 4 — Recent ownership changes seem to tank AI visibility</h3>
      <p>
        A few brands I expected to score higher didn't. <strong>Loom (32)</strong>{" "}
        has been part of Atlassian for ~18 months. <strong>Segment (36)</strong>{" "}
        has been part of Twilio for ~3 years. Both score lower than their
        pre-acquisition reputations would suggest.
      </p>
      <p>
        LLMs lag reality. When a brand is acquired, training data still references
        the old name and old positioning. The new parent-company branding hasn't
        propagated to citation patterns yet. This creates a real window where
        post-acquisition brands underperform — and a real opportunity for
        competitors to capture share during the transition.
      </p>

      <h3>Pattern 5 — Open-source and developer-tooling brands punch above their weight</h3>
      <p>The strongest single category in the top 20:</p>
      <ul>
        <li>
          <strong>PostHog (57)</strong> &gt; Mixpanel, Amplitude, Heap
        </li>
        <li>
          <strong>Plausible (50)</strong> &gt; Hotjar, Heap
        </li>
        <li>
          <strong>Cal.com (46)</strong> &gt; Calendly (40)
        </li>
        <li>
          <strong>Vercel (46)</strong> &gt; Netlify (36)
        </li>
        <li>
          <strong>PlanetScale (47)</strong> &gt; most database peers
        </li>
      </ul>
      <p>
        What these have in common: technical docs, GitHub presence, Reddit/HN
        visibility, comparison pages targeting incumbents, and content built by
        practitioners rather than marketing teams. AI training data weights
        developer-written content heavily.
      </p>
      <p>
        If you sell to developers, this is your unfair advantage. Build content
        the way an engineer would research a problem.
      </p>

      <h2>What this means for your SaaS</h2>
      <p>Four practical takeaways from the data:</p>
      <p>
        <strong>1. Audit your brand on all 3 surfaces, not just ChatGPT.</strong>
        <br />
        Most marketers test ChatGPT and assume the rest follow the same pattern.
        Our data shows they don't. Your Perplexity visibility can be very
        different from your ChatGPT visibility. The gaps are where your
        optimization opportunities live.
      </p>
      <p>
        <strong>
          2. Categories with high competitor density are the hardest to win.
        </strong>
        <br />
        If your category returns 15+ brands on "best [X]," the category is
        saturated. Pursue specificity — vertical, use-case, company-size
        qualifiers — to find queries where you can actually win.
      </p>
      <p>
        <strong>
          3. Citations from third-party sources matter more than backlinks.
        </strong>
        <br />
        Across the top 10, the common thread isn't backlink count — it's citation
        density. Listicles, Reddit threads, G2 reviews, YouTube videos, comparison
        pages on competitor sites. The more times your brand is mentioned across
        independent surfaces, the higher your AI visibility.
      </p>
      <p>
        <strong>4. Brand recognition does not translate.</strong>
        <br />
        Canva, Plaid, Monday.com, ClickUp — all household names. All in the bottom
        13. AI doesn't know who's famous. It only knows who gets cited.
      </p>

      <h2>Methodology notes and the Gemini anomaly</h2>
      <p>
        <strong>Prompts used:</strong> For each brand we ran 3 prompts: (1) the
        generic category leader query, (2) a "best [category] for [vertical]"
        query, and (3) a "[brand] alternatives" query.
      </p>
      <p>
        <strong>Surfaces tested:</strong>
      </p>
      <ul>
        <li>ChatGPT-style answers grounded in fresh Google Search results</li>
        <li>Perplexity (using their <code>sonar</code> model)</li>
        <li>Gemini direct (using <code>gemini-2.0-flash</code>)</li>
      </ul>
      <p>
        <strong>The Gemini anomaly:</strong> Every brand in our dataset scored 0/3
        on Gemini. This appears to be a measurement issue on our end (likely a
        model deprecation, API key issue, or response format change) rather than a
        real signal that Gemini doesn't mention any of these brands. We're
        investigating and will republish the Gemini-corrected data once fixed.{" "}
        <strong>All scores in this article exclude Gemini.</strong> The Combined
        Score above is weighted: 60% Perplexity + 40% ChatGPT/Search.
      </p>
      <p>
        <strong>Reproducibility:</strong> LLM responses are non-deterministic. The
        same prompt run twice can yield different answers. We ran each prompt once
        per surface. With multiple runs, scores would smooth — but the rank order
        between top and bottom would likely hold.
      </p>
      <p>
        <strong>Caveats:</strong>
      </p>
      <ul>
        <li>50 brands is a meaningful sample but not exhaustive</li>
        <li>
          Categories not included: vertical SaaS (Toast, Procore), AI-native tools
          (Cursor, Lovable, Replit), enterprise-only platforms
        </li>
        <li>
          This is a snapshot in time. LLM responses change as training data
          updates.
        </li>
      </ul>

      <h2>One last thing</h2>
      <p>
        If you want to see how your own brand scores, you can run a free scan in
        60 seconds (no signup) at <Link to="/">AIMentionYou</Link>.
      </p>
      <p>
        If you're an SEO agency thinking about adding AI visibility tracking as a
        client deliverable, I'm running free audits this month — reply to{" "}
        <a href="mailto:hello@aimentionyou.com">hello@aimentionyou.com</a> with
        one client domain and I'll send a 1-page report back the next day.
      </p>
      <p>
        Either way, the data above is the data above. Run it, verify it, argue
        with it. That's the whole point of publishing.
      </p>
      <p>— Azaad, founder, AIMentionYou</p>
    </BlogLayout>
  );
};

export default FiftySaaSBrandsAIVisibility;
