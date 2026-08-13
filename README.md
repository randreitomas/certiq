# Certiq

Create personalized certificates from one template and a CSV — entirely in your browser. No uploads leave your device.

## Features

- Upload a PNG/JPG certificate template and a CSV with a `name` column
- Drag to position names, adjust font, size, color, and uppercase
- Preview each attendee and export all certificates as a ZIP
- Sample template pre-loaded in the studio for quick testing

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/studio](http://localhost:3000/studio) for the editor.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm run start` — run the production server locally
- `npm run lint` — ESLint
- `npm test` — build and run smoke tests

## Deploy on Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Use the default Next.js settings — no extra configuration required

## Tech stack

- [Next.js](https://nextjs.org/) App Router
- React 19
- Tailwind CSS 4
- Client-side canvas export with JSZip
