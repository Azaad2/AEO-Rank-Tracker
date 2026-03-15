

# Remove Suggest Prompts from Homepage + Fix Sign In Button Visibility

## Changes

### 1. Remove "Suggest Prompts" button from homepage
The `SuggestedPrompts` component is currently rendered in the scan form on the homepage (`Index.tsx`, line 484-490). It will be removed from there -- this feature is already available in the dashboard for signed-in users.

**File:** `src/pages/Index.tsx`
- Remove the `SuggestedPrompts` import (line 23)
- Remove the `<SuggestedPrompts>` component from the scan form (lines 484-490)

### 2. Fix Sign In button visibility on signup popup
The Sign In button in the `GuestLimitModal` uses `variant="outline"` which applies default shadcn styles that can conflict with the custom `text-white` class (the outline variant may set its own foreground color that overrides white). The fix is to use `variant="ghost"` or apply inline style to ensure the text is always visible against the dark modal background.

**File:** `src/components/GuestLimitModal.tsx`
- Change the Sign In button styling to ensure white text is visible: use `!text-white` (important modifier) or switch to a more explicit styling approach with proper contrast

