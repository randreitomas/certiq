# Build & Test Tooling

## Purpose

Certiq is a Next.js 16 application with a minimal but complete build and test pipeline. This document covers every script in `package.json`, the ESLint flat-config setup, the Node.js-native smoke test suite, and the zero-config Vercel deployment path.

---

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Declares Node ≥ 20.9.0 engine, 5 npm scripts, runtime and dev dependencies |
| `eslint.config.mjs` | ESLint 9 flat config with TypeScript, React, jsx-a11y, react-hooks, and Next.js plugins |
| `next.config.ts` | TypeScript-based Next.js config; currently an empty config object |
| `postcss.config.mjs` | PostCSS pipeline; routes CSS through `@tailwindcss/postcss@4.2.1` |
| `tsconfig.json` | Targets ES2017, uses `bundler` module resolution, strict mode ON, `@/*` path alias |
| `tests/rendered-html.test.mjs` | Smoke test suite using Node.js `node:test`; 4 assertions run after every build |

---

## How It Works

### npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start local development server on `http://localhost:3000` |
| `build` | `next build` | Compile and optimise for production; output in `.next/` |
| `start` | `next start` | Serve the production build locally (requires `build` first) |
| `lint` | `eslint .` | Run ESLint against the entire codebase |
| `test` | `npm run build && node --test tests/*.test.mjs` | Build then run smoke tests |

### ESLint Configuration (`eslint.config.mjs`)

ESLint 9 flat config format — no `.eslintrc.json`. Active plugins:

- **`@eslint/js`** — Core JS rules
- **`typescript-eslint`** — TypeScript-aware rules
- **`eslint-plugin-react`** — React-specific rules
- **`eslint-plugin-jsx-a11y`** — Accessibility checks
- **`eslint-plugin-react-hooks`** — Enforces Rules of Hooks
- **`@next/eslint-plugin-next`** — Next.js best-practice rules

Ignored paths: `.next/`, `dist/`, `out/`, `build/`, `next-env.d.ts`.

### Smoke Tests (`tests/rendered-html.test.mjs`)

Uses the Node.js built-in `node:test` module (no Jest, no Vitest). Four tests run after every production build:

| # | What is tested |
|---|----------------|
| 1 | `package.json` has `name === "certiq"`, `scripts.build === "next build"`, `scripts.dev === "next dev"` |
| 2 | `app/page.tsx` contains `SiteHeader` and `"Start creating"`; `app/studio/page.tsx` contains `"use client"` and `makeCertificate` |
| 3 | Public assets exist: `public/certiq-logo.png`, `public/sample-template.png`, `public/og.png` |
| 4 | `app/lib/certificate.ts` exports `parseCsv` and recognises the column aliases `"name"`, `"full name"`, `"fullname"`, `"attendee"` |

Tests are file-system and source-level assertions — they do not spin up a server or use a browser.

### TypeScript & Path Aliases

- Strict mode is enabled.
- Module resolution is `bundler` (compatible with Next.js and Vite).
- Path alias `@/*` maps to the project root, enabling `import { foo } from "@/app/lib/certificate"`.
- `jsx` is `react-jsx`; no need to `import React` in every file.

### Tailwind CSS v4 via PostCSS

`postcss.config.mjs` runs `@tailwindcss/postcss@4.2.1`. Tailwind is imported at the top of `app/globals.css` via `@import "tailwindcss"`. No `tailwind.config.js` file is needed for the default configuration.

### Vercel Deployment

No `vercel.json` and no `.vercel/` directory exist in the repository. Vercel auto-detects Next.js projects and applies the correct build settings:

1. `npm install`
2. `npm run build` (`next build`)
3. Serves `.next/` output

To deploy: push to the linked GitHub repository. Vercel triggers a build on every push to the default branch.

---

## Gotchas / Risks

1. **Node.js version constraint.** `package.json` declares `"engines": { "node": ">=20.9.0" }`. Ensure local machines, CI runners, and Vercel use Node 20.9.0+. Vercel defaults to an older LTS; set the version in the Vercel project settings or via a `.nvmrc` / `engines` field.

2. **`npm test` always triggers a full production build.** Running tests is expensive (~30–60 s) because `next build` precedes the test runner. There is no watch mode and no way to run tests against the current dev server.

3. **ESLint flat config requires plugin support.** All listed plugins support flat config as of their current versions. If you add a new plugin, verify it exports a flat-config-compatible object before installing; legacy plugins that only export `{ rules: ... }` objects will crash the config loader.

4. **No `vercel.json` = no customisation.** Custom headers, redirects, rewrites, environment variable mappings, or region pinning require a `vercel.json` file. The current setup relies entirely on Vercel defaults.

5. **`NEXT_PUBLIC_SITE_URL` is not set locally.** The variable is read in `app/layout.tsx` for `metadataBase`. Missing it locally causes Next.js to emit a warning and fall back to the hardcoded production URL. Add it to a `.env.local` file for accurate local metadata previews.

6. **Smoke tests are source-level string checks, not integration tests.** They verify file existence and source content with `fs.readFileSync` and `String.includes`. Refactoring a function name or moving a file will break a test even if the application works correctly. Conversely, they will not catch runtime regressions.

7. **Tailwind CSS v4 is a major version upgrade.** Syntax differences from v3 apply (e.g. `@apply` changes, variant syntax). Avoid copy-pasting v3 Tailwind snippets from the internet without checking v4 compatibility.

---

## Quick-Start Snippet

**Exact commands for a brand-new developer, in order:**

```bash
# 1. Clone the repository
git clone https://github.com/randreitomas/certiq.git
cd certiq

# 2. Verify Node.js version (must be >= 20.9.0)
node --version
# If lower, install via nvm: nvm install 20 && nvm use 20

# 3. Install dependencies
npm install

# 4. (Optional) Create a local environment file
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local

# 5. Start the development server
npm run dev
# → App running at http://localhost:3000
# → Studio at   http://localhost:3000/studio

# 6. Run lint checks
npm run lint

# 7. Build and run smoke tests
npm test
# Runs: next build  →  node --test tests/*.test.mjs
# Expect: 4 passing tests

# 8. (Optional) Serve the production build locally
npm run build   # if not already done by npm test
npm start
# → Production server at http://localhost:3000
```

**Deploy to Vercel (zero config):**
```bash
# Push to GitHub (assuming remote is already set up)
git add .
git commit -m "initial commit"
git push origin main
# → Vercel detects the push, runs npm install + npm run build, deploys automatically
```
