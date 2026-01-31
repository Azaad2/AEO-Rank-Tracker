

# Update SEO Files for Custom Domain

## Problem
The `sitemap.xml` and `robots.txt` files reference the old Lovable subdomain instead of your custom domain `aimentionyou.com`.

---

## Changes Required

### 1. Update `public/robots.txt`

Change the sitemap reference:

**Before:**
```
Sitemap: https://domain-signal-check.lovable.app/sitemap.xml
```

**After:**
```
Sitemap: https://aimentionyou.com/sitemap.xml
```

---

### 2. Update `public/sitemap.xml`

Replace all 50+ URL entries from `domain-signal-check.lovable.app` to `aimentionyou.com`:

**Before:**
```xml
<loc>https://domain-signal-check.lovable.app/</loc>
<loc>https://domain-signal-check.lovable.app/tools</loc>
...
```

**After:**
```xml
<loc>https://aimentionyou.com/</loc>
<loc>https://aimentionyou.com/tools</loc>
...
```

---

## Files to Modify

| File | Change |
|------|--------|
| `public/robots.txt` | Update sitemap URL to custom domain |
| `public/sitemap.xml` | Replace all 50+ URL entries with custom domain |

---

## After Publishing

Once changes are live, submit to Google Search Console:

1. Add property: `https://aimentionyou.com`
2. Verify ownership
3. Go to **Sitemaps** section
4. Submit: `sitemap.xml`
5. Google will crawl and index all 50+ pages

---

## Technical Note

The `lastmod` dates will be updated to `2026-01-31` to signal fresh content to search engines.

