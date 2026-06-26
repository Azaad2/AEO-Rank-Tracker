import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const RESEND_API = 'https://api.resend.com';
const AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const TOPICS = [
  'schema markup for AI answer engines',
  'optimizing FAQ pages for ChatGPT citations',
  'tracking brand mentions in Perplexity',
  'building topical authority for AI search',
  'why Google AI Overviews ignore your brand',
  'getting cited by Claude and Copilot',
  'competitor benchmarking in AI search',
  'GEO vs SEO: where to invest in 2026',
  'using Reddit threads to win AI citations',
  'structured data that AI crawlers actually read',
  'long-tail prompt research for AI visibility',
  'content gaps that hurt AI rankings',
  'fixing AI hallucinations about your brand',
  'listicle placements that drive AI mentions',
  'review pages and AI recommendation engines',
  'how AI ranks SaaS tools today',
  'monitoring AI answer drift weekly',
  'turning support docs into AI training data',
  'press mentions and AI authority signals',
  'comparison pages that AI loves to cite',
  'why your homepage is invisible to LLMs',
  'using llms.txt to guide AI crawlers',
  'directory listings that boost AI visibility',
  'AI prompt patterns customers actually use',
  'category page optimization for AI search',
  'speed wins: AI crawl budget hygiene',
  'social proof signals AI engines weigh',
  'forum threads as AI citation goldmines',
  'measuring share-of-voice in AI answers',
  'first-mover advantage in AI search verticals',
];

async function generateTip(topic: string, apiKey: string): Promise<{ subject: string; html: string; snippet: string }> {
  const sys = `You are a senior AI search optimization strategist for SaaS founders and agencies. Write a punchy daily newsletter tip (150-220 words) about AI search visibility (GEO). Tone: confident, practical, no fluff, no emojis. Return STRICT JSON: {"subject": "<email subject line, max 60 chars, curiosity-driven, no clickbait>", "body_html": "<inner HTML: 1 short opening line, 2-3 short paragraphs in <p>, optionally one <ul> with 2-3 <li>. No <html>, <body>, or inline styles.>"}`;
  const user = `Today's topic: ${topic}. Write the tip. End with a 1-sentence actionable next step.`;

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
    await admin.from('newsletter_log').insert({ send_date: today, subject: topic, status: 'failed', error: `AI generation: ${(e as Error).message}` });
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

  return new Response(JSON.stringify({ sent: true, broadcast_id: broadcastId, subject, topic }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
