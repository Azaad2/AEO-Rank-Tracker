import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { ImapFlow } from 'npm:imapflow@2.0.2';
import PostalMime from 'npm:postal-mime@2.4.3';
import { z } from 'npm:zod@3.25.76';

const RESEND_API = 'https://api.resend.com';
const BodySchema = z.object({ days: z.number().int().min(1).max(30).optional() }).strict();
const AUTOMATED_LOCAL_PARTS = /^(?:no-?reply|do-?not-?reply|mailer-daemon|postmaster|notifications?|alerts?|support|billing|receipts?|newsletters?|updates?|hello)$/i;
const CLEAR_SALES_PITCH = /\b(?:i|we)\s+(?:can|could|would like to|want to|help(?:ed|ing)?\s+(?:businesses|brands|companies)?\s*(?:like yours)?\s*to)\s+(?:help|offer|provide|grow|improve|increase|build|manage|optimi[sz]e|redesign|promote)\b/i;
const SALES_INTENT_SIGNALS = [
  /\b(?:our|my)\s+(?:services?|agency|team|solution|offer)\b/i,
  /\b(?:free|complimentary)\s+(?:audit|consultation|analysis|proposal)\b/i,
  /\b(?:seo|content marketing|web design|development|lead generation|link building|guest post|paid ads?|social media)\s+services?\b/i,
  /\b(?:book|schedule|arrange|jump on)\s+(?:a\s+)?(?:quick\s+)?(?:call|meeting|demo)\b/i,
  /\b(?:partnership|collaboration|proposal|business opportunity)\b/i,
  /\b(?:increase|grow|improve|boost)\s+(?:your\s+)?(?:traffic|sales|leads|revenue|rankings?|visibility|conversions?)\b/i,
];

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isHumanExternalAddress(email: string): boolean {
  const [local, domain] = email.split('@');
  return Boolean(local && domain && domain.includes('.') && domain !== 'aimentionyou.com' && !AUTOMATED_LOCAL_PARTS.test(local));
}

function isServicePitch(content: string): boolean {
  const normalized = content.replace(/\s+/g, ' ').slice(0, 30_000);
  if (CLEAR_SALES_PITCH.test(normalized)) return true;
  return SALES_INTENT_SIGNALS.filter((pattern) => pattern.test(normalized)).length >= 2;
}

async function hmacToken(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const IMAP_USER = Deno.env.get('HOSTINGER_IMAP_USER');
  const IMAP_PASSWORD = Deno.env.get('HOSTINGER_IMAP_PASSWORD');
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');

  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY || !IMAP_USER || !IMAP_PASSWORD || !RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    return new Response(JSON.stringify({ error: 'Mailbox or mailing-list settings are missing' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const bearer = authHeader.replace(/^Bearer\s+/i, '');
  const cronSecret = req.headers.get('x-cron-secret') ?? '';
  const isServiceCall = bearer === SERVICE_KEY || cronSecret === SERVICE_KEY;

  if (!isServiceCall) {
    if (!bearer) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(bearer);
    const userId = claims?.claims?.sub;
    if (claimsError || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const adminCheck = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await adminCheck.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  let body: unknown = {};
  try {
    const raw = await req.text();
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const since = new Date(Date.now() - (parsed.data.days ?? 2) * 86_400_000);
  const client = new ImapFlow({
    host: 'imap.hostinger.com',
    port: 993,
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASSWORD },
    logger: false,
  });

  const inboxSenders = new Set<string>();
  const salesPitchSenders = new Set<string>();
  try {
    await client.connect();
    await client.mailboxOpen('INBOX', { readOnly: true });
    const messageIds = await client.search({ since }, { uid: true });
    if (messageIds.length > 0) {
      for await (const message of client.fetch(messageIds, { envelope: true, source: true }, { uid: true })) {
        let messageContent = message.envelope?.subject ?? '';
        if (message.source) {
          try {
            const parsedMessage = await new PostalMime().parse(message.source);
            messageContent = `${messageContent}\n${parsedMessage.text ?? ''}\n${parsedMessage.html ?? ''}`;
          } catch (error) {
            console.warn('Could not parse one inbox message:', error);
          }
        }
        const salesPitch = isServicePitch(messageContent);
        for (const address of message.envelope?.from ?? []) {
          const email = normalizeEmail(address.address ?? '');
          if (isHumanExternalAddress(email)) {
            inboxSenders.add(email);
            if (salesPitch) salesPitchSenders.add(email);
          }
        }
      }
    }
  } catch (error) {
    console.error('Hostinger inbox read failed:', error);
    return new Response(JSON.stringify({ error: 'Could not read the Hostinger inbox' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    try { await client.logout(); } catch { client.close(); }
  }

  const candidates = [...inboxSenders];
  if (candidates.length === 0) {
    return new Response(JSON.stringify({ checked: 0, eligible: 0, added: 0, existing: 0, skipped: 0, errors: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const [{ data: profiles }, { data: customers }, { data: suppressed }] = await Promise.all([
    admin.from('profiles').select('email, marketing_unsubscribed_at').in('email', candidates),
    admin.from('customers').select('email').in('email', candidates),
    admin.from('suppressed_emails').select('email').in('email', candidates),
  ]);

  const known = new Set([
    ...(profiles ?? []).map((row) => normalizeEmail(row.email)),
    ...(customers ?? []).map((row) => normalizeEmail(row.email)),
  ]);
  const blocked = new Set([
    ...(profiles ?? []).filter((row) => row.marketing_unsubscribed_at).map((row) => normalizeEmail(row.email)),
    ...(suppressed ?? []).map((row) => normalizeEmail(row.email)),
  ]);
  const eligible = candidates.filter((email) => (known.has(email) || salesPitchSenders.has(email)) && !blocked.has(email));

  let added = 0;
  let existing = 0;
  const errors: Array<{ email: string; error: string }> = [];
  for (const email of eligible) {
    const token = await hmacToken(email, RESEND_API_KEY);
    try {
      const response = await fetch(`${RESEND_API}/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, unsubscribed: false, first_name: token }),
      });
      if (response.ok) {
        added++;
        continue;
      }
      const detail = await response.text();
      if (response.status === 409 || response.status === 422 || /already exists|duplicate/i.test(detail)) {
        existing++;
        continue;
      }
      errors.push({ email, error: `Mailing list returned ${response.status}` });
      console.error(`Mailing-list add failed [${response.status}]: ${detail}`);
    } catch (error) {
      errors.push({ email, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return new Response(JSON.stringify({
    checked: candidates.length,
    eligible: eligible.length,
    sales_pitches: candidates.filter((email) => salesPitchSenders.has(email)).length,
    added,
    existing,
    skipped: candidates.length - eligible.length,
    errors,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
