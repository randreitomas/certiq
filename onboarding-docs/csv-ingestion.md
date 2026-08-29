# CSV Ingestion & Validation

## Purpose

Certiq parses attendee CSV files to generate personalised certificates. The CSV parser extracts attendee names (required) and optionally email addresses from uploaded files. It supports flexible column naming conventions and RFC 4180 quote handling entirely in the browser — no file is sent to a server.

---

## Key Files

| File | Lines | Description |
|------|-------|-------------|
| `app/lib/certificate.ts` | 117–151 | `splitCsvLine()` and `parseCsv()` — the entire parsing and validation layer |
| `app/studio/page.tsx` | 121–128 | `handleCsv(file)` — file upload handler that calls `parseCsv()` and updates UI state |

### Type definition (`app/lib/certificate.ts`)

```typescript
type Attendee = { name: string; email?: string };
```

---

## How It Works

### 1. File Upload Handler

**`handleCsv(file)`** in `app/studio/page.tsx` lines 121–128:

```typescript
const handleCsv = async (file?: File) => {
  if (!file) return;
  const parsed = parseCsv(await file.text());
  if (!parsed.length) return;   // silent early exit on empty result
  setAttendees(parsed);
  setCsvName(file.name);
  setSelected(0);
};
```

- Reads the file as UTF-8 text via `File.text()`.
- Passes the raw string to `parseCsv()`.
- Silently returns without any error UI if the result is empty.

### 2. Main Parse Entry Point

**`parseCsv(text)`** in `app/lib/certificate.ts` lines 136–151:

```typescript
export function parseCsv(text: string): Attendee[] {
  const rows = text
    .replace(/^\uFEFF/, "")         // strip UTF-8 BOM
    .split(/\r?\n/)                  // handle \n and \r\n
    .filter((row) => row.trim())     // drop blank lines
    .map(splitCsvLine);              // parse each line

  if (!rows.length) return [];

  const first = rows[0].map((cell) => cell.toLowerCase());
  const nameIndex  = first.findIndex((cell) =>
    ["name", "full name", "fullname", "attendee"].includes(cell));
  const emailIndex = first.findIndex((cell) =>
    cell === "email" || cell === "email address");
  const hasHeader = nameIndex >= 0;
  const actualNameIndex = hasHeader ? nameIndex : 0;

  const attendees: Attendee[] = [];
  for (const row of rows.slice(hasHeader ? 1 : 0)) {
    const name = row[actualNameIndex]?.trim();
    if (!name) continue;            // skip rows with empty name
    attendees.push({
      name,
      email: emailIndex >= 0 ? row[emailIndex]?.trim() : undefined,
    });
  }
  return attendees;
}
```

### 3. Quote-Aware Line Parser

**`splitCsvLine(line)`** in `app/lib/certificate.ts` lines 117–134:

Implements RFC 4180 rules:
- Recognises cells wrapped in double-quotes.
- Treats `""` inside a quoted cell as a literal `"`.
- Respects commas inside quoted cells.
- Trims whitespace from every cell.

```typescript
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"')              { quoted = !quoted; }
    else if (char === "," && !quoted)  { cells.push(cell.trim()); cell = ""; }
    else                                { cell += char; }
  }
  cells.push(cell.trim());
  return cells;
}
```

### 4. Accepted CSV Formats

**Standard (recommended):**
```csv
name,email
John Smith,john@example.com
Jane Doe,jane@example.com
```

**Flexible headers (all equivalent):**
```csv
Full Name,Email Address
attendee
ATTENDEE
```

**No header row (first column used as name):**
```csv
John Smith,john@example.com
Jane Doe,jane@example.com
```

**Quoted cells with commas:**
```csv
name
"Smith, Jr., John"
"Jane ""JJ"" Doe"
```

---

## Gotchas / Risks

1. **Missing "name" column — silent fallback to column 0.**
   If the CSV header contains no recognised name-column label (`name`, `full name`, `fullname`, `attendee`), `parseCsv` silently treats column 0 as names. A CSV like `id,email,full_name` will produce certificate names that are row IDs. There is no warning in the UI.

2. **No header row — first data row is not skipped.**
   When `nameIndex === -1`, `hasHeader` is `false` and the loop starts from `rows[0]`. This means the first data row is included as an attendee. However, if the first row looks like a header (e.g. `Name,Email` where `Name` ≠ `"name"`), that header text becomes a certificate name.

3. **Empty rows skipped silently.**
   Rows where the resolved name cell is empty are dropped via `if (!name) continue`. There is no counter or warning; the UI will show fewer attendees than the file contains.

4. **Duplicate names allowed.**
   No deduplication is performed. Identical names produce identical certificates. If `safeFilename()` returns the same string for two attendees, the second PNG will overwrite the first inside the ZIP.

5. **Non-UTF-8 encodings not handled.**
   The BOM (`\uFEFF`) is stripped, but no charset detection or conversion is done. A Latin-1 or Windows-1252 file will parse without error but produce mojibake characters in certificate names.

6. **Unmatched quotes.**
   If a cell opens a quote that is never closed (e.g. `"Smith, Jr.`), `splitCsvLine` stays in `quoted = true` mode for the rest of the line, swallowing commas and producing one giant cell.

7. **Old Mac line endings (`\r` only) not supported.**
   The regex `\r?\n` handles `\n` and `\r\n` but not standalone `\r`. A file saved by very old Mac software will be treated as a single line.

8. **Trailing commas create phantom empty columns.**
   `name,email,` produces a third empty cell per row. This is harmless unless the name or email column happens to be at the last index.

9. **Silent failure propagates to the UI.**
   `handleCsv` returns early with no feedback (`if (!parsed.length) return;`). Users who upload a JSON file, XLSX, or a CSV with no recognised name column see nothing happen — no toast, no error state.

10. **Whitespace inside names is preserved.**
    Only leading/trailing whitespace is trimmed. A name like `"John  Smith"` (double space) reaches the canvas unchanged and may affect text width measurement.

---

## Quick-Start Snippet

```typescript
import { parseCsv } from "../lib/certificate";

// Read file from an <input type="file"> element
const file = inputElement.files?.[0];
if (!file) return;

const text = await file.text();
const attendees = parseCsv(text);

if (attendees.length === 0) {
  // parseCsv returns [] for empty files, no-name-column CSVs, etc.
  // Add explicit user-facing feedback here — none exists today.
  console.warn("No valid attendees parsed. Check column headers.");
  return;
}

console.log(`Loaded ${attendees.length} attendees`);
attendees.forEach(({ name, email }) =>
  console.log(`  ${name}${email ? ` <${email}>` : ""}`)
);

// Example: force a specific column by preprocessing before parse
// (workaround for non-standard headers)
const renamed = rawCsvText.replace(/^FullName,/i, "name,");
const fixed = parseCsv(renamed);
```

**Minimal valid CSV:**
```csv
name
Alice Johnson
Bob Chen
```

**All supported header aliases (case-insensitive):**
- `name`
- `full name`
- `fullname`
- `attendee`

**All supported email header aliases (case-insensitive):**
- `email`
- `email address`
