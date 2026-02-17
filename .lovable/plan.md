

# Instant Signup on Scan + Skip Email Confirmation

## What Changes

1. **No more free guest scans** -- when any unauthenticated user enters a domain and clicks "Scan", a signup/signin popup appears immediately instead of running the scan.
2. **After signup, user goes straight to the dashboard** -- no email confirmation step.
3. **Email auto-confirm enabled** so users can sign in immediately after creating an account.

## How It Works

1. User lands on homepage, enters domain, clicks Scan
2. If not logged in: signup/signin modal appears (reusing the existing `GuestLimitModal` component, updated with new copy)
3. User creates account (no confirmation email sent)
4. User is redirected to `/dashboard` where they can run scans and see all features

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Change `handleScan` to show signup modal immediately for unauthenticated users (remove the free guest scan logic) |
| `src/components/GuestLimitModal.tsx` | Update copy from "Free Scan Used" to something like "Sign Up to Scan" -- making it a welcome prompt rather than a limit message |
| Auth config | Enable auto-confirm for email signups so no verification email is sent |

## Details

### Index.tsx - handleScan changes
- Remove the `canScan()` check and free guest scan logic
- At the top of `handleScan`, if `!user`, immediately show the guest limit modal and return (no scan runs)
- Remove `recordGuestScan` calls since guests can no longer scan

### GuestLimitModal.tsx - Updated messaging
- Title: "Sign Up to Scan" (instead of "Free Scan Used")
- Description: "Create a free account to scan your domain and track your AI visibility over time."
- Keep the same Sign Up and Sign In buttons

### Auth Configuration
- Use the configure-auth tool to enable auto-confirm for email signups
- This means users can sign in immediately after creating their account without checking email

### Auth.tsx - Post-signup flow
- After successful signup, user is redirected to `/dashboard` (already happens since auto-confirm means the session is created immediately)

