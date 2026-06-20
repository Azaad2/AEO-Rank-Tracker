## Daily AI Newsletter via Resend

Auto-generate and broadcast a short daily AI-visibility tip to your Resend audience ("AI Mention You", all subscribed contacts) every day at **02:30 UTC**.

### How it works

```text
pg_cron (02:30 UTC daily)
   └─ POST /functions/v1/send-daily-newsletter  (with cron secret)
        ├─ 1. Generate today's tip via Lovable AI (Gemini 3 Flash)
        │     → subject line + 150–250 word HTML body + CTA
        ├─ 2. POST https://api.resend.com/broadcasts
        │     audience_id = RESEND_AUDIENCE_ID
        │     from = "AI Mention You <hello@aimentionyou.com>"
        │     html includes unsubscribe footer + branded arcade styling
        ├─ 3. POST /broadcasts/{id}/send  (immediate send)
        └─ 4. Log row to newsletter_log table
```

Resend handles per-recipient delivery, suppression, and unsubscribe state (already synced via your existing `sync-resend-audience` function). We do not loop per-contact — one Broadcast goes to the whole audience.

### Deliverables

1. **New table** `public.newsletter_log` — date, subject, broadcast_id, status, error, ai-generated body snippet. Admin-only RLS.
2. **New edge function** `send-daily-newsletter` (`verify_jwt = false`, cron-secret protected):
   - Calls Lovable AI with a system prompt focused on AI search visibility / GEO tips for SaaS founders & agencies (your audience).
   - Wraps the body in your arcade-themed HTML template (bg-black, yellow-400, Press Start 2P heading) with unsubscribe link using the existing `resend-unsubscribe` endpoint and Resend merge tags.
   - Creates + sends a Resend Broadcast in one call.
   - Idempotent: skips if a `sent` row already exists for today's date.
3. **pg_cron job** `send-daily-newsletter-daily` at `30 2 * * *` UTC, using the existing Vault cron secret pattern.
4. **Admin UI** on `/admin/recommendations`: a "Send today's newsletter now" button (manual trigger / preview), plus a small table of the last 14 days from `newsletter_log` (date, subject, status).

### Technical notes

- Sender domain: `aimentionyou.com` must be verified in Resend → Domains before the first send works. The function will still create the Broadcast but send will fail until verification.
- Tip topics rotate via a seeded prompt (day-of-year mod a topic list of ~30 themes: schema, FAQs, citation prompts, competitor monitoring, GEO basics, etc.) so daily tips stay varied without manual curation.
- No new secrets needed — reuses `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `LOVABLE_API_KEY`.
- Out of scope: per-user personalization, A/B subject lines, open/click analytics dashboard (Resend dashboard already shows these).

### After approval

Migration → edge function → cron schedule → admin button. You verify `aimentionyou.com` sending domain in Resend (if not already), then daily sends start the next 02:30 UTC.