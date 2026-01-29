

# Hero Section Visibility Fix + Mario-Style Design

## Problem Identified

Looking at the screenshot, the main headline is being clipped/overlapped by the sticky header. Additionally, the user wants:
1. **Black background** for the hero section
2. **Mario-game style typography** (retro pixel font)
3. **Crystal clear visibility** - high contrast text

---

## Solution

### 1. Add Google Fonts "Press Start 2P" (Mario/Arcade Font)

This is the classic 8-bit pixel font that evokes Super Mario Bros and retro arcade games.

**File: `index.html`**

Add the Google Fonts import in the `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

---

### 2. Update Hero Section Styling

**File: `src/pages/Index.tsx`**

Transform the hero section with:
- **Increased top padding** (from `pt-28` to `pt-32`) to prevent header overlap
- **Black background** for the hero area with proper contrast
- **Mario-style pixel font** on the headline
- **Bright white/yellow text** for crystal clear visibility
- **Slightly larger text** to compensate for pixel font readability

```tsx
{/* Hero Section with Black Background */}
<div className="bg-black py-16 px-4 -mx-4 md:-mx-8">
  <div className="text-center space-y-6">
    <h1 
      className="text-2xl md:text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]"
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      Invisible to AI?
      <br />
      <span className="text-yellow-400">Fix It in Minutes.</span>
    </h1>
    <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
      Check if ChatGPT, Perplexity, and Gemini mention your website — 
      then get a personalized optimization plan to boost your visibility.
    </p>
    {/* CTA button with arcade styling */}
    <Button onClick={scrollToScan} size="lg" className="...">
      {ctaText}
    </Button>
  </div>
</div>
```

---

### 3. Visual Design Details

| Element | Before | After |
|---------|--------|-------|
| Background | Light gradient | Solid black (`bg-black`) |
| Headline font | System font | Press Start 2P (pixel/Mario) |
| Headline color | Dark foreground | White + Yellow accent |
| Text size | 4xl/5xl | 2xl/4xl (pixel fonts need smaller size) |
| Contrast | Low | Maximum (white on black) |
| Special effects | None | Yellow text glow for arcade feel |
| Top padding | pt-28 | pt-32 (more header clearance) |

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `index.html` | Add | Google Fonts "Press Start 2P" import |
| `src/pages/Index.tsx` | Modify | Hero section with black background |
| `src/pages/Index.tsx` | Modify | Pixel font on headline |
| `src/pages/Index.tsx` | Modify | Increased padding for header clearance |
| `src/pages/Index.tsx` | Modify | High-contrast white/yellow text |

---

## Expected Result

The hero section will feature:
- Black background that immediately stands out
- Classic Mario/arcade 8-bit pixel typography
- Crystal clear white text with yellow accent
- Yellow glow effect for retro game feel
- Proper spacing below the fixed header

