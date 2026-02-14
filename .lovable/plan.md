

# Update Navigation for Logged-In Users

## What Changes

When a user is **logged in**, the navigation links "Home" and "Pricing" will be replaced with "Dashboard" and "Help". When **logged out**, navigation stays the same as it is now.

## Details

### Desktop Header (`src/components/Header.tsx`)
- When `user` exists, swap the nav links:
  - **Home** (/) becomes **Dashboard** (/dashboard)
  - **Pricing** (/pricing) becomes **Help** -- a mailto link to hello@aimentionyou.com
- Tools, Integrations, and Blog links remain unchanged for all users

### Mobile Nav (`src/components/MobileNav.tsx`)
- Same logic: when `user` exists, replace Home with Dashboard and Pricing with Help (mailto link)
- The Help link will open the user's email client with hello@aimentionyou.com pre-filled

### Help Button Behavior
- Rendered as an `<a href="mailto:hello@aimentionyou.com">` styled like the other nav links
- Icon: `HelpCircle` from lucide-react (on mobile)

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Conditionally render Dashboard/Help instead of Home/Pricing when logged in |
| `src/components/MobileNav.tsx` | Same conditional swap for mobile menu |

