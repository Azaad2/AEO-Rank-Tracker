import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const RESEND_API = 'https://api.resend.com';
const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// Product features & metrics inside AI Mention You — each email explains
// ONE feature/metric, what it measures, and how users act on it to fix
// their AI visibility. No generic GEO tips.
const TOPICS = [
  { feature: 'AI Visibility Score', what: 'Composite 0–100 score weighted Gemini 60%, Perplexity 20%, Search 20%.', fix: 'How to raise the score by targeting the lowest-weighted engine first.' },
  { feature: 'Prompt Diagnostics', what: 'Per-prompt breakdown of who AI cites and why you were skipped.', fix: 'How to read the evidence panel and generate the missing asset (comparison, FAQ, review).' },
  { feature: 'Citation Intelligence', what: 'Which trusted domains AI pulls from to answer prompts in your category.', fix: 'How to prioritise the 3 highest-authority domains to get listed on this month.' },
  { feature: 'Industry Benchmark', what: 'Your visibility vs. the 34% category average and top competitors.', fix: 'How to use the gap number to pick your next content bet.' },
  { feature: 'Recommendation Intelligence', what: 'Ranked actions by projected visibility lift.', fix: 'How to sequence the top 3 recommendations for the fastest score jump.' },
  { feature: 'Competitor Watch', what: 'Which competitors AI mentions instead of you, per prompt.', fix: 'How to reverse-engineer their citation sources and beat them.' },
  { feature: 'Action Plan', what: 'Auto-generated optimisation tasks tied to scan findings.', fix: 'How to work the plan top-down and mark wins.' },
  { feature: 'Auto-Fix (Content & Schema)', what: 'One-click generation of FAQ schema, comparison pages, and meta.', fix: 'How to deploy an auto-fix asset in under 10 minutes.' },
  { feature: 'Ranking Opportunities', what: 'Prompts where you nearly ranked and can win with small edits.', fix: 'How to pick the highest-intent near-miss prompts first.' },
  { feature: 'Scan History & Score Trend', what: 'Weekly movement of your visibility score.', fix: 'How to spot AI answer drift before it costs traffic.' },
  { feature: 'Saved Domains & Daily Monitoring', what: 'Automated 2AM UTC scans of every saved domain.', fix: 'How to set alerts so you catch drops within 24 hours.' },
  { feature: 'AI Assistant', what: 'Chat that answers "why am I invisible for X prompt?" using your scan data.', fix: 'How to ask it to draft the exact content asset you are missing.' },
  { feature: 'Suggested Prompts', what: 'AI-generated prompts your buyers actually type into ChatGPT/Perplexity.', fix: 'How to add 5 new tracked prompts a week to widen coverage.' },
  { feature: 'LLM Readiness Score', what: 'How ingestible your site is to LLM crawlers.', fix: 'How to fix the 3 crawlability blockers most sites fail on.' },
  { feature: 'llms.txt Generator', what: 'The file that guides AI crawlers to your best content.', fix: 'How to ship a working llms.txt in 5 minutes.' },
  { feature: 'Schema Generator', what: 'JSON-LD builder for FAQ, Product, Organization schemas.', fix: 'How to pick the ONE schema type that unlocks AI citations for your category.' },
  { feature: 'FAQ Generator', what: 'Extracts real buyer questions and formats them for AI ingestion.', fix: 'How to place FAQ blocks so AI actually cites them.' },
  { feature: 'Comparison Page Builder', what: 'Head-to-head pages AI loves to cite in "X vs Y" prompts.', fix: 'How to structure a comparison so Perplexity picks it up.' },
  { feature: 'Content Auditor', what: 'Scores existing pages for AI ingestibility.', fix: 'How to rewrite the lowest-scoring page for a 20+ point lift.' },
  { feature: 'Keyword Analyzer (AI intent)', what: 'Maps keywords to AI prompt patterns.', fix: 'How to shift a keyword page into an AI-answerable format.' },
  { feature: 'Brand Monitor', what: 'Tracks mentions & hallucinations about your brand across LLMs.', fix: 'How to correct a hallucinated fact at the source.' },
  { feature: 'ChatGPT / Claude / Copilot / Perplexity Rank Trackers', what: 'Per-engine visibility position over time.', fix: 'How to read the per-engine tabs and pick which engine to fight for first.' },
  { feature: 'AI Overviews Tracker', what: 'Whether Google AI Overviews cites you for target queries.', fix: 'How to earn an AI Overview citation with structured answers.' },
  { feature: 'Meta Optimizer', what: 'Rewrites title/description for AI-search click-through.', fix: 'How to A/B test one meta rewrite a week.' },
  { feature: 'SERP Previewer', what: 'Shows how your snippet renders in AI-augmented SERPs.', fix: 'How to compress your answer into the AI snippet window.' },
  { feature: 'Trusted Sources panel', what: 'Ranked list of domains AI trusts in your niche.', fix: 'How to earn a listing on the top-3 trusted domains.' },
  { feature: 'Biggest Opportunity card', what: 'The single action with the highest projected score lift.', fix: 'How to ship the Biggest Opportunity this week.' },
  { feature: 'Credit Usage & Scan Limits', what: 'How scans and prompts are metered per tier.', fix: 'How to prioritise which domains to scan when credits are tight.' },
  { feature: 'CSV Export & Premium PDF Report', what: 'Shareable evidence pack for stakeholders.', fix: 'How to use the PDF to justify next month\'s content budget.' },
  { feature: 'Onboarding Checklist', what: 'Guided path from first scan to first fix.', fix: 'How to finish onboarding in under 30 minutes and see your first score gain.' },
];

async function generateTip(topic: { feature: string; what: string; fix: string }, apiKey: string): Promise<{ subject: string; html: string; snippet: string }> {
  const sys = `You are the product educator for AI Mention You, a tool that helps SaaS founders and agencies get cited by ChatGPT, Perplexity, Claude, Copilot and Google AI Overviews. Write a daily product email (150-220 words) that teaches ONE feature/metric of the product and shows exactly how it helps the user FIX their AI visibility. Tone: confident, practical, product-specific, no fluff, no emojis. Never invent features. Return STRICT JSON: {"subject": "<max 60 chars, feature-first, e.g. 'How your AI Visibility Score really works'>", "body_html": "<inner HTML: 1 opening line naming the feature, 1-2 short <p> explaining WHAT the metric measures, 1 <p> or <ul> with 2-3 <li> showing HOW to act on it inside the dashboard, closing line with the one next step. No <html>, <body>, no inline styles.>"}`;
  const user = `Today's feature: ${topic.feature}
What it measures: ${topic.what}
How users fix visibility with it: ${topic.fix}

Write the email. Reference the feature by its exact name. End with a 1-sentence next step that tells the user which tab/page to open in AI Mention You.`;

  const res = await fetch(AI_GATEWAY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const j = await res.json();
  const content: string = j.choices?.[0]?.message?.content ?? '{}';
  const parsed = extractJson(content);
  const subject = String(parsed.subject || 'Your daily AI visibility tip').slice(0, 80);
  const body_html = String(parsed.body_html || parsed.html || '<p>Check your AI visibility today.</p>');
  const snippet = body_html.replace(/<[^>]+>/g, '').slice(0, 280);
  return { subject, html: body_html, snippet };
}

// Robustly extract a JSON object from model output that may include code fences,
// prose before/after, or multiple JSON-looking blocks.
function extractJson(raw: string): Record<string, unknown> {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in model output');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const slice = cleaned.slice(start, i + 1);
        return JSON.parse(slice);
      }
    }
  }
  throw new Error('Unbalanced JSON in model output');
}

function renderEmail(subject: string, innerHtml: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;border-bottom:1px solid #1f1f1f;">
          <div style="font-family:'Courier New',monospace;color:#facc15;font-size:14px;font-weight:700;letter-spacing:2px;">AI MENTION YOU</div>
          <div style="color:#888;font-size:12px;margin-top:4px;">Daily AI Visibility Tip</div>
        </td></tr>
        <tr><td style="padding:24px 32px;color:#e5e5e5;font-size:15px;line-height:1.65;">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #1f1f1f;">
          <a href="https://aimentionyou.com/dashboard" style="display:inline-block;background:#facc15;color:#000;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;font-size:14px;">Run a scan →</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;background:#0a0a0a;color:#666;font-size:11px;line-height:1.5;text-align:center;">
          You're receiving this because you signed up at aimentionyou.com.<br>
          <a href="https://aimentionyou.com" style="color:#888;">aimentionyou.com</a> ·
          {{{RESEND_UNSUBSCRIBE_URL}}}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID || !LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'Missing required secrets' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auth: service-role (cron/admin) OR logged-in admin user
  const authHeader = req.headers.get('Authorization') ?? '';
  const bearer = authHeader.replace('Bearer ', '');
  const cronSecret = req.headers.get('x-cron-secret') ?? '';
  const isServiceCall = bearer === SERVICE_KEY || cronSecret === SERVICE_KEY;

  if (!isServiceCall) {
    if (!bearer) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(bearer);
    if (!claims?.claims?.sub) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: claims.claims.sub, _role: 'admin' });
    if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  // Idempotency: skip if already sent today
  const { data: existing } = await admin
    .from('newsletter_log')
    .select('id, broadcast_id')
    .eq('send_date', today)
    .eq('status', 'sent')
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ skipped: true, reason: 'already_sent_today', broadcast_id: existing.broadcast_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Pick rotating topic by day-of-year
  const start = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 0));
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const topic = TOPICS[dayOfYear % TOPICS.length];

  let subject = '', innerHtml = '', snippet = '';
  try {
    const tip = await generateTip(topic, LOVABLE_API_KEY);
    subject = tip.subject;
    innerHtml = tip.html;
    snippet = tip.snippet;
  } catch (e) {
    await admin.from('newsletter_log').insert({ send_date: today, subject: topic.feature, status: 'failed', error: `AI generation: ${(e as Error).message}` });
    return new Response(JSON.stringify({ error: 'AI generation failed', detail: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const html = renderEmail(subject, innerHtml);

  // Create broadcast
  const createRes = await fetch(`${RESEND_API}/broadcasts`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audience_id: RESEND_AUDIENCE_ID,
      from: 'AI Mention You <hello@aimentionyou.com>',
      subject,
      html,
      reply_to: 'hello@aimentionyou.com',
      name: `Daily Tip ${today}`,
    }),
  });
  const createJson = await createRes.json();
  if (!createRes.ok) {
    await admin.from('newsletter_log').insert({ send_date: today, subject, body_snippet: snippet, status: 'failed', error: `Create broadcast: ${createJson?.message ?? createRes.status}` });
    return new Response(JSON.stringify({ error: 'Create broadcast failed', detail: createJson }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const broadcastId = createJson.id;
  await admin.from('newsletter_log').insert({ send_date: today, subject, body_snippet: snippet, broadcast_id: broadcastId, status: 'created' });

  // Send broadcast
  const sendRes = await fetch(`${RESEND_API}/broadcasts/${broadcastId}/send`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!sendRes.ok) {
    const errJson = await sendRes.json().catch(() => ({}));
    await admin.from('newsletter_log').insert({ send_date: today, subject, body_snippet: snippet, broadcast_id: broadcastId, status: 'failed', error: `Send: ${errJson?.message ?? sendRes.status}` });
    return new Response(JSON.stringify({ error: 'Send broadcast failed', detail: errJson, broadcast_id: broadcastId }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  await admin.from('newsletter_log').insert({ send_date: today, subject, body_snippet: snippet, broadcast_id: broadcastId, status: 'sent' });

  return new Response(JSON.stringify({ sent: true, broadcast_id: broadcastId, subject, feature: topic.feature }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
