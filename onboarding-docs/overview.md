# Certiq — Developer Onboarding Overview

> **Synthesised from five independent domain analyses.** Read this document first, then follow the links into the domain-specific docs for deeper detail.

---

## What Certiq Does

Certiq is a browser-only certificate generator. A user uploads a PNG/JPG template and a CSV of attendee names, positions and styles the name text on a live preview, then downloads a ZIP file containing one personalised PNG certificate per attendee.

The defining architectural fact is that **no data ever leaves the browser**. There is no backend, no API, no database, and no file upload. Everything — template loading, CSV parsing, canvas rendering, and ZIP packaging — happens in the user's tab. This is a deliberate privacy guarantee, not an omission.

---

## The Five Areas and How They Connect

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser tab                                                     │
│                                                                  │
│  app/page.tsx (landing)  ──href="/studio"──►  app/studio/page.tsx│
│                                                      │           │
│                         ┌────────────────────────────┤           │
│                         │     LOCAL REACT STATE      │           │
│                         │  templateImage, attendees  │           │
│                         │  x, y, font, size, color   │           │
│                         └────────────────────────────┘           │
│                              │            │                      │
│                    ┌─────────┘            └──────────┐           │
│                    ▼                                 ▼           │
│          app/lib/certificate.ts            app/lib/fonts.ts      │
│          ┌──────────────────┐              ┌─────────────────┐   │
│          │ parseCsv()       │              │ensureCertFont() │   │
│          │ makeCertificate()│◄─────────────│certFontWeight() │   │
│          │ fitNameInBox()   │              └─────────────────┘   │
│          │ downloadBlob()   │                                    │
│          └──────────────────┘                                    │
│                    │                                             │
│                    ▼                                             │
│             Canvas API + JSZip  ──►  Browser download (ZIP)     │
└──────────────────────────────────────────────────────────────────┘
```

| Area | Primary file(s) | Role |
|------|-----------------|------|
| Routing & page structure | `app/layout.tsx`, `app/page.tsx`, `app/studio/page.tsx` | Two-route App Router shell; landing navigates to studio |
| Studio / canvas editor | `app/studio/page.tsx` | All UI state, drag interactions, controls, preview loop |
| CSV ingestion | `app/lib/certificate.ts` (`parseCsv`, `splitCsvLine`) | Turns a raw file into `Attendee[]` consumed by the studio |
| Export pipeline | `app/studio/page.tsx` (`exportZip`) + `app/lib/certificate.ts` (`makeCertificate`, `downloadBlob`) | Renders each attendee's canvas and packages the ZIP |
| Build & test tooling | `package.json`, `eslint.config.mjs`, `tests/rendered-html.test.mjs` | Dev, lint, build, smoke-test, and Vercel deploy |

---

## Data Flow Through the Application

A single user session follows this path:

```
1. User visits /
   └─ app/layout.tsx wraps the page
   └─ app/page.tsx renders landing (server component, static)

2. User clicks "Start creating →"
   └─ Browser navigates to /studio
   └─ app/studio/page.tsx mounts ("use client")
   └─ loadSampleTemplate() pre-fills a demo template from /public/sample-template.png

3. User uploads a certificate template (PNG/JPG)
   └─ handleTemplate() in page.tsx
       └─ Creates blob: URL in memory
       └─ Waits for image.onload → stores HTMLImageElement in templateImage state
       └─ Old blob: URL revoked (memory hygiene)

4. User uploads an attendee CSV
   └─ handleCsv() in page.tsx
       └─ parseCsv() in certificate.ts
           └─ Strips BOM, splits rows, calls splitCsvLine() per row
           └─ Auto-detects "name"/"fullname"/"attendee" header (silent fallback to col 0)
           └─ Returns Attendee[] → stored in attendees state
       └─ selected index reset to 0

5. User drags, resizes, styles the name
   └─ Pointer events update x%, y% state
   └─ snapToCenter() snaps to 50% if within 1.75% threshold
   └─ useLayoutEffect + ResizeObserver reruns on every change:
       └─ ensureCertificateFont() (fonts.ts) — waits for font load
       └─ scaledNameSize() + fitNameInBox() — binary search for largest fitting size
       └─ setPreviewFontSize() — CSS applied to .name-layer button

6. User clicks "Download N certificates"
   └─ exportZip() in page.tsx
       └─ ensureCertificateFont() — font pre-load for canvas context
       └─ For each attendee:
           └─ makeCertificate() (certificate.ts) — draws template + name on off-screen canvas
               └─ fitNameInBox() called again with full canvas dimensions
           └─ canvas.toBlob() → PNG Blob
           └─ zip.file(safeFilename(name), blob)
       └─ zip.generateAsync() → ZIP Blob (DEFLATE level 6)
       └─ downloadBlob() → URL.createObjectURL + anchor click → file saved to disk
```

**Critical coupling point:** `fitNameInBox()` in `app/lib/certificate.ts` is called in two separate contexts — the live preview loop (step 5) and the export renderer (step 6). The inputs differ: the preview uses the CSS container width; the export uses `template.naturalWidth`. Both must produce a consistent visual result. If you change `fitNameInBox`, `NAME_BOX_WIDTH_RATIO`, or `NAME_REFERENCE_WIDTH`, **both** contexts are affected simultaneously.

---

## Important Architectural Decisions and Constraints

### 1. Fully client-side, by design
No `/api/` routes exist. This is intentional: attendee names and certificate templates are treated as sensitive data that must never leave the user's device. Any feature that requires a server (server-side PDF rendering, email delivery, cloud storage) would require a deliberate architectural expansion, not just a backend function.

### 2. `app/lib/certificate.ts` is the system's shared kernel
This single file contains CSV parsing, canvas rendering, text fitting, font utilities, and the download helper. It is imported by `app/studio/page.tsx` for both the live preview and the export, and it is directly tested by `tests/rendered-html.test.mjs`. A breaking change here affects every feature simultaneously.

### 3. All studio state is ephemeral and local
There is no `localStorage`, URL serialisation, or server-side draft storage. State lives only in React's in-memory component tree. Navigating away from `/studio` destroys all work silently. This is the current design; adding persistence would be a significant addition.

### 4. Single global CSS file
All styles for both pages live in `app/globals.css`. There are no CSS Modules or scoped styles. Studio-specific class names (`.studio`, `.certificate`, `.name-layer`) coexist with landing-page class names in the same file, separated only by convention.

### 5. Font loading is a synchronisation point
`ensureCertificateFont()` in `app/lib/fonts.ts` must complete before any text measurement. This contract is upheld in both the preview loop (`useLayoutEffect`) and the export flow (`exportZip`). Any new code path that measures or renders certificate text must follow the same pattern.

### 6. Smoke tests are source-level, not runtime
`tests/rendered-html.test.mjs` reads files with `fs.readFileSync` and checks for string presence. Renaming a key function (e.g. `parseCsv` → `parseAttendeesCsv`) will break the test suite even if the application works correctly. Conversely, the tests will not catch runtime errors.

---

## Most Important Files to Understand First

Read these in order:

1. **`app/lib/certificate.ts`** — The shared kernel. Understand `parseCsv`, `fitNameInBox`, and `makeCertificate` before touching anything else. Changes here have the widest blast radius.

2. **`app/studio/page.tsx`** — The entire application UX. All state variables, event handlers, and the export flow live here. Read it end to end once before making any UI changes.

3. **`app/lib/fonts.ts`** — Short file, but a critical contract. Understand why `ensureCertificateFont()` must precede any canvas text operation.

4. **`app/globals.css`** — The only CSS file. Understand the existing class names before adding new ones to avoid silent collisions.

5. **`app/layout.tsx`** — Root layout. Affects every route's metadata, HTML structure, and global styles.

6. **`tests/rendered-html.test.mjs`** — Read before refactoring. Understand what the smoke tests pin so you don't accidentally break CI by renaming a function.

---

## First 30 Minutes: Onboarding Path

```bash
# 1. Clone and install (2 min)
git clone https://github.com/randreitomas/certiq.git
cd certiq
node --version   # must be >= 20.9.0
npm install

# 2. Create local env (30 sec)
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local

# 3. Start the dev server (1 min)
npm run dev
# → http://localhost:3000        (landing page)
# → http://localhost:3000/studio (editor)
```

**In the browser (5 min):**
- On the landing page, read the three feature steps. They describe the exact user flow.
- Click "Start creating" → you land in `/studio` with a pre-loaded sample template.
- Upload a CSV with a `name` column and try dragging the name label around.
- Click "Download" to generate a ZIP. Confirm it appears in your Downloads folder.

**In the editor (15 min):**
- Open `app/lib/certificate.ts`. Read `parseCsv`, `fitNameInBox`, and `makeCertificate` in full. These three functions are the heart of the system.
- Open `app/studio/page.tsx`. Scan the state variables at the top, then read `exportZip`. Notice how it calls `makeCertificate` for each attendee using the same `(x, y, font, size, color, uppercase)` that the live preview uses.
- Open `app/lib/fonts.ts`. Note the `ensureCertificateFont` contract.

**Verify the build (5 min):**
```bash
npm run lint    # should pass clean
npm test        # full build + 4 smoke tests; expect all passing
```

**Orientation complete.** You now understand: the two-page route structure, the client-side privacy constraint, the shared library that sits between the preview and export, and the one environment variable needed for local development.

---

## Deeper Reading

| Topic | Document |
|-------|---------|
| Drag-to-position mechanics, font-fitting algorithm, preview/export consistency | [`studio-editor.md`](./studio-editor.md) |
| CSV parsing rules, accepted header names, edge cases | [`csv-ingestion.md`](./csv-ingestion.md) |
| Export flow step-by-step, JSZip integration, why it's client-side | [`export-pipeline.md`](./export-pipeline.md) |
| App Router structure, layout file, route extension | [`routing.md`](./routing.md) |
| npm scripts, ESLint config, smoke tests, Vercel deploy | [`build-tooling.md`](./build-tooling.md) |
| Ranked risk map, highest blast-radius areas, safe starting points | [`risk-map.md`](./risk-map.md) |
