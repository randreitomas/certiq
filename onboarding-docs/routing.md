# Routing & Page Structure

## Purpose

Certiq is a two-page Next.js application built with the App Router. The root URL (`/`) is a static marketing landing page; `/studio` is the interactive certificate editor. A single root layout wraps both routes, providing shared HTML boilerplate, metadata, and global styles.

---

## Key Files

| File | Description |
|------|-------------|
| `app/layout.tsx` | Root layout — HTML shell, `<head>` metadata, OG tags, global CSS import |
| `app/page.tsx` | Landing page at `/` — server component, hero, feature cards, CTAs |
| `app/studio/page.tsx` | Studio editor at `/studio` — `"use client"` component, all editor logic |
| `app/globals.css` | Global styles imported by root layout; applies to every route |
| `app/components/site-header.tsx` | Navigation header shared across both pages |
| `app/components/site-footer.tsx` | Footer shared across both pages |
| `app/components/landing-preview.tsx` | Animated certificate preview on the landing page |
| `app/components/landing-cta.tsx` | Call-to-action section on the landing page |
| `app/components/card-swap/CardSwap.tsx` | Animated card carousel used on the landing page |
| `app/lib/certificate.ts` | Shared utilities (certificate rendering, CSV parsing) |
| `app/lib/fonts.ts` | Font loading helpers used by the studio |

---

## How It Works

### Root Layout (`app/layout.tsx`)

Rendered once and wraps every route. Responsibilities:

- Declares `<html lang="en">` and `<body className="antialiased">`.
- Exports a `metadata` object consumed by Next.js for `<title>`, `<meta description>`, OpenGraph image (`/og.png`), and Twitter card.
- `metadataBase` is set from `process.env.NEXT_PUBLIC_SITE_URL`; defaults to `https://certiq.vercel.app`.
- Imports `app/globals.css`, making all CSS custom properties and Tailwind utilities available globally.

### Landing Page (`app/page.tsx`)

- Pure server component; no `"use client"` directive.
- Renders: `<SiteHeader>` → hero section with `STEPS` cards → `<LandingPreview>` → `<LandingCta>` → `<SiteFooter>`.
- The primary CTA (`"Start creating →"`) is a plain `<a href="/studio">` anchor — no client-side router call needed.
- All content is statically generated at build time (no `getServerSideProps` / `fetch` calls).

### Studio Page (`app/studio/page.tsx`)

- Marked `"use client"` at line 1 — renders entirely in the browser.
- No nested layout file; inherits root layout directly.
- Top navigation contains a `href="/"` link back to the landing page.
- All state (`templateImage`, `attendees`, `x`, `y`, `font`, `size`, `color`, `uppercase`, etc.) is local React state — nothing is persisted to a backend or URL params.

### Styling & Global CSS

- `app/globals.css` is the single CSS entry point.
- Uses `@import "tailwindcss"` for Tailwind v4 utilities.
- Defines CSS custom properties (`--green`, `--gold`, `--cream`, `--ink`, `--ui-sans`, `--ui-serif`, etc.) consumed by both pages.
- Studio-specific classes (`.studio`, `.certificate`, `.name-layer`, `.canvas-panel`, etc.) live in the same file, scoped by class name rather than CSS modules.

### No Middleware, No Providers

- No `middleware.ts` file exists — all routes are publicly accessible.
- No React context providers in the root layout; studio state is entirely local.
- No authentication, session, or feature-flag layers.

---

## Gotchas / Risks

1. **No route protection on `/studio`.** Anyone with the URL can access the editor. If authentication is added in future, a middleware file or a layout-level redirect will be needed.

2. **Single global CSS file.** All styles for both pages live in `globals.css`. Adding new routes without care will inherit all existing CSS custom properties and risk class-name collisions (e.g. a new `.card` class conflicting with landing card styles).

3. **Metadata is the same for every route.** The `<title>` and OG image set in `app/layout.tsx` apply to `/`, `/studio`, and any future routes. To give `/studio` its own title (useful for social sharing and browser tabs), add a `metadata` export directly in `app/studio/page.tsx`.

4. **Studio state is not persisted.** Navigating away from `/studio` and returning resets all work. There is no `localStorage` save, URL serialisation, or draft API. A user who accidentally clicks the back button loses their template upload, CSV, and positioning.

5. **No loading UI between routes.** Next.js App Router supports `loading.tsx` per segment. Neither route defines one. If the studio page grows in bundle size, users may see a blank screen briefly on first load.

6. **`NEXT_PUBLIC_SITE_URL` must be set in production.** If the environment variable is missing, `metadataBase` falls back to the hardcoded `https://certiq.vercel.app` string — correct for the production Vercel deployment but wrong for any self-hosted instance, producing incorrect OG image URLs.

7. **Blob URL cleanup on studio unmount.** The studio page revokes the template blob URL in a `useEffect` cleanup. If the component unmounts before the cleanup runs (e.g. fast navigation), the browser may briefly hold a dangling blob URL. This is cosmetic but worth monitoring in DevTools if memory pressure is a concern.

---

## Quick-Start Snippet

```tsx
// Add a new route at /about:
// Create app/about/page.tsx — inherits root layout automatically.

export default function AboutPage() {
  return (
    <main>
      <h1>About Certiq</h1>
    </main>
  );
}

// Give /studio its own browser-tab title:
// Add to app/studio/page.tsx (outside the component):

export const metadata = {
  title: "Certiq — Studio",
  description: "Design and export personalised certificates.",
};

// Add a subroute with its own isolated layout at /studio/settings:
// 1. Create app/studio/layout.tsx:
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="studio-shell">{children}</div>;
}
// 2. Create app/studio/settings/page.tsx — renders inside StudioLayout.

// Link between routes:
import Link from "next/link";
<Link href="/studio">Open Studio</Link>
<Link href="/">Back to Home</Link>

// Read the site URL environment variable safely:
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://certiq.vercel.app";
```
