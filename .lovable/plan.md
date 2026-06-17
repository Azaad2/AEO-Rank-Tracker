## Goal
Keep your Resend audience "AI Mention You" (`2b5163a6-...`) in sync with the `profiles` table so you can compose Broadcasts in Resend's dashboard, and host a branded one-click unsubscribe page for CAN-SPAM/GDPR compliance.

## Secrets (done)
- `RESEND_API_KEY` ✅
- `RESEND_AUDIENCE_ID` ✅

## 1. Schema migration
Add to `public.profiles`:
- `marketing_unsubscribed_at timestamptz` (nullable)
- `resend_contact_id text` (nullable)

## 2. Edge function: `sync-resend-audience` (admin-only)
- Reads all `profiles` rows with non-null email.
- New rows → `POST /audiences/{id}/contacts`, stores returned contact id.
- Changed unsubscribe state → `PATCH` the Resend contact's `unsubscribed` flag.
- Idempotent. Returns `{ added, updated, skipped, errors }`.
- Protected by `has_role(auth.uid(), 'admin')` check.

## 3. Edge function: `resend-unsubscribe` (public)
- `GET ?email=...&token=...`, `verify_jwt = false`.
- Token = HMAC-SHA256(email, RESEND_API_KEY) — stateless.
- On valid token: sets `marketing_unsubscribed_at = now()` on profile + PATCH Resend contact `unsubscribed: true`.
- Returns branded arcade-themed HTML confirmation (bg-black, yellow-400).

## 4. Admin UI
Add a "Sync contacts to Resend" button on `/admin/recommendations` that invokes `sync-resend-audience` and shows result counts via toast.

## 5. Nightly cron
Schedule `sync-resend-audience` to run daily at 02:30 UTC via pg_cron + pg_net.

## 6. Broadcast footer (you paste once in Resend)
When composing a Broadcast in Resend's dashboard, paste this in the footer:
```
You're receiving this because you signed up at aimentionyou.com.
Unsubscribe: https://aimentionyou.com/functions/v1/resend-unsubscribe?email={{{RESEND_CONTACT_EMAIL}}}&token={{{UNSUBSCRIBE_TOKEN}}}
```
The sync function stores the per-recipient HMAC token in Resend's contact metadata so the merge tag resolves.

## Out of scope
- No in-app composer (you compose in Resend dashboard).
- No segmentation logic (segment inside Resend).
- Transactional emails (existing Lovable Emails) untouched.

## After approval
Apply migration → write both edge functions → add admin button → schedule cron → you verify `aimentionyou.com` sending domain in Resend → click sync once → send first Broadcast from Resend.
