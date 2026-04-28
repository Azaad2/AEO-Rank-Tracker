## Plan

Switch the Google button from Lovable Cloud managed OAuth back to direct Google OAuth, so users no longer see the Lovable-branded permission screen.

## What’s happening now

The current code in `src/hooks/useAuth.ts` still does this:

```ts
import { lovable } from '@/integrations/lovable';

const result = await lovable.auth.signInWithOAuth('google', {
  redirect_uri: `${window.location.origin}/dashboard`,
});
```

That is why the Lovable permission page is still showing. The app is still using the managed OAuth broker.

## Changes

1. Update the Google sign-in flow in `src/hooks/useAuth.ts`
   - Remove the `lovable` import.
   - Replace `lovable.auth.signInWithOAuth(...)` with direct auth client Google OAuth:
     ```ts
     await supabase.auth.signInWithOAuth({
       provider: 'google',
       options: {
         redirectTo: `${window.location.origin}/dashboard`,
       },
     });
     ```
   - Keep the same error-return shape so the existing toast on the auth page continues to work.

2. Leave email/password auth unchanged
   - Keep `signIn`, `signUp`, session loading, and sign-out exactly as they are.
   - Only the Google path changes.

3. Keep the auth page UI unchanged
   - `src/pages/Auth.tsx` already calls `signInWithGoogle()` correctly.
   - No visual changes are needed unless you also want the button label adjusted.

4. Clean up unused managed OAuth usage
   - Stop using `src/integrations/lovable` from auth flow.
   - If nothing else imports it, optionally remove the unused import path/dependency in a follow-up cleanup.

5. Verify direct Google configuration
   - Confirm your Google OAuth app has the correct authorized origins and callback URL for the direct provider setup in Lovable Cloud auth settings.
   - Test on the published/custom domain first, since preview and published auth environments can differ.

## Expected result

After this change:
- clicking `Continue with Google` should go straight into Google OAuth using your own Google app credentials
- the Lovable-branded consent/intermediate screen should no longer appear
- email/password login will keep working as before

## Technical details

Files involved:
- `src/hooks/useAuth.ts`
- `src/pages/Auth.tsx` for validation only

No database migration is needed.

Notes:
- The uploaded screenshot matches the current managed OAuth flow, so this is not a caching illusion — the code path is still pointed at the Lovable auth client.
- If Google sign-in still behaves differently between preview and your live domain after the code change, that would point to environment-specific auth configuration rather than the button implementation itself.