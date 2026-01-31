
# Fix Pricing Page Styling & Add to Sitemap

## Issues Identified

1. **Sitemap Missing Pricing Page**: The `/pricing` route is not included in `public/sitemap.xml`
2. **Pricing Page Theme Mismatch**: The page uses generic CSS variables instead of the dark arcade theme used on the homepage

---

## Changes Required

### 1. Update Sitemap (`public/sitemap.xml`)

Add the pricing page entry after the main pages section:

```xml
<url>
  <loc>https://domain-signal-check.lovable.app/pricing</loc>
  <lastmod>2026-01-31</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

---

### 2. Restyle Pricing Page (`src/pages/Pricing.tsx`)

Apply the dark arcade theme to match the homepage:

| Element | Current | Updated |
|---------|---------|---------|
| Main container | `bg-background` | `bg-black` |
| Cards | `bg-card border-border` | `bg-gray-900 border-gray-700` |
| Headings | `text-foreground` | `text-white` |
| Body text | `text-muted-foreground` | `text-gray-400` |
| Primary CTA | `bg-primary` | `bg-yellow-400 text-black` |
| Secondary buttons | `bg-secondary` | `bg-gray-800 text-white` |
| Hero title | Standard font | "Press Start 2P" font |
| Badge accent | `bg-primary/20` | `bg-yellow-400/20 text-yellow-400` |
| Comparison section | `bg-muted/30` | `bg-gray-900` |
| FAQ cards | `bg-card border-border` | `bg-gray-800 border-gray-700` |
| Table borders | `border-border` | `border-gray-700` |
| "Popular" badge | `bg-primary` | `bg-yellow-400 text-black` |
| Ring on popular card | `ring-primary` | `ring-yellow-400` |

---

## Technical Details

### Styling Patterns from Homepage

The homepage (`src/pages/Index.tsx`) uses these exact patterns:

```jsx
// Container
<div className="min-h-screen bg-black">

// Cards
<Card className="bg-gray-900 border-gray-700">

// Headings with arcade font
<h1 
  className="text-white"
  style={{ fontFamily: "'Press Start 2P', cursive" }}
>

// Yellow accent text
<span className="text-yellow-400">

// CTAs
<Button className="bg-yellow-400 hover:bg-yellow-500 text-black">

// Body text
<p className="text-gray-300">
<p className="text-gray-400">
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `public/sitemap.xml` | Add `/pricing` URL entry |
| `src/pages/Pricing.tsx` | Apply dark arcade theme styling throughout |

---

## Result

After these changes:
- Pricing page will be indexed by search engines
- Visual consistency with homepage (black background, yellow accents, arcade font)
- Better brand cohesion across all pages
