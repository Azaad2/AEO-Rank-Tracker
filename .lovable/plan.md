

# User Authentication and Credit System Implementation

This plan adds full user authentication, a profile dashboard with credit tracking, and enforces guest scan limits (1 free scan per day, then require signup).

---

## Overview

### Current State
- Guest checkout model (email capture only)
- No user accounts or authentication
- No Sign Up/Sign In buttons in header
- `customers` and `subscriptions` tables exist but not linked to auth

### Target State
- Full email/password authentication
- User profile dashboard showing credits and usage
- Guest users: 1 free scan per day (tracked via localStorage + IP fingerprint)
- Second scan attempt prompts account creation
- Logged-in users: credits based on their subscription plan

---

## Database Changes

### 1. Create `profiles` table
Stores user profile data linked to Supabase Auth:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | References auth.users.id |
| email | text | User email |
| full_name | text | Optional display name |
| avatar_url | text | Optional profile image |
| created_at | timestamptz | Account creation time |
| updated_at | timestamptz | Last update time |

### 2. Create `guest_scans` table
Tracks anonymous scans to enforce daily limit:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| fingerprint | text | Browser fingerprint hash |
| ip_address | text | User IP (from edge function) |
| scan_date | date | Date of scan |
| scan_id | uuid (FK) | Reference to scans table |
| created_at | timestamptz | Timestamp |

### 3. Update `subscriptions` table
Add `user_id` column to link subscriptions to authenticated users:

| Column | Type | Description |
|--------|------|-------------|
| user_id | uuid (FK) | References auth.users.id |

---

## New Pages and Components

### 1. Auth Page (`/auth`)
Combined login and signup page with:
- Email/password form
- Toggle between Sign In and Sign Up modes
- Password strength validation
- Error handling (duplicate email, wrong password)
- Dark arcade theme styling
- Redirect to dashboard after auth

### 2. Profile Dashboard (`/dashboard`)
Protected page showing:
- User email and account info
- Current plan name and pricing
- Credit usage progress bars (prompts used/limit, scans used/limit)
- Scan history list
- Upgrade to Pro button
- Sign out button

### 3. Header Updates
Add to navigation:
- "Sign In" button (when not logged in)
- "Dashboard" + avatar dropdown (when logged in)

### 4. Guest Limit Modal
New modal that appears when:
- Guest tries to scan a second time in 24 hours
- Offers two CTAs: "Sign Up Free" and "Sign In"

---

## Component Architecture

```text
src/
  components/
    auth/
      AuthForm.tsx         -- Email/password form
      AuthGuard.tsx        -- Protected route wrapper
    dashboard/
      CreditUsage.tsx      -- Usage progress bars
      ScanHistory.tsx      -- List of past scans
      UserProfile.tsx      -- Profile header card
    GuestLimitModal.tsx    -- "Create account" prompt
  hooks/
    useAuth.ts             -- Auth state management
    useGuestScans.ts       -- Guest scan limit tracking
  pages/
    Auth.tsx               -- /auth route
    Dashboard.tsx          -- /dashboard route
```

---

## Authentication Flow

### Sign Up Flow
1. User enters email + password on `/auth`
2. Supabase creates auth.users record
3. Database trigger creates `profiles` row
4. Database trigger creates free `subscriptions` row
5. User redirected to `/dashboard`

### Sign In Flow
1. User enters credentials on `/auth`
2. Supabase validates and returns session
3. `useAuth` hook updates state
4. User redirected to `/dashboard`

### Guest Scan Flow
1. Guest visits homepage, enters scan details
2. Before scan: check `localStorage` for today's scan
3. If no scan today: proceed, store fingerprint in `guest_scans` table
4. If already scanned: show `GuestLimitModal` requiring signup
5. Edge function validates guest limit server-side

---

## Security Considerations

### RLS Policies

**profiles table:**
- Users can only read/update their own profile
- Insert via trigger only (on auth.users insert)

**subscriptions table:**
- Users can read their own subscription
- No direct insert/update from client (managed by backend)

**guest_scans table:**
- Insert allowed for anonymous users
- Select denied (server-side validation only)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/xxxx_auth_setup.sql` | Create | profiles, guest_scans tables, triggers |
| `src/hooks/useAuth.ts` | Create | Auth state management |
| `src/hooks/useGuestScans.ts` | Create | Guest limit tracking |
| `src/components/auth/AuthForm.tsx` | Create | Login/signup form |
| `src/components/auth/AuthGuard.tsx` | Create | Protected route wrapper |
| `src/components/GuestLimitModal.tsx` | Create | Account creation prompt |
| `src/components/dashboard/CreditUsage.tsx` | Create | Usage display |
| `src/components/dashboard/ScanHistory.tsx` | Create | Past scans list |
| `src/pages/Auth.tsx` | Create | /auth route |
| `src/pages/Dashboard.tsx` | Create | /dashboard route |
| `src/components/Header.tsx` | Modify | Add Sign In/Dashboard buttons |
| `src/pages/Index.tsx` | Modify | Add guest limit check before scan |
| `supabase/functions/scan/index.ts` | Modify | Validate guest limits server-side |
| `src/App.tsx` | Modify | Add new routes |
| `public/sitemap.xml` | Modify | Add /auth, /dashboard URLs |

---

## Implementation Phases

### Phase 1: Database Setup
- Create `profiles` table with RLS
- Create `guest_scans` table with RLS
- Add `user_id` to `subscriptions` table
- Create triggers for profile/subscription creation on signup

### Phase 2: Auth Pages
- Create `/auth` page with Sign In/Sign Up forms
- Implement `useAuth` hook
- Add dark arcade theme styling
- Handle email confirmation flow

### Phase 3: Dashboard
- Create `/dashboard` protected page
- Show credit usage (prompts/scans)
- Display scan history
- Add upgrade CTA

### Phase 4: Header Integration
- Add "Sign In" button to header (when logged out)
- Add user avatar dropdown (when logged in)
- Include Dashboard link and Sign Out action

### Phase 5: Guest Limit Enforcement
- Implement `useGuestScans` hook
- Add client-side limit check in Index.tsx
- Create `GuestLimitModal` component
- Update scan edge function for server-side validation

---

## Technical Notes

### Browser Fingerprinting
Guest tracking uses a lightweight fingerprint combining:
- User agent string
- Screen resolution
- Timezone
- Language

This is hashed and stored in `guest_scans.fingerprint` for daily limit enforcement.

### Session Persistence
Auth uses Supabase's built-in session management:
- Sessions stored in localStorage
- Auto-refresh tokens
- `onAuthStateChange` listener for reactive updates

### Credit Calculation
For logged-in users:
```typescript
const usage = {
  promptsUsed: subscription.prompts_used,
  promptsLimit: plan.prompts_limit,
  scansUsed: subscription.scans_used,
  scansLimit: plan.scans_limit,
  promptsRemaining: plan.prompts_limit - subscription.prompts_used,
  scansRemaining: plan.scans_limit - subscription.scans_used
};
```

