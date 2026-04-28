## Goal
Fix the Google sign-in error shown in your screenshot: `Error 400: redirect_uri_mismatch`.

## What’s causing it
The app already has a Google button on the auth page, but the current implementation in `src/hooks/useAuth.ts` calls:
- `supabase.auth.signInWithOAuth({ provider: 'google' ... })`

For this Lovable Cloud project, managed Google sign-in should use Lovable’s OAuth client instead of the direct Supabase OAuth client. Right now the app is sending users through the wrong OAuth flow, which is why Google rejects the redirect URI.

I also confirmed:
- the Google button exists in `src/pages/Auth.tsx`
- the header already has separate `Sign In` / `Get Started Free` buttons
- `@lovable.dev/cloud-auth-js` is already installed in `package.json`
- `src/integrations/lovable/` is currently missing, so the managed OAuth client is not wired up

## Plan
1. Re-enable Lovable Cloud Google auth scaffolding
   - Regenerate the `src/integrations/lovable/` module using the Cloud social auth tooling for Google.
   - Keep the generated files intact and use them as the source of truth for OAuth.

2. Switch Google sign-in to the managed OAuth client
   - Update the Google sign-in action in `src/hooks/useAuth.ts` to use `lovable.auth.signInWithOAuth('google', ...)` instead of `supabase.auth.signInWithOAuth(...)`.
   - Use `redirect_uri: window.location.origin` so the managed OAuth broker handles preview, published, and custom domains correctly.
   - Preserve current error handling so the UI still shows a toast if the sign-in attempt fails before redirect.

3. Keep email/password auth unchanged
   - Leave the existing email/password session logic in place unless the generated Cloud auth integration requires a small compatibility adjustment.
   - This limits the fix to the broken Google path instead of refactoring the whole auth system.

4. Verify auth entry points
   - Confirm the Google button on `src/pages/Auth.tsx` still calls the same handler.
   - Check whether any other Google sign-in trigger exists elsewhere in the app and route it through the same managed method.

5. Validate domain behavior
   - Test the OAuth initiation flow on:
     - preview URL
     - published URL
     - custom domain (`aimentionyou.com`)
   - Confirm the redirect no longer hits the mismatched URI path and that users return with an authenticated session.

## Expected result
After this change:
- clicking `Continue with Google` should open Google normally
- the `redirect_uri_mismatch` error should disappear
- Google sign-in should work on your custom domain as well as the app’s normal deployment URLs

## Technical details
Files likely involved:
- `src/hooks/useAuth.ts`
- `src/pages/Auth.tsx`
- generated `src/integrations/lovable/*`

No database migration should be needed.

Notes:
- This is a Lovable Cloud auth-flow fix, not a UI styling issue.
- Because this project uses Lovable Cloud, the correct implementation path is managed OAuth via the Lovable client, not direct Supabase OAuth initiation.
- If the Cloud auth tool regenerates slightly different session helpers, I’ll align the Google flow with that generated setup while keeping the rest of the auth UX unchanged.