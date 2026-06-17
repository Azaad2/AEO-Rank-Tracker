import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacToken(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title} · AI Mention You</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#000;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:40px;max-width:480px;text-align:center}
  h1{font-family:'Press Start 2P',cursive;color:#facc15;font-size:18px;margin:0 0 16px}
  p{color:#d1d5db;line-height:1.6;margin:0 0 12px;font-size:14px}
  a{color:#facc15;text-decoration:none}
</style></head><body><div class="card"><h1>${title}</h1>${body}<p style="margin-top:24px"><a href="https://aimentionyou.com">← aimentionyou.com</a></p></div></body></html>`;
  return new Response(html, { status, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    return page('Configuration error', '<p>Unsubscribe is temporarily unavailable. Email hello@aimentionyou.com.</p>', 500);
  }

  const url = new URL(req.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
  const token = (url.searchParams.get('token') ?? '').trim();

  if (!email || !token) {
    return page('Invalid link', '<p>This unsubscribe link is missing required parameters.</p>', 400);
  }

  const expected = await hmacToken(email, RESEND_API_KEY);
  if (expected !== token) {
    return page('Invalid link', '<p>This unsubscribe link is invalid or has expired.</p>', 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Mark unsubscribed in DB
  const { data: profile } = await admin
    .from('profiles')
    .select('id, resend_contact_id')
    .eq('email', email)
    .maybeSingle();

  if (profile) {
    await admin.from('profiles')
      .update({ marketing_unsubscribed_at: new Date().toISOString() })
      .eq('id', profile.id);
  }

  // Patch Resend
  const contactId = profile?.resend_contact_id;
  if (contactId) {
    await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unsubscribed: true }),
    }).catch(() => {});
  } else {
    // Fallback: PATCH by email
    await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unsubscribed: true }),
    }).catch(() => {});
  }

  return page(
    'Unsubscribed',
    `<p>You've been removed from AI Mention You marketing emails.</p><p style="color:#9ca3af;font-size:12px">${email}</p><p>Changed your mind? Email hello@aimentionyou.com.</p>`,
  );
});
