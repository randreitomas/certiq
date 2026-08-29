# Export Pipeline

## Purpose

The export pipeline generates personalised certificate PNG images for every attendee in the loaded CSV and packages them into a single downloadable ZIP file. It combines the HTML Canvas API for image rendering with JSZip for client-side archive creation, producing a batch export that requires no server and stores no data outside the user's browser.

---

## Key Files

| File | Lines | Description |
|------|-------|-------------|
| `app/studio/page.tsx` | 153–176 | `exportZip()` — orchestrates the full export flow |
| `app/lib/certificate.ts` | 166–229 | `makeCertificate()` — renders one certificate to a canvas element |
| `app/lib/certificate.ts` | 157–164 | `downloadBlob()` — triggers a browser file download |
| `app/lib/certificate.ts` | 88–115 | `fitNameInBox()` — binary-search text fitting used during render |
| `app/lib/certificate.ts` | 117–151 | `splitCsvLine()` / `parseCsv()` — upstream CSV parsing (see csv-ingestion.md) |
| `package.json` | line 17 | `jszip@3.10.1` dependency |

---

## How It Works

### Design principle: client-side by design, not by accident

Every step of the export pipeline runs entirely in the user's browser. **No file, image, attendee name, or generated certificate is ever sent to a server.** This is an intentional privacy guarantee:

- The certificate template is loaded as an in-memory `blob:` URL — it never leaves the device.
- Attendee names from the CSV are held only in React state — no network request is made.
- `makeCertificate()` draws onto a detached `<canvas>` DOM element that exists only in memory.
- JSZip's `generateAsync()` runs entirely in JavaScript/WebAssembly inside the browser tab.
- The final download is triggered via `URL.createObjectURL()` and a simulated anchor click — the browser saves directly to disk.

The absence of any `/api/` route in the repository is not an oversight; it reflects the product decision that certificate data must stay on the user's device.

---

### Step-by-step flow

#### 1. Export triggered

User clicks **"Download N certificates"** button in `app/studio/page.tsx` line 296.

```typescript
const exportZip = async () => {
  if (!attendees.length || exporting) return;
  setExporting(true);
  setProgress(0);
  // ...
};
```

Guard: `exporting` flag prevents re-entry during an ongoing export.

#### 2. Font pre-loading

```typescript
await ensureCertificateFont(font, size);
```

`ensureCertificateFont()` (`app/lib/fonts.ts`) calls `document.fonts.load()` and resolves only when the chosen typeface is fully available in the browser. This ensures canvas text rendering uses the correct glyphs, not a fallback system font.

#### 3. Rendering loop (progress 0 → 70 %)

```typescript
const zip = new JSZip();
const options = { x, y, size, color, font, uppercase };

for (let index = 0; index < attendees.length; index++) {
  const canvas = makeCertificate(templateImage, attendees[index].name, options);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => value ? resolve(value) : reject(new Error("Image generation failed")),
      "image/png"
    )
  );

  zip.file(`${safeFilename(attendees[index].name)}.png`, blob);
  setProgress(Math.round(((index + 1) / attendees.length) * 70));
  await new Promise((r) => setTimeout(r, 0)); // yield to UI thread
}
```

For each attendee:
1. `makeCertificate()` creates an off-screen `<canvas>`, draws the template image, then renders the fitted name at the stored `(x, y)` position.
2. `canvas.toBlob()` converts the canvas to a PNG `Blob` asynchronously.
3. The blob is added to the JSZip instance under a safe filename.
4. A zero-delay `setTimeout` yields control back to the browser so the progress bar updates remain visible.

**`makeCertificate()` internals** (`app/lib/certificate.ts` lines 166–229):

```typescript
export function makeCertificate(template, name, options) {
  const canvas = document.createElement("canvas");
  canvas.width  = template?.naturalWidth  || 1600;
  canvas.height = template?.naturalHeight || 1131;
  const ctx = canvas.getContext("2d")!;

  if (template) ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
  else { /* draw built-in fallback certificate design */ }

  const displayName = options.uppercase ? name.toUpperCase() : name;
  const px = (options.x / 100) * canvas.width;
  const py = (options.y / 100) * canvas.height;
  const boxWidth = nameTextWidth(canvas.width);
  const fittedSize = fitNameInBox(displayName, { font, weight, maxFontSize, boxWidth });

  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = options.color;
  ctx.font         = `${certificateFontWeight(options.font)} ${fittedSize}px ${options.font}`;
  ctx.fillText(displayName, px, py);

  return canvas;
}
```

#### 4. ZIP compression (progress 70 → 100 %)

```typescript
const zipBlob = await zip.generateAsync(
  { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
  (meta) => setProgress(70 + Math.round(meta.percent * 0.3))
);
```

DEFLATE at level 6 (medium compression). JSZip reports progress through its metadata callback, which drives the final 30 % of the progress bar.

#### 5. Download triggered

```typescript
downloadBlob(zipBlob, `certiq-certificates-${attendees.length}.zip`);
```

**`downloadBlob()`** (`app/lib/certificate.ts` lines 157–164):

```typescript
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
```

The object URL is revoked one second after the click to free memory.

---

## Gotchas / Risks

1. **Large exports exhaust browser memory.**
   All certificate blobs are held in the JSZip instance simultaneously before `generateAsync` is called. For 200+ high-resolution certificates (large `naturalWidth`/`naturalHeight` templates), this can trigger an out-of-memory tab crash. No chunking or streaming is implemented.

2. **Font loading covers the whole batch but not the canvas context.**
   `ensureCertificateFont()` is called once before the loop. If the font is already cached this is fine. However, `makeCertificate()` creates a fresh canvas per iteration; if a font is evicted from the cache mid-export (unusual but possible), later certificates may render with a fallback font and wrong text metrics.

3. **Canvas `toBlob()` fails silently on tainted canvases.**
   If the template image was loaded from a cross-origin source without proper CORS headers, `drawImage()` taints the canvas and `toBlob()` throws a `SecurityError`. The `try/finally` in `exportZip()` swallows this; the user sees the export button re-enable with no feedback and no ZIP.

4. **ZIP filename collisions are silent.**
   `safeFilename()` replaces special characters with hyphens. Two attendees whose names differ only in characters that map to the same safe string (e.g. `José` → `Jose`) produce identical filenames. JSZip will overwrite the earlier entry without warning.

5. **DEFLATE level is hardcoded at 6.**
   There is no user or developer escape hatch. Level 9 would produce smaller ZIPs at higher CPU cost; level 1 would be faster for large exports. Adjust the constant in `exportZip()` if export speed becomes a problem.

6. **Progress stalls visually at ~70 % for large exports.**
   The per-certificate `setTimeout(r, 0)` yield keeps the UI responsive during the rendering loop. The `generateAsync` compression phase, however, runs synchronously in bursts and may cause the browser tab to feel frozen while progress jumps from 70 % to 100 %.

7. **No server-side fallback.**
   There is intentionally no server. If a browser does not support `HTMLCanvasElement.toBlob`, `URL.createObjectURL`, or the required Canvas 2D API (e.g. very old or restricted browsers), the export will fail with no meaningful fallback path.

---

## Quick-Start Snippet

```typescript
// Extend or replicate the export flow in a new context:

import JSZip from "jszip";
import {
  makeCertificate,
  downloadBlob,
  safeFilename,
  ensureCertificateFont,
} from "../lib/certificate";

type StyleOptions = {
  x: number; y: number;
  size: number; color: string;
  font: string; uppercase: boolean;
};

async function exportCertificates(
  attendees: { name: string }[],
  template: HTMLImageElement | null,
  style: StyleOptions,
  onProgress: (pct: number) => void,
) {
  // 1. Ensure font is loaded before any canvas rendering
  await ensureCertificateFont(style.font, style.size);

  const zip = new JSZip();

  // 2. Render each certificate and add to ZIP
  for (let i = 0; i < attendees.length; i++) {
    const canvas = makeCertificate(template, attendees[i].name, style);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (v) => (v ? resolve(v) : reject(new Error("toBlob failed"))),
        "image/png"
      )
    );
    zip.file(`${safeFilename(attendees[i].name)}.png`, blob);
    onProgress(Math.round(((i + 1) / attendees.length) * 70));
    await new Promise((r) => setTimeout(r, 0)); // yield to browser
  }

  // 3. Compress and download
  const zipBlob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (meta) => onProgress(70 + Math.round(meta.percent * 0.3))
  );
  downloadBlob(zipBlob, `certificates-${attendees.length}.zip`);
}
```
