import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API = 'https://api.resend.com';

async function hmacToken(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    return new Response(JSON.stringify({ error: 'Missing Resend secrets' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auth: allow service-role key (cron/admin trigger), or a logged-in admin user.
  // Anyone else gets 401. The anon key alone is not sufficient.
  const authHeader = req.headers.get('Authorization') ?? '';
  const bearer = authHeader.replace('Bearer ', '');
  const cronSecret = req.headers.get('x-cron-secret') ?? '';
  const isServiceCall = bearer === SERVICE_KEY || cronSecret === SERVICE_KEY;

  if (!isServiceCall) {
    if (!bearer) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(bearer);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const adminCheck = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await adminCheck.rpc('has_role', {
      _user_id: claims.claims.sub, _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: profiles, error: pErr } = await admin
    .from('profiles')
    .select('id, email, marketing_unsubscribed_at, resend_contact_id');

  if (pErr) {
    return new Response(JSON.stringify({ error: pErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let added = 0, updated = 0, skipped = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const p of profiles ?? []) {
    if (!p.email) { skipped++; continue; }
    const unsubscribed = !!p.marketing_unsubscribed_at;
    const token = await hmacToken(p.email, RESEND_API_KEY);

    try {
      if (!p.resend_contact_id) {
        // Create contact
        const res = await fetch(`${RESEND_API}/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: p.email,
            unsubscribed,
            // Stored so Resend merge tag {{{UNSUBSCRIBE_TOKEN}}} resolves
            first_name: token,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          errors.push({ email: p.email, error: json?.message ?? `HTTP ${res.status}` });
          continue;
        }
        await admin.from('profiles').update({ resend_contact_id: json.id }).eq('id', p.id);
        added++;
      } else {
        // Patch unsubscribe state
        const res = await fetch(
          `${RESEND_API}/audiences/${RESEND_AUDIENCE_ID}/contacts/${p.resend_contact_id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ unsubscribed, first_name: token }),
          },
        );
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          errors.push({ email: p.email, error: j?.message ?? `HTTP ${res.status}` });
          continue;
        }
        updated++;
      }
    } catch (e) {
      errors.push({ email: p.email, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ added, updated, skipped, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
