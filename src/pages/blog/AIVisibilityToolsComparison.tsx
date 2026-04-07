import BlogLayout from "@/components/blog/BlogLayout";
import { Link } from "react-router-dom";
import { Check, X, Zap, DollarSign, Code, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AIVisibilityToolsComparison = () => {
  const faqs = [
    {
      question: "What makes AImentionyou different from Semrush's AI toolkit?",
      answer: "AImentionyou tracks your brand across all four major AI platforms (ChatGPT, Perplexity, Claude, Gemini) with actionable optimisation recommendations included. Semrush's AI module is primarily focused on Google AI Overviews, with limited coverage of standalone AI platforms like ChatGPT and Perplexity. For teams that specifically need multi-LLM visibility data, AImentionyou provides materially broader tracking at a fraction of Semrush's cost.",
    },
    {
      question: "Is Peec AI worth its price for 25 prompts?",
      answer: "Peec AI covers eight LLMs and provides strong international coverage, which justifies its pricing for global teams with deep multi-model requirements. For most teams monitoring fewer than 50 prompts across standard markets, AImentionyou provides equivalent or better coverage of the four major LLMs at significantly lower cost, including a free tier for initial testing.",
    },
    {
      question: "Why is Profound so expensive at $399/month?",
      answer: "Profound targets enterprise teams that need petabyte-scale raw data exports and custom API integrations. For the 95% of businesses that don't have those enterprise-scale data infrastructure requirements, this pricing is excessive relative to the value delivered. Purpose-built tools like AImentionyou cover the core use case — tracking brand visibility across AI platforms — at a fraction of the cost.",
    },
    {
      question: "Can I really replace Semrush with AImentionyou for AI visibility?",
      answer: "For AI visibility tracking specifically, yes. AImentionyou is purpose-built for monitoring brand mentions across AI platforms, with actionable recommendations included. If you also need traditional SEO features like backlink analysis and keyword rank tracking, you'd use both tools — but for the AI visibility use case specifically, AImentionyou is more specialised and more affordable.",
    },
    {
      question: "What's the ROI of switching from expensive tools to AImentionyou?",
      answer: "Teams replacing Semrush ($129–250/mo) for AI visibility tracking save $1,320–2,760/year. Those replacing Profound ($399/mo) save $4,560/year. These savings assume the same core use case: monitoring brand visibility in AI-generated answers across the major platforms.",
    },
    {
      question: "How does AImentionyou track AI mentions across multiple platforms?",
      answer: "AImentionyou runs your target prompts against ChatGPT, Perplexity, Claude, and Gemini on a scheduled basis. For each prompt, it records whether your brand is mentioned, the context it appears in, the sentiment of the mention, and which competitors appear alongside or instead of you. Results are aggregated into a dashboard showing citation rate, share of voice, and trend data over time.",
    },
  ];

  const relatedPosts = [
    { title: "7 Best Online LLM Rank Trackers for AI Visibility in 2026", slug: "best-online-llm-rank-tracker", category: "AI Visibility" },
    { title: "GEO Optimization Guide: Mastering Generative Engine Optimization", slug: "geo-optimization-guide", category: "GEO" },
    { title: "What is AEO? Complete Guide to Answer Engine Optimization", slug: "what-is-answer-engine-optimization-aeo-guide", category: "AEO" },
  ];

  const tools = [
    { name: "AIMentionYou", price: "FREE / $19", highlight: true, bestFor: "Multi-LLM tracking + actionable recommendations", team: "Solo → Agencies" },
    { name: "Semrush AI Toolkit", price: "$129/mo", highlight: false, bestFor: "Google AI Overviews + full SEO suite", team: "Small/mid-market" },
    { name: "Semrush AIO", price: "$250+/mo", highlight: false, bestFor: "Enterprise SEO + AI automation", team: "Enterprise" },
    { name: "Peec AI", price: "$95+/mo", highlight: false, bestFor: "8-LLM coverage + international tracking", team: "Global marketing teams" },
    { name: "Profound", price: "$399/mo", highlight: false, bestFor: "Enterprise data exports + custom API", team: "Enterprise data teams" },
    { name: "Rankshift", price: "$300+/mo", highlight: false, bestFor: "GEO agency workflows", team: "Digital agencies" },
    { name: "Scrunch AI", price: "$100+/mo", highlight: false, bestFor: "AI crawler diagnostics", team: "Technical SEO teams" },
    { name: "Otterly AI", price: "$29/mo", highlight: false, bestFor: "Affordable entry-level monitoring", team: "Freelancers, small businesses" },
    { name: "Keyword.com AI", price: "$24.50/mo", highlight: false, bestFor: "Budget-friendly credit-based tracking", team: "Small teams" },
  ];

  return (
    <BlogLayout
      title="AI Visibility Tools 2026: Complete Comparison — AIMentionYou vs. Semrush, Peec AI, Profound and More"
      description="Side-by-side comparison of the top 9 AI visibility tools in 2026. Real pricing, feature breakdowns, and who each tool is actually built for. Find the right tool for your budget and use case."
      publishDate="January 19, 2026"
      readTime="16 min"
      category="AI Visibility"
      toolLink="/tools"
      toolName="Free AI Visibility Scan"
      faqs={faqs}
      relatedPosts={relatedPosts}
      author="Azaad Pandey - Founder @ AImentionyou"
    >
      <h2 id="introduction">AI Visibility Tools Are a New Category — Most Brands Are Using the Wrong One</h2>
      <p>
        Two years ago, "AI visibility" wasn't a product category. Today, there are more than 20 tools claiming to track how your brand appears in AI-generated search results. The problem: they vary enormously in what they actually measure, which AI platforms they cover, and whether they help you do anything about what they find.
      </p>
      <p>
        Some tools track Google AI Overviews only — missing the 2+ billion daily ChatGPT queries and Perplexity's 100+ million monthly users entirely. Others provide enterprise-grade data exports at enterprise prices that most teams can't justify. A few give you data with no guidance on what to do with it.
      </p>
      <p>
        This comparison covers the 9 most significant tools in the AI visibility category as of early 2026 — what each one actually does, who it's genuinely suited for, and the real pricing. We've evaluated each across a consistent set of use cases: monitoring brand mentions, tracking competitive share of voice, identifying optimisation opportunities, and scaling across multiple brands or clients.
      </p>

      <h2 id="market-context">Why AI Visibility Tracking Matters Now</h2>
      <ul>
        <li>ChatGPT handles <strong>over 2 billion daily queries</strong> — a volume comparable to Google's mid-2000s scale</li>
        <li>Google AI Overviews appear in <strong>~55% of all Google searches</strong>, sitting above organic results</li>
        <li>Perplexity grew from 10 million to <strong>100+ million monthly active users</strong> in 24 months</li>
        <li>AI-referred website traffic grew <strong>527% year-over-year</strong> through mid-2025 (Ahrefs/SimilarWeb)</li>
        <li>Gartner forecasts traditional search volume to drop <strong>25% by 2026</strong></li>
        <li>Traffic arriving via AI citations converts at <strong>3–5x the rate</strong> of typical organic search</li>
      </ul>
      <p>
        A brand can rank #1 on Google for its primary category keyword and be completely absent from ChatGPT or Perplexity recommendations. Traditional SEO tools (Ahrefs, Semrush, Google Search Console) don't measure AI citation rates — they can't. This is the market all 9 of these tools are trying to serve.
      </p>

      <h2 id="comparison-table">The 9 AI Visibility Tools: Full Comparison</h2>

      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-3 text-left font-semibold">Tool</th>
              <th className="border border-border p-3 text-left font-semibold">Starting Price</th>
              <th className="border border-border p-3 text-left font-semibold">LLMs Tracked</th>
              <th className="border border-border p-3 text-left font-semibold">Free Tier</th>
              <th className="border border-border p-3 text-left font-semibold">Actionable Recs?</th>
              <th className="border border-border p-3 text-left font-semibold">Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-primary/5">
              <td className="border border-border p-3 font-semibold">AIMentionYou ⭐</td>
              <td className="border border-border p-3">Free / $19/mo</td>
              <td className="border border-border p-3">ChatGPT, Perplexity, Claude, Gemini</td>
              <td className="border border-border p-3 text-green-600">Yes</td>
              <td className="border border-border p-3 text-green-600">Yes</td>
              <td className="border border-border p-3">Founders, agencies, lean teams</td>
            </tr>
            <tr>
              <td className="border border-border p-3">Semrush AI Toolkit</td>
              <td className="border border-border p-3">$129/mo</td>
              <td className="border border-border p-3">Google AI Overviews, some LLMs</td>
              <td className="border border-border p-3 text-red-500">No</td>
              <td className="border border-border p-3">Limited</td>
              <td className="border border-border p-3">Existing Semrush users</td>
            </tr>
            <tr className="bg-muted/30">
              <td className="border border-border p-3">Semrush AIO</td>
              <td className="border border-border p-3">$250+/mo</td>
              <td className="border border-border p-3">Google AI Overviews primarily</td>
              <td className="border border-border p-3 text-red-500">No</td>
              <td className="border border-border p-3">Limited</td>
              <td className="border border-border p-3">Enterprise teams on Semrush</td>
            </tr>
            <tr>
              <td className="border border-border p-3">Peec AI</td>
              <td className="border border-border p-3">$95+/mo</td>
              <td className="border border-border p-3">8 LLMs incl. Grok, Llama, DeepSeek</td>
              <td className="border border-border p-3 text-red-500">No</td>
              <td className="border border-border p-3 text-green-600">Yes</td>
              <td className="border border-border p-3">Global teams needing 8-LLM coverage</td>
            </tr>
            <tr className="bg-muted/30">
              <td className="border border-border p-3">Profound</td>
              <td className="border border-border p-3">$399/mo</td>
              <td className="border border-border p-3">Multiple LLMs</td>
              <td className="border border-border p-3 text-red-500">No</td>
              <td className="border border-border p-3">Partial</td>
              <td className="border border-border p-3">Enterprise data infrastructure teams</td>
            </tr>
            <tr>
              <td className="border border-border p-3">Rankshift</td>
              <td className="border border-border p-3">$300+/mo</td>
              <td className="border border-border p-3">ChatGPT, Gemini, Claude, Perplexity, Meta AI</td>
              <td className="border border-border p-3">Trial only</td>
              <td className="border border-border p-3 text-green-600">Yes</td>
              <td className="border border-border p-3">GEO-focused agencies</td>
            </tr>
            <tr className="bg-muted/30">
              <td className="border border-border p-3">Scrunch AI</td>
              <td className="border border-border p-3">$100+/mo</td>
              <td className="border border-border p-3">ChatGPT, Claude, Perplexity, Gemini, Meta AI</td>
              <td className="border border-border p-3">Demo only</td>
              <td className="border border-border p-3">Diagnostic focus</td>
              <td className="border border-border p-3">Technical SEO / crawler issues</td>
            </tr>
            <tr>
              <td className="border border-border p-3">Otterly AI</td>
              <td className="border border-border p-3">$29/mo</td>
              <td className="border border-border p-3">ChatGPT, Perplexity, Gemini, Claude</td>
              <td className="border border-border p-3">Trial</td>
              <td className="border border-border p-3">Partial</td>
              <td className="border border-border p-3">Freelancers, small businesses</td>
            </tr>
            <tr className="bg-muted/30">
              <td className="border border-border p-3">Keyword.com AI</td>
              <td className="border border-border p-3">$24.50/mo</td>
              <td className="border border-border p-3">ChatGPT, Perplexity, Gemini, Claude, DeepSeek</td>
              <td className="border border-border p-3">14-day trial</td>
              <td className="border border-border p-3">Limited</td>
              <td className="border border-border p-3">Budget-conscious teams</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="deep-dives">Deep-Dive: What Each Tool Actually Does</h2>

      <h3 id="aimentionyou">AIMentionYou — Best Overall for Founders and Agencies</h3>
      <p>
        AIMentionYou was built specifically for the multi-platform AI tracking use case. It monitors brand mentions across <strong>ChatGPT, Perplexity, Claude, and Gemini</strong> — the four platforms that together handle the overwhelming majority of AI search queries — and presents results in a single dashboard showing citation rate, sentiment, and competitive share of voice over time.
      </p>
      <p>
        The meaningful differentiator: AIMentionYou doesn't just show you data. After scanning your brand, it surfaces <strong>specific, actionable optimisation tasks</strong> — telling you exactly what to change to improve your citation rate on each platform. This transforms it from a monitoring dashboard into an active GEO optimisation system.
      </p>
      <p>
        Free guest scans are available without creating an account, making it easy to test before committing. The paid tier ($19/month) is accessible to solo founders and small agencies who can't justify $100–400/month for enterprise tools.
      </p>
      <ul>
        <li><strong>Best for:</strong> Founders, SEO agencies, and marketing teams wanting multi-LLM visibility with actionable guidance</li>
        <li><strong>LLMs tracked:</strong> ChatGPT, Perplexity, Claude, Gemini</li>
        <li><strong>Free tier:</strong> Yes — free guest scans, no credit card required</li>
        <li><strong>Starting price:</strong> Free / $19/month</li>
        <li><strong>Standout feature:</strong> Actionable optimisation recommendations alongside citation data</li>
      </ul>

      <h3 id="semrush">Semrush AI Toolkit — Best for Existing Semrush Users</h3>
      <p>
        Semrush has added AI visibility features to its platform, primarily focused on <strong>Google AI Overviews</strong>. For teams already paying for Semrush, this provides a convenient way to see how content performs in Google's AI layer without introducing a second tool.
      </p>
      <p>
        The limitation is coverage. Semrush's AI module is heavily Google-centric. If you need to understand how your brand appears in ChatGPT recommendations, Perplexity citations, or Claude responses — which together handle far more queries than Google AI Overviews for many B2B categories — you'll need a dedicated multi-LLM tool alongside it.
      </p>
      <p>
        <strong>When to choose:</strong> You're already paying for Semrush's traditional SEO features and want basic Google AI Overview data without adding a second tool. If standalone AI platform tracking is the primary goal, a dedicated tool provides better data at lower cost.
      </p>

      <h3 id="peec-ai">Peec AI — Best for 8-LLM Global Coverage</h3>
      <p>
        Peec AI covers more AI platforms than any other tool in this comparison — <strong>eight LLMs</strong> including ChatGPT, Gemini, Claude, Perplexity, Copilot, Grok, Llama, and DeepSeek — with unlimited country tracking. For global brands or agencies managing clients across markets where different AI platforms dominate, this breadth is genuinely valuable.
      </p>
      <p>
        Its Actions system provides optimisation recommendations alongside visibility data. Competitor benchmarking and source-type analysis (editorial vs. UGC vs. reference content) help teams understand not just where they rank in AI answers, but why.
      </p>
      <p>
        The drawback: no free tier, and pricing is positioned for professional teams. For brands whose customers primarily use the four major English-language platforms (ChatGPT, Perplexity, Claude, Gemini), Peec AI's additional LLM coverage may not justify the price premium.
      </p>

      <h3 id="profound">Profound — Best for Enterprise Data Infrastructure</h3>
      <p>
        Profound is the tool you choose when you need to export raw AI visibility data at scale, build custom integrations, and have a data infrastructure team to work with it. At $399/month, it targets enterprises that treat AI visibility as a data problem requiring custom pipelines — not a monitoring problem requiring a dashboard.
      </p>
      <p>
        For the 95% of brands that need to see their citation rate and get guidance on improving it, Profound's enterprise data capabilities are overkill. Its pricing reflects the enterprise sales motion (demos, contracts, onboarding) rather than self-serve product value.
      </p>

      <h3 id="rankshift">Rankshift — Best for GEO Agency Workflows</h3>
      <p>
        Rankshift is explicitly positioned for agencies running systematic GEO programmes for multiple clients. Its core strength is <strong>prompt-level visibility data</strong> — showing exactly which client prompts trigger brand mentions and which don't — alongside citation gap analysis that maps which sources AI systems trust for specific topic areas.
      </p>
      <p>
        At $300+/month, it's priced for agencies billing clients for AI visibility work and needing the reporting infrastructure to justify that billing. Less suited to in-house teams or solo founders who don't need multi-client workflow features.
      </p>

      <h3 id="scrunch-ai">Scrunch AI — Best for Technical Crawler Diagnostics</h3>
      <p>
        Scrunch AI's core value proposition is diagnosing <strong>why AI systems aren't citing your content</strong> — analysing how AI crawlers access and render your site, identifying technical barriers (render-blocking JavaScript, robots.txt misconfigurations, crawl budget issues) that prevent AI systems from seeing your content in the first place.
      </p>
      <p>
        If you've implemented content and schema improvements but your citation rate hasn't moved, Scrunch can diagnose whether a technical crawling issue is the root cause. It's a specialist diagnostic tool, best used alongside (not instead of) a citation monitoring tool.
      </p>

      <h2 id="differentiators">Why AIMentionYou: 5 Key Advantages</h2>

      <Card className="mb-6 border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            1. Multi-LLM Coverage at an Accessible Price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tracking all four major AI platforms (ChatGPT, Perplexity, Claude, Gemini) in a single tool at $19/month — versus $95–399/month for competing tools with equivalent or narrower coverage. For the vast majority of brands, these four platforms represent 95%+ of the AI queries their customers run.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            2. Actionable Recommendations, Not Just Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Most tools show you that your citation rate is 15%. AIMentionYou also tells you <em>why</em> it's 15% and what specific changes — restructure this section, add this schema type, build citations on these platforms — would move it to 35%. This moves the tool from a monitoring dashboard to an active optimisation system.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            3. A Free Tier That's Actually Useful
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Free guest scans let you immediately see how your brand appears across all four major AI platforms without creating an account or entering payment details. This is genuinely useful for initial assessment — not a crippled feature designed only to drive conversions.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Tool</th>
                  <th className="text-left py-2 font-semibold">Monthly Cost</th>
                  <th className="text-left py-2 font-semibold text-green-600">Annual Savings vs. AIMentionYou Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-2 font-medium">AIMentionYou Pro</td><td className="py-2 text-green-600 font-bold">$19/mo</td><td className="py-2">—</td></tr>
                <tr className="border-b"><td className="py-2">Semrush AI Toolkit</td><td className="py-2 text-red-500">$129/mo</td><td className="py-2 text-green-600">Save $1,320/yr</td></tr>
                <tr className="border-b"><td className="py-2">Peec AI</td><td className="py-2 text-red-500">$95/mo</td><td className="py-2 text-green-600">Save $912/yr</td></tr>
                <tr className="border-b"><td className="py-2">Rankshift</td><td className="py-2 text-red-500">$300+/mo</td><td className="py-2 text-green-600">Save $3,372+/yr</td></tr>
                <tr><td className="py-2">Profound</td><td className="py-2 text-red-500">$399/mo</td><td className="py-2 text-green-600">Save $4,560/yr</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            4. Built for Technical Users and Agencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            API access, CLI tools, and webhook integrations let technical founders and agencies integrate AI visibility data into their own workflows — whether that's a client reporting dashboard, a Slack alert for citation rate drops, or an automated weekly email summary. Enterprise tools charge significantly more for this kind of programmatic access.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            5. Free Optimisation Tools Paired with Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3">
            Beyond the tracking dashboard, AIMentionYou provides a suite of free tools that directly support GEO optimisation:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-1" /><span><Link to="/tools/schema-generator" className="text-primary hover:underline font-medium">Schema Generator</Link> — create FAQPage, Article, and Organization schema without writing code</span></li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-1" /><span><Link to="/tools/llm-readiness-score" className="text-primary hover:underline font-medium">LLM Readiness Score</Link> — assess how well your current content is positioned for AI citation</span></li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-1" /><span><Link to="/tools/content-auditor" className="text-primary hover:underline font-medium">Content Auditor</Link> — identify which pages are and aren't structured for AI extraction</span></li>
          </ul>
        </CardContent>
      </Card>

      <h2 id="who-should-choose">Decision Guide: Which Tool Is Right for You?</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <Check className="w-5 h-5" /> Choose AIMentionYou if...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>You need to track all four major AI platforms in one place</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>Budget is under $50/month</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>You want optimisation guidance, not just citation data</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>You're an agency managing 1–20 client brands</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>You want to test before committing (free scan available)</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> When to choose alternatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li><strong>Semrush AI Toolkit</strong> — if you already pay for Semrush and only need Google AI Overviews data</li>
              <li><strong>Peec AI</strong> — if you have global clients and need 8-LLM coverage including Grok, Llama, and DeepSeek</li>
              <li><strong>Rankshift</strong> — if you're an agency running formal GEO programmes with $300+/month client budgets</li>
              <li><strong>Profound</strong> — if you're an enterprise team with custom API and data pipeline requirements</li>
              <li><strong>Scrunch AI</strong> — if you suspect technical crawling issues are blocking AI from seeing your content</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <h2 id="action-plan">Getting Started: Your First 30 Days</h2>

      <div className="space-y-4 mb-8">
        <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
          <div>
            <p className="font-semibold">Week 1: Establish your baseline</p>
            <p className="text-sm text-muted-foreground">Run a free scan on AIMentionYou. Identify your current citation rate for your 10 most important category queries across ChatGPT, Perplexity, Claude, and Gemini. Note which competitors are appearing instead of you.</p>
            <Link to="/" className="text-sm text-primary hover:underline">Run your free scan →</Link>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
          <div>
            <p className="font-semibold">Week 2: Fix schema and content structure</p>
            <p className="text-sm text-muted-foreground">Use the Schema Generator to add FAQPage and Article schema to your top 5 pages. Restructure those pages so each section leads with a direct answer in the first 40–60 words.</p>
            <Link to="/tools/schema-generator" className="text-sm text-primary hover:underline">Open Schema Generator →</Link>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</div>
          <div>
            <p className="font-semibold">Weeks 3–4: Build third-party citations</p>
            <p className="text-sm text-muted-foreground">Identify the publications and platforms Perplexity and ChatGPT are already citing for your target queries. Pitch 3–5 of them for coverage. Submit to 2–3 relevant directories. Ensure your G2/Capterra profile is complete if you're a SaaS brand.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">4</div>
          <div>
            <p className="font-semibold text-green-700">Week 5+: Weekly monitoring and iteration</p>
            <p className="text-sm text-green-600">Set up weekly citation rate tracking. Track your citation rate trend over the next 8 weeks. Identify which interventions moved the needle. Double down on what's working.</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
        <h3 className="text-xl font-bold mb-2">See Where Your Brand Stands in AI Search Today</h3>
        <p className="text-muted-foreground mb-4">
          Run a free scan across ChatGPT, Perplexity, Claude, and Gemini. No account required. Results in 2 minutes.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/">Run Free AI Visibility Scan <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/tools/schema-generator">Open Schema Generator</Link>
          </Button>
        </div>
      </div>
    </BlogLayout>
  );
};

export default AIVisibilityToolsComparison;
