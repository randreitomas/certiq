# Studio / Canvas Editor

## Purpose

The Certiq studio editor (`/studio` route) is a three-step certificate personalisation interface that lets users:

1. **Upload template and attendee list** — load a PNG/JPG certificate template and a CSV with attendee names.
2. **Style and position the name** — drag-to-position text on the canvas with live font / size / color / uppercase controls.
3. **Preview and export** — review each attendee's certificate and download all as a ZIP file.

The entire workflow runs client-side in the browser using the HTML Canvas API for rendering and JSZip for batch export. No data is ever uploaded to a server.

---

## Key Files

| File | Purpose |
|------|---------|
| `app/studio/page.tsx` | Main React client component (307 lines); all studio UI and state logic |
| `app/lib/certificate.ts` | Canvas rendering utilities, text-fitting algorithm, CSV parser, download helper |
| `app/lib/fonts.ts` | Font-loading helpers and font-weight lookup |
| `app/globals.css` | All studio CSS: grid layout, canvas panel, draggable name layer, snap guides |

### Key exports from `app/lib/certificate.ts`

| Symbol | Description |
|--------|-------------|
| `makeCertificate(template, name, options)` | Renders one certificate onto a new `<canvas>` element |
| `fitNameInBox(text, options)` | Binary-search algorithm that shrinks font until text fits the box |
| `scaledNameSize(size, containerWidth)` | Maps slider value (24–86 px) to the actual preview pixel size |
| `nameTextWidth(containerWidth)` | Returns usable text box width (65 % of container) |
| `parseCsv(text)` | Parses attendee CSV; auto-detects "name" / "fullname" / "attendee" column |
| `downloadBlob(blob, filename)` | Creates a temporary anchor and triggers a browser download |
| `NAME_BOX_WIDTH_RATIO` | `0.65` — text box is 65 % of certificate width |
| `NAME_REFERENCE_WIDTH` | `740` px — baseline width used for size scaling |
| `SAMPLE_STYLE_DEFAULTS` | `{ x:50, y:43, size:50, color:"#333333", font:"Cormorant Garamond", uppercase:false }` |

### Key exports from `app/lib/fonts.ts`

| Symbol | Description |
|--------|-------------|
| `ensureCertificateFont(font, size)` | Calls `document.fonts.load()` and resolves when the font is ready |
| `certificateFontWeight(font)` | Returns `"600"` or `"700"` depending on the chosen typeface |
| `CERT_FONT_OPTIONS` | Array of available certificate fonts |

---

## How It Works

### 1. Template Upload

**Entry point:** `handleTemplate(file)` in `app/studio/page.tsx` lines 106–119

```typescript
const handleTemplate = (file?: File) => {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    setTemplateUrl((old) => {
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return url;
    });
    setTemplateImage(image);
    setTemplateName(file.name);
  };
  image.src = url;
};
```

- Creates an in-memory blob URL; the image is **never uploaded**.
- Waits for `image.onload` before setting state so `naturalWidth`/`naturalHeight` are available for export.
- Cleans up old blob URLs on replacement to prevent memory leaks.
- `dropFile()` (lines 130–136) delegates to the same handler.

### 2. CSV Upload & Attendee Parsing

**Entry point:** `handleCsv(file)` in `app/studio/page.tsx` lines 121–128

`parseCsv()` in `app/lib/certificate.ts` lines 136–151:
- Removes UTF-8 BOM.
- Auto-detects header row by checking for `"name"`, `"full name"`, `"fullname"`, or `"attendee"` (case-insensitive).
- Falls back to column 0 if no recognised header is found.
- Handles RFC 4180 quoted fields and escaped quotes via `splitCsvLine()`.

### 3. Drag-to-Position Text

State: `x` (0–100 %), `y` (0–100 %), `dragging`, `snapGuideX`.

**Pointer handler:** `moveName()` lines 138–151

```typescript
const moveName = useCallback((event: PointerEvent) => {
  if (!dragging) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const nextX = snapToCenter(
    Math.max(4, Math.min(96, ((event.clientX - rect.left) / rect.width) * 100))
  );
  const nextY = Math.max(8, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100));
  setX(nextX);
  setY(nextY);
  setSnapGuideX(nextX === CENTER);
}, [dragging]);
```

**Snap logic:**
```typescript
const CENTER = 50;
const SNAP_THRESHOLD = 1.75; // in percentage units

function snapToCenter(value: number) {
  return Math.abs(value - CENTER) <= SNAP_THRESHOLD ? CENTER : value;
}
```

Pointer capture is set on `pointerdown` so dragging continues outside the element boundary.

### 4. Font / Size / Color / Uppercase Controls

| Control | State var | Range / Type |
|---------|-----------|-------------|
| Typeface | `font` | String from `CERT_FONT_OPTIONS` |
| Size | `size` | Range input 24–86 px |
| Color | `color` | `<input type="color">` hex string |
| Uppercase | `uppercase` | Boolean toggle |

A `useEffect` calls `ensureCertificateFont(font, size)` whenever `font` or `size` changes to pre-load the font before text measurement.

### 5. Live Preview & Responsive Font Sizing

A `useLayoutEffect` attaches a `ResizeObserver` to the certificate container. On every resize, font change, name change, or template change, it:

1. Awaits `ensureCertificateFont()`.
2. Calculates max font size via `scaledNameSize(size, containerWidth)`.
3. Calls `fitNameInBox()` — a binary search that shrinks from max down to `max * 0.35` until the text fits the 65 % box.
4. Sets `previewFontSize` which is applied to the `.name-layer` button via inline style.

**`fitNameInBox` algorithm** (`app/lib/certificate.ts` lines 88–115):
```typescript
let low = minSize, high = options.maxFontSize, best = minSize;
while (low <= high) {
  const mid = Math.round(((low + high) / 2) * 2) / 2;
  const width = measureNameWidth(text, { font, weight, size: mid });
  if (width <= options.boxWidth) { best = mid; low = mid + 0.5; }
  else { high = mid - 0.5; }
}
return best;
```

### 6. Export ZIP

**Entry point:** `exportZip()` in `app/studio/page.tsx` lines 153–176

Progress: 0–70 % = rendering loop, 70–100 % = ZIP compression.

```typescript
const exportZip = async () => {
  setExporting(true);
  await ensureCertificateFont(font, size);
  const zip = new JSZip();
  for (let index = 0; index < attendees.length; index++) {
    const canvas = makeCertificate(templateImage, attendees[index].name, options);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((v) => v ? resolve(v) : reject(new Error("toBlob failed")), "image/png")
    );
    zip.file(`${safeFilename(attendees[index].name)}.png`, blob);
    setProgress(Math.round(((index + 1) / attendees.length) * 70));
    await new Promise((r) => setTimeout(r, 0)); // yield to UI thread
  }
  const zipBlob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (meta) => setProgress(70 + Math.round(meta.percent * 0.3))
  );
  downloadBlob(zipBlob, `certiq-certificates-${attendees.length}.zip`);
};
```

---

## Gotchas / Risks

1. **Font loading before text measurement** — `fitNameInBox` relies on `measureNameWidth` using `CanvasRenderingContext2D.measureText()`. If the font is not loaded yet, the browser falls back to a system font and returns a wrong width. Always await `ensureCertificateFont()` before calling `fitNameInBox`. The `useLayoutEffect` and `exportZip` both do this, but any new code path that measures text must too.

2. **Canvas coordinate vs. percentage mismatch** — The preview uses 0–100 % positions; `makeCertificate` converts them to pixels via `(options.x / 100) * canvas.width`. If you ever change the canvas size (e.g. downscale for performance), the name will land in the wrong place. Always use `template.naturalWidth` / `template.naturalHeight` — never hardcode dimensions.

3. **ResizeObserver stale closure** — The `cancelled` flag in `useLayoutEffect` guards against state updates after the effect is torn down. If you refactor the effect and remove that flag, rapid resizing or font changes can set stale `previewFontSize` values. Keep the cancellation pattern.

4. **CSV column detection silent fallback** — If no recognised name column header is found, `parseCsv` silently uses column 0. A user with headers like `["ID", "Email", "Full Name"]` will get IDs as certificate names. There is no warning in the UI.

5. **Silent export failure** — `exportZip` has a bare `try/finally`; exceptions are swallowed. `canvas.toBlob()` can fail if the template image is tainted (cross-origin). Users see the button re-enable with no error message or feedback.

6. **Snap threshold is in percentage, not pixels** — `SNAP_THRESHOLD = 1.75` means ~12 px on a 720 px canvas, which is reasonable. If the canvas ever becomes much smaller (e.g. mobile), the snap zone becomes proportionally tiny. Treat it as a magic number.

7. **Attendee index not re-validated on CSV replace** — `handleCsv` resets `selected` to 0 on upload. But if you add another way to clear the attendee list without resetting `selected`, `attendees[selected]` will be `undefined` and the preview silently falls back to "Attendee Name".

8. **Letter spacing not user-controllable** — `NAME_LETTER_SPACING = "0.03em"` is hardcoded. Long names cannot be tightened by users; the only recourse is the font-shrink algorithm.

9. **ZIP filename collisions** — `safeFilename()` replaces special characters with hyphens. Two attendees whose names differ only in special characters (e.g. `José` and `Jose`) will produce the same filename; the second silently overwrites the first in the ZIP.

10. **Progress stalls at 70 % on large exports** — The per-certificate yield (`setTimeout(…, 0)`) keeps the UI responsive but the ZIP compression step (70–100 %) is synchronous-ish. For 500+ attendees, the browser may appear to hang at 70 %. No chunking is implemented.

---

## Quick-Start Snippet

```typescript
// Trigger the file pickers programmatically
imageInputRef.current?.click(); // template PNG/JPG
csvInputRef.current?.click();   // attendee CSV

// Set name position (center, upper-third)
setX(50);
setY(35);

// Apply style options
setFont("'Libre Baskerville', Baskerville, serif");
setSize(64);
setColor("#1a1a1a");
setUppercase(true);

// Add a decorative element to the canvas (modify makeCertificate in app/lib/certificate.ts)
// After ctx.drawImage(template, 0, 0, ...) — line ~177:
ctx.strokeStyle = "#c9a84c";
ctx.lineWidth = 8;
ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80); // gold border

// Debug font sizing
// In useLayoutEffect, add after fitNameInBox:
console.log(`Fitted size: ${previewFontSize}px for "${previewName}" in ${boxWidth}px box`);
```
