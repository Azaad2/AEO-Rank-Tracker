## Goal
Use Resend's dashboard (Broadcasts) to send marketing emails from `aimentionyou.com`. Lovable's role is to keep a Resend Audience in sync with your `profiles` table and host a branded unsubscribe page so you stay CAN-SPAM / GDPR compliant.

## What you'll do in Resend (one-time, manual)
1. Verify the sending domain `aimentionyou.com` in Resend → Domains (add the SPF, DKIM, MX records Resend shows you at your DNS provider).
   - Safe to coexist with the existing Lovable `notify.aimentionyou.com` subdomain — different zone, no conflict.
2. In Resend → Audiences, create an audience named **"AI Mention You – All Users"**. Copy its Audience ID.
3. In Resend → API Keys, create a key with **Full access** (needed for contacts + broadcasts). Copy it.

## What I'll build

### 1. Secrets
- `RESEND_API_KEY` (your key)
- `RESEND_AUDIENCE_ID` (the audience UUID)

### 2. Schema (migration)
Add to `profiles`:
- `marketing_unsubscribed_at timestamptz` (nullable)
- `resend_contact_id text` (nullable, stores Resend's contact id so we can update/delete instead of recreate)

### 3. Edge function: `sync-resend-audience`
- Reads every `profiles` row where `email is not null`.
- For rows without `resend_contact_id` → `POST /audiences/{id}/contacts` (with `unsubscribed: marketing_unsubscribed_at is not null`), stores returned id.
- For rows where `marketing_unsubscribed_at` changed since last sync → `PATCH` the contact's `unsubscribed` flag.
- Idempotent, safe to re-run. Returns `{ added, updated, skipped }`.
- Runs nightly via pg_cron (02:30 UTC) and exposes a manual trigger from an admin button.

### 4. Edge function: `resend-unsubscribe`
- Public (no JWT). Accepts `?email=...&token=...`.
- Token = HMAC-SHA256 of email using `RESEND_API_KEY` (stateless, no extra table).
- On valid token: sets `marketing_unsubscribed_at = now()` on the profile and `PATCH`es the Resend contact to `unsubscribed: true`.
- Returns a small branded HTML confirmation page.

### 5. Resend broadcast footer
When you compose a Broadcast in Resend, paste this once into the template footer (Resend supports merge tags):
```
You're receiving this because you signed up at aimentionyou.com.
Unsubscribe: https://aimentionyou.com/functions/v1/resend-unsubscribe?email={{{RESEND_CONTACT_EMAIL}}}&token={{{RESEND_CONTACT_UNSUBSCRIBE_TOKEN_PLACEHOLDER}}}
```
(I'll generate the per-recipient token at sync time and store it in Resend's contact metadata so the merge tag resolves — included in step 3.)

### 6. Admin trigger
Add a single "Sync contacts to Resend" button on `/admin/recommendations` (or a new tiny `/admin/email` page if you prefer) that invokes `sync-resend-audience` and shows the result counts. No composer, no segments — composing happens in Resend.

## Out of scope (per your choices)
- No in-app composer / broadcasts table.
- No segmentation logic (everyone in `profiles` goes to the one audience; you can segment inside Resend).
- No transactional email changes — existing Lovable Emails subdomain stays untouched.

## Compliance notes
- One-click unsubscribe link in every broadcast → satisfies CAN-SPAM and RFC 8058 list-unsubscribe expectations (Resend also adds List-Unsubscribe headers automatically when a contact is in an Audience).
- Unsubscribes write to both your DB and Resend, so they survive future re-syncs.

## After approval
1. I'll ask you to add `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` via the secrets prompt.
2. Apply migration → write both edge functions → add admin button → schedule cron.
3. You verify domain in Resend, run the sync once, then send your first Broadcast from Resend's dashboard.