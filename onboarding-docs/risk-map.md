# Certiq — Risk Map

> **How to read this document:** Items are ranked by blast radius — the number of application features that break or misbehave if the area is changed incorrectly. Rank 1 is the highest risk. Each entry lists which source documents flagged the area.

---

## Ranked Risk Areas

---

### Rank 1 — `app/lib/certificate.ts` (entire file)

**Why it has a high blast radius**

This is the only shared library in the application. It is imported by `app/studio/page.tsx` for the live preview, by the export pipeline (`exportZip`), and its exported symbols are directly tested by name in `tests/rendered-html.test.mjs`. There is no layer of indirection: a breaking change in this file breaks everything.

**What depends on it**

- **Live preview** — `fitNameInBox`, `scaledNameSize`, `nameTextWidth` are called inside the `useLayoutEffect` + `ResizeObserver` loop that drives the preview font size on every resize, font change, or name change.
- **Export pipeline** — `makeCertificate`, `fitNameInBox`, `downloadBlob`, `safeFilename` are all called directly from `exportZip`.
- **CSV ingestion** — `parseCsv` and `splitCsvLine` are the sole CSV parsing layer; their output (`Attendee[]`) is the only data source for the export loop.
- **Smoke tests** — `tests/rendered-html.test.mjs` test 4 checks that `parseCsv` is exported and that specific string literals (`"name"`, `"fullname"`, `"attendee"`) appear in the file. Renaming the function or the column aliases breaks CI without breaking the app.
- **Constants** — `NAME_BOX_WIDTH_RATIO` (0.65) and `NAME_REFERENCE_WIDTH` (740) govern both the preview box width and the export canvas box width. Changing either constant changes the visual result across both contexts simultaneously.

**What could break**

- Rename `parseCsv` → smoke test 4 fails; CSV upload silently stops working.
- Change `NAME_BOX_WIDTH_RATIO` → text fits differently in preview vs. export; visual inconsistency across all certificates.
- Change `fitNameInBox` binary-search bounds → text overflows or shrinks too aggressively in both preview and export simultaneously, with no test to catch it.
- Move or split the file → all imports in `page.tsx` break; smoke tests break.

**Source documents:** `studio-editor.md`, `csv-ingestion.md`, `export-pipeline.md`, `build-tooling.md`

---

### Rank 2 — `app/studio/page.tsx` (state management block and `exportZip`)

**Why it has a high blast radius**

This is the single React component that owns all studio state. Every feature — template upload, CSV ingestion, drag positioning, styling controls, live preview, and export — is wired together here through shared state variables. Because there are no sub-components or context providers, all features are coupled to this one component's state.

**What depends on it**

- The entire studio UI. All state variables (`templateImage`, `attendees`, `selected`, `x`, `y`, `font`, `size`, `color`, `uppercase`, `exporting`, `progress`) are declared here.
- The preview loop (`useLayoutEffect`) reads `font`, `size`, `previewName`, `templateUrl`, and `templateImage` — changing any state variable's name or type ripples into the effect.
- `exportZip` captures `x`, `y`, `size`, `color`, `font`, `uppercase`, `attendees`, and `templateImage` via closure at call time. If any of these become stale (e.g. due to a missing dependency in a `useCallback`), the wrong values are baked into the exported certificates.
- The `exporting` flag is the only guard against concurrent exports; removing it allows overlapping runs.
- `handleCsv` resets `selected` to 0 — this is the only place that prevents an out-of-bounds attendee index after a new CSV is loaded.

**What could break**

- Add a new state variable without including it in `exportZip`'s closure → exported certificates use stale styling.
- Refactor the `useLayoutEffect` without preserving the `cancelled` flag → stale closure updates `previewFontSize` after the component re-renders with new data, causing flickering or wrong sizes.
- Remove the `exporting` re-entry guard → two concurrent export runs corrupt the ZIP.
- Clear attendees without resetting `selected` → `attendees[selected]` becomes `undefined`; preview silently shows "Attendee Name" fallback.

**Source documents:** `studio-editor.md`, `export-pipeline.md`, `csv-ingestion.md`

---

### Rank 3 — `app/lib/fonts.ts` (`ensureCertificateFont`)

**Why it has a high blast radius**

`ensureCertificateFont` is a silent pre-condition that must be met before any text measurement or canvas text rendering. It is called in three separate places: the `useEffect` that pre-loads when font or size changes, the `useLayoutEffect` preview loop, and `exportZip`. The contract is implicit — nothing in the type system enforces that callers await it. A developer who adds a new code path that measures or renders text without calling it will get wrong measurements with no error.

**What depends on it**

- **Live preview font sizing** — `fitNameInBox` calls `measureNameWidth` which uses `CanvasRenderingContext2D.measureText`. If the font is not loaded, `measureText` returns the width in the fallback system font. The resulting `previewFontSize` will be wrong for that font.
- **Export canvas rendering** — `makeCertificate` calls `fitNameInBox` internally. If the font was not pre-loaded, the fitted size is computed against the wrong font metrics; certificate text overflows or appears too small.
- **All five certificate fonts** — `certificateFontWeight` in the same file returns different weights per font. If the wrong weight is passed to `ctx.font`, the canvas renders a visually different weight than what `measureText` measured.

**What could break**

- Remove `await ensureCertificateFont()` from `exportZip` → early certificates in a batch render correctly (font cached from preview), later certificates may not if the cache is evicted; inconsistent batch output.
- Add a new font to `CERT_FONT_OPTIONS` without adding it to `certificateFontWeight` → that font gets the default weight, which may be visually wrong and will produce different text metrics.
- Change the `document.fonts.load()` call to a non-awaited form → font loading becomes best-effort; text sizing becomes nondeterministic.

**Source documents:** `studio-editor.md`, `export-pipeline.md`

---

### Rank 4 — `app/globals.css` (shared style foundation)

**Why it has a high blast radius**

This is the only CSS file for the entire application. It contains CSS custom properties consumed by both the landing page and the studio, Tailwind v4 imports, and studio-specific classes that drive the canvas layout, drag behaviour, and name-layer positioning. There are no scoped styles or CSS Modules to contain changes.

**What depends on it**

- **Landing page** — CSS custom properties (`--green`, `--gold`, `--cream`, `--ink`, `--ui-sans`, `--ui-serif`) and layout classes.
- **Studio layout** — `.studio` (3-column grid), `.canvas-panel`, `.left-panel`, `.right-panel`, `.certificate` (aspect-ratio container), `.name-layer` (absolutely positioned draggable button), `.center-guide-v` (snap indicator).
- **Tailwind utilities** — `@import "tailwindcss"` activates Tailwind v4; removing or changing this line breaks all utility classes everywhere.
- **Drag mechanics** — `.certificate { touch-action: none; }` is required for pointer capture on touch devices. `.name-layer { cursor: grab; }` and `:active { cursor: grabbing; }` are part of the drag UX contract.

**What could break**

- Delete or rename `.name-layer` → drag target loses all positioning styles; name label jumps to top-left.
- Remove `touch-action: none` from `.certificate` → drag does not work on mobile/touch devices.
- Change `.certificate`'s aspect-ratio rule → the canvas container's proportions change, shifting the coordinate system that drag percentages map into.
- Add a new class named `.card`, `.step`, or `.preview` → may silently collide with existing landing or studio classes.
- Edit `@import "tailwindcss"` → Tailwind utilities stop working globally.

**Source documents:** `studio-editor.md`, `routing.md`

---

### Rank 5 — Font loading / text measurement contract (cross-cutting)

**Why it has a high blast radius**

This is not a single file but a cross-cutting protocol that spans `app/lib/fonts.ts`, `app/lib/certificate.ts`, and `app/studio/page.tsx`. The correctness guarantee is: *measure text only after the font is loaded*. This contract is currently upheld in three separate call sites. It is not enforced by the type system, not documented at the call sites, and not tested at runtime. A developer who is unaware of it will violate it immediately.

**What depends on it**

- Preview font size calculation (`fitNameInBox` inside `useLayoutEffect`).
- Export font size calculation (`fitNameInBox` inside `makeCertificate`).
- Visual consistency between preview and exported certificates — if the preview loads the font but the export doesn't, names look different sizes in the ZIP than in the preview.

**What could break**

A new developer adds a "copy style" feature that renders a thumbnail without awaiting `ensureCertificateFont`. The thumbnail renders with wrong sizes. Because the failure mode is visual (not a thrown error), it may ship undetected.

**Source documents:** `studio-editor.md`, `export-pipeline.md`

---

### Rank 6 — CSV parsing silent failures (`parseCsv` + `handleCsv`)

**Why it has a high blast radius**

There are two compounding silent failures that affect every certificate generated. First, `parseCsv` silently falls back to column 0 if no recognised name header is found — so a CSV with `id,email,full_name` headers silently produces certificates named with row IDs. Second, `handleCsv` silently exits (`if (!parsed.length) return`) with no UI feedback. A user who uploads the wrong file sees nothing happen. There is no validation layer between the raw file and the `attendees` state that drives the export.

**What depends on it**

- The entire export pipeline. `attendees` is populated solely by `parseCsv`; every certificate name comes from this array.
- The attendee list in the UI and the "Download N certificates" button count.

**What could break**

- A CSV with `ID,Name,Email` headers → `parseCsv` detects `Name` ≠ `"name"` (case-sensitive match fails... actually `name` is checked lowercase, so `Name` lowercased IS `name` — this would actually work). However `id,name,email` in **any case** works because the check is case-insensitive. The real risk is non-standard headers like `FullName` (no space) when provided as `full_name` (underscore not space).
- Duplicate attendee names → two certificates with identical names; one PNG silently overwrites the other in the ZIP via `safeFilename` collision.
- Non-UTF-8 encoded CSV → mojibake characters on every certificate with no error.

**Source documents:** `csv-ingestion.md`, `studio-editor.md`, `export-pipeline.md`

---

### Rank 7 — `app/layout.tsx` (root layout, metadata, global CSS import)

**Why it has a high blast radius**

The root layout wraps every route. A change to the `<body>` tag, the global CSS import, or the `metadata` export affects the entire application. It is also the only place where `NEXT_PUBLIC_SITE_URL` is consumed, so misconfiguring the environment variable here produces incorrect OG image URLs on every page.

**What depends on it**

- Every route's HTML boilerplate.
- Global CSS (`app/globals.css` import).
- Site-wide `<title>` and OG metadata (overridable per-route by exporting `metadata` in a page file, but the root default applies to all routes that don't override it).
- `metadataBase` for absolute URL resolution in OG tags.

**What could break**

- Remove the `globals.css` import → all styling disappears on every page.
- Change `<body className="antialiased">` to add a class that conflicts with studio layout classes → layout corruption in the studio.
- Delete the `metadata` export → Next.js emits a warning and the page has no title or OG tags.

**Source documents:** `routing.md`, `build-tooling.md`

---

### Rank 8 — Smoke test file `tests/rendered-html.test.mjs`

**Why it has a high blast radius**

The smoke tests are source-level string checks. They pin specific symbol names (`parseCsv`, `makeCertificate`), specific string literals (`"use client"`, `SiteHeader`, `"Start creating"`), and specific public asset paths (`public/sample-template.png`, `public/og.png`). Any refactoring that touches these names will break CI even if the application is functionally correct — creating friction that could lead a developer to simply delete or ignore the failing tests.

**What depends on it**

- The CI/CD pipeline (tests run as part of `npm test` which is `npm run build && node --test tests/*.test.mjs`).
- Confidence that `app/lib/certificate.ts` still exports `parseCsv` and still recognises name column aliases.
- Confirmation that required public assets haven't been accidentally deleted.

**What could break**

- Rename `parseCsv` to anything else → test 4 fails even if everything works.
- Move `public/sample-template.png` → test 3 fails; also breaks the sample template pre-load in the studio.
- Refactor `app/page.tsx` so `SiteHeader` is used under a different import alias → test 2 fails.

**Source documents:** `build-tooling.md`, `studio-editor.md`, `csv-ingestion.md`

---

### Rank 9 — `public/sample-template.png` and other public assets

**Why it has a high blast radius**

The studio calls `loadSampleTemplate()` on mount to pre-load `public/sample-template.png` as a demo template. If this file is missing or renamed, the studio loads in a broken state with no template and no user-visible error. Additionally, smoke test 3 asserts the existence of `certiq-logo.png`, `sample-template.png`, and `og.png`. Deleting any of these causes both a runtime regression and a CI failure simultaneously.

**What depends on it**

- Studio initial state (sample template pre-load).
- OG social preview image (`og.png`).
- Site logo in navigation (`certiq-logo.png`).
- Smoke test 3.

**What could break**

- Delete `sample-template.png` → studio opens with no template and a blank canvas; smoke test fails.
- Delete `og.png` → broken social sharing image on all pages.
- Rename any public asset → smoke test fails; any hardcoded reference in source breaks.

**Source documents:** `build-tooling.md`, `routing.md`

---

### Rank 10 — `package.json` (dependency versions and engine constraint)

**Why it has a high blast radius**

The `engines` field (`node >= 20.9.0`) and the exact versions of `next`, `react`, `jszip`, and `tailwindcss` are all load-bearing. Next.js 16 and React 19 are recent; downgrading either breaks App Router behaviour. JSZip 3.10.1 is the only ZIP library; changing it requires updating `exportZip`'s API calls. Tailwind CSS 4 has breaking changes from v3; adding v3 plugins or syntax silently produces wrong styles.

**What depends on it**

- The entire build pipeline (Next.js version).
- The export pipeline (JSZip API).
- All utility classes (Tailwind v4).
- CI and local developer machines (Node version constraint).

**What could break**

- Downgrade Next.js below 16 → App Router features (`app/` directory, `metadata` exports) stop working.
- Replace JSZip with a library that has a different API → `exportZip` breaks.
- Add a Tailwind v3 plugin → config loader crashes or styles are silently wrong.
- Lower the Node version constraint → developers run on Node 18 and hit build incompatibilities.

**Source documents:** `build-tooling.md`, `export-pipeline.md`

---

## Safe Starting Points

These areas are relatively isolated and low-risk for a new developer to explore or modify:

**`app/page.tsx` (landing page)**
A pure server component with no shared state and no library code. Adding content, reordering sections, or updating copy has no effect on the studio or the export pipeline. The only dependency is `app/components/` and the CSS class names in `globals.css`.

**`app/components/` (landing page components)**
`site-header.tsx`, `site-footer.tsx`, `landing-cta.tsx`, `landing-preview.tsx`, and `CardSwap.tsx` are used only on the landing page. Changes here do not affect the studio, CSV parsing, or export.

**`app/studio/page.tsx` — styling controls UI only (not state)**
The JSX for the font dropdown, size slider, color picker, and uppercase toggle is self-contained. Reading and adjusting the UI presentation of these controls (labels, layout, order) is safe as long as the underlying state variables and their connections to `useLayoutEffect` are not touched.

**`tests/rendered-html.test.mjs`**
Adding new smoke test assertions is safe and additive. Deleting or weakening existing assertions should be discussed with the team first (they are the only automated correctness signal the project has).

**`eslint.config.mjs` and `tsconfig.json`**
Tightening lint rules or enabling additional TypeScript checks adds safety. Loosening them (disabling rules, turning off strict mode) reduces safety but does not affect runtime behaviour.

**`app/layout.tsx` — metadata only**
Adding per-route `metadata` exports to `app/studio/page.tsx` (to give `/studio` its own `<title>`) does not affect the root layout and is safe. Modifying the root layout's `<body>` or CSS import is Rank 7 territory.

**Public asset additions**
Adding new images to `public/` does not affect any existing code. The risk only arises when *renaming or deleting* existing assets.
