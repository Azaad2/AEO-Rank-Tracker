# Google One Tap on Homepage

## What we'll build

A non-intrusive Google One Tap (FedCM) prompt that appears in the top-right for logged-out visitors on the homepage (`/`). It supplements — does not replace — the existing post-scan signup wall.

## Behavior

- Shows automatically when a logged-out user lands on `/`.
- Top-right placement (Google controls position; we use the default top-right One Tap UI).
- Hidden if user is already authenticated.
- Hidden once per session after it's shown (sessionStorage flag).
- If dismissed (X / "not now" / `skipped_reason`), suppressed for 1 day via localStorage timestamp.
- On successful sign-in: hide prompt, stay on current page, show toast: *"You're signed in. Your scans will now be saved automatically."*
- Future scans auto-attach because `useAuth` already exposes the new session; existing scan code reads `user.id` when present.

## Implementation

### 1. New component: `src/components/GoogleOneTap.tsx`

- Loads `https://accounts.google.com/gsi/client` script once.
- Calls `google.accounts.id.initialize({ client_id, callback, use_fedcm_for_prompt: true, auto_select: false, cancel_on_tap_outside: false })`.
- Calls `google.accounts.id.prompt(notification => { ... })` to:
  - Track `google_one_tap_shown` when `isDisplayed()`.
  - Track `google_one_tap_dismissed` when `isDismissedMoment()` (X, cancel, flow restarted) and write `googleOneTapDismissedAt` to localStorage.
  - Track `google_one_tap_clicked` is approximated when the credential callback fires (One Tap doesn't expose a discrete click event; we fire it just before exchanging the credential).
- Callback receives `{ credential }` (Google ID token). Exchange with Supabase:
  ```ts
  supabase.auth.signInWithIdToken({ provider: 'google', token: credential, nonce })
  ```
  Generate a nonce, hash with SHA-256 for `nonce` param to Google init, pass raw nonce to Supabase per Supabase's One Tap guide.
- On success: track `google_one_tap_success`, toast, no navigation.
- Guards before init:
  - `user` is null and `!isLoading`.
  - `sessionStorage.getItem('googleOneTapShown')` is unset (then set it).
  - `localStorage.getItem('googleOneTapDismissedAt')` is empty or older than 7 days.
  - `VITE_GOOGLE_CLIENT_ID` is present.

### 2. Mount it

Render `<GoogleOneTap />` inside `src/pages/Index.tsx` (homepage only, per request).

### 3. Auth wiring

No changes to `useAuth`. `signInWithIdToken` triggers `onAuthStateChange`, so the existing `account_created` telemetry, profile/referral persistence, and PostHog identify all fire automatically. No redirect logic added.

### 4. Analytics

Use existing `trackEvent` pattern (PostHog + `user_activity` insert) consistent with current `signup_*` events in `ScanResultsModal`.

### 5. Config

- Add `VITE_GOOGLE_CLIENT_ID` to `.env` (Web OAuth Client ID from Google Cloud Console — same one already used by Supabase Google provider is fine; user must paste it).
- Add the production + preview origins to "Authorized JavaScript origins" in the Google Cloud OAuth client (FedCM requires this).

## Out of scope

- Post-scan signup wall in `ScanResultsModal` — left untouched.
- `/auth` page Google button — unchanged.
- Showing One Tap on routes other than `/`.

## Open question

Do you already have a Google OAuth **Web Client ID** you want to reuse (the one configured for Supabase Google sign-in), or should I prompt you to create one and add `VITE_GOOGLE_CLIENT_ID`? FedCM/One Tap requires the client ID exposed on the frontend and your site's origin registered in the Google Cloud Console.