## Why almost no one signs up today

Looking at `ScanResultsModal.tsx`, the current "unlock" flow only asks for an email and writes to `customers` — it does **not** create an account. So users get the full report (all prompts, per-platform breakdown, competitors, improvement section) without ever signing up. There's no remaining reason to create an account on this page. The only signup nudge is the "Fix it" button, which most users ignore.

On top of that:

- Signup is email + password only — no Google OAuth, high friction.
- The most valuable hooks (competitor "Beat" strategy, full fix content, action plan, tracking over time) aren't visibly tied to "create an account".
- The footer says "Join 500+ marketers" but the primary CTA next to it is "Unlock Free" with just an email — signup is invisible.

## Plan

### 1. Replace email-only unlock with a one-click signup wall

In `ScanResultsModal.tsx`, replace the inline email capture card (lines ~558-607) with a **signup card**:

- Headline: "Create your free account to unlock the full report"
- **Primary**: "Continue with Google" button (one click, no password)
- **Secondary**: email + password inline form (collapsed under "or use email")
- Pre-fill the new account with: the scanned domain (saved into `saved_domains`) and the scanId, so the dashboard immediately shows their result.
- After auth success, set `isUnlocked=true` in-place (don't navigate away — let them keep reading the now-unlocked modal). On next dashboard visit, their scan is already there.
- Keep "no credit card, free forever" microcopy.

Sticky footer CTA changes from "Close" to **"Create free account → unlock report"** so the action is always visible while scrolling.

### 2. Add Google OAuth

- Wire `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard?welcome=1&scanId=...' } })` from the modal.
- Add the same Google button to `src/components/auth/AuthForm.tsx` so /auth and the modal share the flow.
- Requires enabling the Google provider on the backend (auth → configure_social_auth). If credentials aren't supplied, the button surfaces a clear "ask admin" toast and we fall back to email/password.

### 3. Tighten what's actually behind the wall

Right now, after email unlock, the whole report is visible forever. Move signup-only value behind the account:

- **Locked without account**: per-platform breakdown numbers (already blurred ✓), prompts 2..N, competitor list with names, "Fix it" buttons (already require signup ✓), Improvement Roadmap, "Save to Action Plan", domain monitoring.
- **Visible without account (teaser)**: overall score, industry average comparison, count of competitors, count of issues, first prompt result.
- Remove the email-only unlock path entirely so the wall is *signup*, not *email*. The `customers` table row is still created from the signup email automatically via `handle_new_user`.

### 4. Reduce post-signup drop-off

- On successful signup from the modal, immediately call `saved_domains` insert + (optionally) auto-trigger `auto-optimize` so the dashboard has content waiting.
- Show a 1-line toast: "Account created — your full report and action plan are ready in the dashboard."
- Send the existing `send-scan-complete` email after signup instead of after email capture.

### 5. Track the funnel so we can tell if it worked

Add `trackEvent` calls (already wired via `useActivityTracking`) for:

- `signup_wall_viewed` (modal open while logged out)
- `signup_google_clicked`, `signup_email_clicked`
- `signup_completed_from_scan` with `{ scanId, domain, score }`

This lets us read conversion in `Analytics.tsx` and iterate.

## Technical details

**Files to edit**

- `src/components/ScanResultsModal.tsx` — replace email card + footer CTA, add Google + email signup, post-signup wiring.
- `src/components/auth/AuthForm.tsx` — add Google button (shared component for /auth).
- `src/hooks/useAuth.ts` — add `signInWithGoogle(redirectTo)` helper if missing.
- `supabase/functions/send-scan-complete/index.ts` — no changes needed; invoked from new signup success path.

**Backend**

- Enable Google OAuth provider via `configure_social_auth` (needs Google Client ID/Secret from the user; ask before configuring).
- No new tables. `handle_new_user` already creates the profile + free subscription on signup, so unlocking is automatic.

**Out of scope (for this turn)**

- Redesigning pricing page or paid upgrade flow.
- Changing the guest scan limit or scan engine itself.

## What I need from you before building

1. OK to **remove the email-only unlock** entirely and require signup to see the full report? (Recommended — this is the core fix.)
2. Want me to add **Google OAuth** now? If yes, I'll need a Google OAuth Client ID + Secret from Google Cloud Console (I can walk you through getting them), or you can say "email/password only for now" and I'll skip Google.  
  
Proceed with the implementation, but keep approximately 20–30% of the report visible before signup. Don't turn it into a blank gated page. Add Google OAuth as the primary signup method. Unlock the report immediately after successful signup without redirecting. Save the scan to the user's dashboard automatically. Also add a short AI analysis animation before revealing the first results to increase anticipation.