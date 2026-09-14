import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const RESEND_API = 'https://api.resend.com';
const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// Each email starts with a result the reader wants, then gives them one
// evidence-led action. Outcomes are goals, never guarantees or invented proof.
const TOPICS = [
  { outcome: 'Earn your first AI recommendation', evidence: 'Find one buyer prompt where another brand is recommended and your brand is absent.', action: 'Open Prompt Intelligence, choose one missed prompt, and create the answer or comparison page supported by its cited evidence.', cta: 'Find my first opportunity', path: '/dashboard?tab=prompt-intelligence' },
  { outcome: 'Replace a competitor in one high-intent answer', evidence: 'Use Brands AI Recommends Instead to see which rival appears most often and the sources supporting it.', action: 'Choose the rival with the strongest evidence, study the exact cited pages, and publish a clearer answer for the same buyer decision.', cta: 'See who is beating me', path: '/dashboard?tab=competitors' },
  { outcome: 'Get cited by a source AI already trusts', evidence: 'Citation Intelligence shows the publications, directories, and review sites appearing in answers in your market.', action: 'Pick one relevant missing source and pursue a listing, review, contribution, or mention there before chasing lower-value links.', cta: 'Find a trusted source', path: '/dashboard?tab=citations' },
  { outcome: 'Turn a zero score into a measurable first signal', evidence: 'A zero means the tested engines did not mention or cite the brand for the scanned prompts; it is a baseline, not a verdict.', action: 'Choose the narrowest buyer prompt, complete its highest-priority recommendation, then rescan after the new page is discoverable.', cta: 'Choose my first fix', path: '/dashboard?tab=recommendations' },
  { outcome: 'Win a comparison prompt buyers use before purchasing', evidence: 'Prompt results reveal the brands named for “best,” “alternative,” and “versus” questions.', action: 'Create one honest comparison page that states who each option suits, includes verifiable facts, and answers the decision directly.', cta: 'Find a comparison gap', path: '/dashboard?tab=prompt-intelligence' },
  { outcome: 'Give AI a clear answer it can quote', evidence: 'Prompt Diagnostics shows the question, current answer, cited pages, and the content format that is missing.', action: 'Put a direct two-sentence answer near the top of the relevant page, then support it with proof, examples, and clear headings.', cta: 'Open Prompt Diagnostics', path: '/dashboard?tab=prompt-intelligence' },
  { outcome: 'Recover a visibility drop before it becomes a trend', evidence: 'Scan History separates a single noisy result from repeated declines across prompts and engines.', action: 'Compare the latest scan with the previous one, identify the lost prompt, and check which brand or source replaced you.', cta: 'Review my score trend', path: '/dashboard?tab=overview' },
  { outcome: 'Become easier for ChatGPT, Claude, Gemini, and Perplexity to understand', evidence: 'The readiness audit identifies unclear pages and missing machine-readable business information.', action: 'Fix the highest-impact blocker first, then make your product, audience, proof, and key pages unambiguous.', cta: 'Check my site readiness', path: '/tools/llm-readiness-score' },
  { outcome: 'Build the page most likely to improve your next scan', evidence: 'Recommendations are ranked from your scan findings, competitor evidence, and current visibility gaps.', action: 'Complete the top evidence-backed recommendation rather than spreading effort across several generic content ideas.', cta: 'Show my best next action', path: '/dashboard?tab=recommendations' },
  { outcome: 'Own one narrow category before chasing broad visibility', evidence: 'Industry Benchmark shows where your brand trails the market and where the gap is small enough to attack.', action: 'Choose one specific use case, audience, or location where your proof is strongest and build a focused answer around it.', cta: 'Find my winnable category', path: '/dashboard?tab=benchmark' },
  { outcome: 'Turn AI visibility into qualified website visits', evidence: 'A mention creates awareness; a useful cited page gives the buyer a reason and path to visit.', action: 'Make the page behind each citation satisfy the next buying question and include one clear, relevant next step.', cta: 'Inspect my cited pages', path: '/dashboard?tab=citations' },
  { outcome: 'Stop creating content that no buyer prompt needs', evidence: 'Suggested Prompts and Prompt Intelligence connect content ideas to real questions and observed market patterns.', action: 'Select one prompt with buying intent and visible competitor activity, then create the single page needed to answer it completely.', cta: 'Find evidence-backed ideas', path: '/dashboard?tab=prompt-intelligence' },
  { outcome: 'Correct an inaccurate AI description of your brand', evidence: 'Brand monitoring exposes answers that mention the brand with incomplete or incorrect details.', action: 'Trace the claim to its likely source, correct the source page, and state the accurate fact consistently on your own site.', cta: 'Check how AI describes me', path: '/dashboard?tab=competitors' },
  { outcome: 'Build proof that supports a content budget', evidence: 'Scan history, citations, competitor appearances, and completed recommendations show what changed and what remains missing.', action: 'Export the evidence, connect each proposed page to a missed buyer prompt, and prioritize work by expected business relevance.', cta: 'Open my evidence', path: '/dashboard?tab=overview' },
  { outcome: 'Make progress without chasing a vanity number', evidence: 'A visibility score summarizes results, but prompt-level wins reveal which buying conversations the brand has entered.', action: 'Track new mentions, new citations, and competitor replacements by prompt before focusing on the overall score.', cta: 'See prompt-level wins', path: '/dashboard?tab=prompt-intelligence' },
];

async function generateTip(topic: { outcome: string; evidence: string; action: string; cta: string; path: string }, apiKey: string): Promise<{ subject: string; html: string; snippet: string }> {
  const sys = `You are an experienced growth adviser writing for founders and marketers. AI Mention You tests whether ChatGPT, Gemini, Claude and Perplexity recommend or cite a brand. Write a concise daily outcome brief of 150-220 words.

Lead with the business result, not a product feature. Explain why the result matters, what evidence the reader should inspect, and the first practical action to take. Use familiar language and short paragraphs. Sound human, specific and useful; no technical jargon, hype, emojis, or feature list.

Accuracy rules: never promise a #1 ranking, traffic, leads, revenue, a percentage lift, or a deadline. Never invent a customer, case study, page count, scan count, quote, or result. Do not claim the outcome is guaranteed. Distinguish a goal from an achieved result. Only use the evidence supplied below.

Return STRICT JSON: {"subject":"<max 60 chars, outcome-first and curiosity-driven>","body_html":"<inner HTML only: a strong opening <p>, 2-3 short <p>, and optionally one <ul> of practical steps. Do not add a button, heading, <html>, <body>, inline styles, or an unsubscribe link. End by telling the reader what they will learn or decide after taking the action.>"}`;
  const user = `Today's desired outcome: ${topic.outcome}
Evidence available inside the product: ${topic.evidence}
First action: ${topic.action}

Write the email around the outcome. Treat it as a practical goal, not a promised result. The button below the email will say “${topic.cta}”, so do not repeat that exact call to action.`;

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

function renderEmail(subject: string, innerHtml: string, cta: string, path: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;border-bottom:1px solid #1f1f1f;">
          <div style="font-family:'Courier New',monospace;color:#facc15;font-size:14px;font-weight:700;letter-spacing:2px;">AI MENTION YOU</div>
          <div style="color:#888;font-size:12px;margin-top:4px;">Your Daily Growth Brief</div>
        </td></tr>
        <tr><td style="padding:24px 32px;color:#e5e5e5;font-size:15px;line-height:1.65;">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #1f1f1f;">
          <a href="https://aimentionyou.com${path}" style="display:inline-block;background:#facc15;color:#000;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;font-size:14px;">${cta} →</a>
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
    await admin.from('newsletter_log').insert({ send_date: today, subject: topic.outcome, status: 'failed', error: `AI generation: ${(e as Error).message}` });
    return new Response(JSON.stringify({ error: 'AI generation failed', detail: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const html = renderEmail(subject, innerHtml, topic.cta, topic.path);

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
      name: `Daily Growth Brief ${today}`,
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

  return new Response(JSON.stringify({ sent: true, broadcast_id: broadcastId, subject, outcome: topic.outcome }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
