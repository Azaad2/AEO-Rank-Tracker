## Accessibility Landmark Fix + Republish

### Problem
The Lighthouse audit flagged that the page has no `<main>` landmark. Screen-reader users cannot skip to the primary content because there is no `<main>` element wrapping the route content.

### Fix
Wrap `<Routes>` in `src/App.tsx` with a `<main>` element. This places exactly one `<main>` landmark around the primary content that changes between routes, while keeping the `<Toaster>`/`<Sonner>` and `<TooltipProvider>` outside of it.

### Republish
After the code change, republish the app so the Lighthouse finding (`lighthouse:lighthouse_accessibility`) is resolved in the published build.

### Technical details
- File: `src/App.tsx`
- Change: Add `<main>` element around `<Routes>` inside `<BrowserRouter>`
