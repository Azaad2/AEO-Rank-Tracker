# Switch Email Sending to SendGrid

You signed up for SendGrid, which works with Hostinger DNS (TXT + CNAME records — no NS delegation required). Here's how we wire it into the project.

## What you'll do in SendGrid (manual, ~5 min)

1. **Authenticate your domain** in SendGrid: Settings → Sender Authentication → Authenticate Your Domain → choose `aimentionyou.com` (or `notify.aimentionyou.com` as a subdomain).
2. SendGrid will give you ~3 CNAME records (e.g. `s1._domainkey`, `s2._domainkey`, `em####`). Add them in Hostinger DNS — these are all CNAMEs, which Hostinger fully supports.
3. Click **Verify** in SendGrid once the DNS propagates (usually <30 min).
4. **Create an API key**: Settings → API Keys → Create API Key → "Full Access" (or "Restricted: Mail Send only"). Copy it — shown only once.
5. Decide your sender address (e.g. `hello@aimentionyou.com` or `reports@aimentionyou.com`).

Once you have the API key, paste it in chat and I'll add it as `SENDGRID_API_KEY` secret.

## What I'll build

### 1. Replace Resend in `generate-pdf` edge function
- Remove `import { Resend } from "resend"`.
- Replace the `resend.emails.send({...})` call with a `fetch` to `https://api.sendgrid.com/v3/mail/send` using `SENDGRID_API_KEY`.
- Update the `from` address from `onboarding@resend.dev` to `hello@aimentionyou.com` (or whichever you choose).
- Keep the same HTML body and subject — only the transport changes.

### 2. Add a shared `sendEmail` helper
- New file: `supabase/functions/_shared/sendgrid.ts` exporting `sendEmail({ to, subject, html, from? })`.
- Reuse it from `generate-pdf` and any future functions (weekly report digests, scan-complete notifications, contact form, etc.).

### 3. Add `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` secrets
- Stored in Supabase secrets (not committed to repo).
- I'll prompt you for both values via `add_secret` once you're ready.

### 4. (Optional, recommended) Hook up scan-complete email
- Right now `generate-pdf` only emails when called with `sendEmail: true` (premium PDF flow).
- I can also add a small "your scan is ready" email triggered after the free scan finishes when an email was captured. Confirm if you want this in the same pass or as a follow-up.

## What I won't touch
- No Lovable Emails / NS-record setup (the thing that didn't work in Hostinger).
- No changes to auth emails — Supabase's default auth emails keep working.
- No frontend changes (the EmailCaptureModal already saves to the `customers` table; the email sending happens server-side).

## Files to change
- `supabase/functions/generate-pdf/index.ts` — swap Resend → SendGrid fetch.
- `supabase/functions/_shared/sendgrid.ts` — new shared helper.
- `supabase/config.toml` — no changes needed (function already has `verify_jwt = false`).

## After approval
1. You confirm the plan.
2. I'll ask for `SENDGRID_API_KEY` and your sender email via the secret prompt.
3. I implement the swap, deploy the edge function, and we test by triggering the premium PDF flow with your email.

## Open question
Do you want me to also add the "scan complete" notification email in this same pass, or just do the Resend→SendGrid swap first and add new email triggers later?
