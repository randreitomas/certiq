import { FONT_SANS, FONT_SERIF, certificateFontWeight } from "./fonts";

export type Attendee = { name: string; email?: string };

export const SAMPLE_ATTENDEES: Attendee[] = [
  { name: "Alexandra Morgan", email: "alex@example.com" },
  { name: "Marcus Chen", email: "marcus@example.com" },
  { name: "Sofia Williams", email: "sofia@example.com" },
  { name: "Daniel Kim", email: "daniel@example.com" },
  { name: "Amara Okafor", email: "amara@example.com" },
];

export const SAMPLE_TEMPLATE_PATH = "/sample-template.png";
export const SAMPLE_TEMPLATE_NAME = "TechnoFair certificate";

export const SAMPLE_STYLE_DEFAULTS = {
  x: 50,
  y: 43,
  size: 50,
  color: "#333333",
  font: "'Cormorant Garamond', Garamond, serif",
  uppercase: false,
} as const;

export function loadSampleTemplate() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Sample template failed to load"));
    image.src = SAMPLE_TEMPLATE_PATH;
  });
}

export const NAME_BOX_WIDTH_RATIO = 0.65;
export const NAME_REFERENCE_WIDTH = 740;
export const NAME_LETTER_SPACING = "0.03em";

/** Fixed text-box width in px — like a Photoshop type box boundary. */
export function nameBoxWidth(containerWidth: number) {
  return containerWidth * NAME_BOX_WIDTH_RATIO;
}

/** Usable inner width for text after box padding. */
export function nameTextWidth(containerWidth: number) {
  return nameBoxWidth(containerWidth) - 8;
}

/** Max font size from the Size slider, scaled to the current certificate width. */
export function scaledNameSize(size: number, containerWidth: number) {
  return (size / NAME_REFERENCE_WIDTH) * containerWidth;
}

let textMeasurer: HTMLSpanElement | null = null;

function getTextMeasurer() {
  if (typeof document === "undefined") return null;
  if (!textMeasurer) {
    textMeasurer = document.createElement("span");
    textMeasurer.setAttribute("aria-hidden", "true");
    Object.assign(textMeasurer.style, {
      position: "absolute",
      visibility: "hidden",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      top: "0",
      left: "-9999px",
    });
    document.body.appendChild(textMeasurer);
  }
  return textMeasurer;
}

export function measureNameWidth(
  text: string,
  options: { font: string; weight: string; size: number; letterSpacing?: string },
) {
  const el = getTextMeasurer();
  if (!el) return 0;
  el.textContent = text;
  el.style.fontFamily = options.font;
  el.style.fontWeight = options.weight;
  el.style.fontSize = `${options.size}px`;
  el.style.letterSpacing = options.letterSpacing ?? NAME_LETTER_SPACING;
  return el.getBoundingClientRect().width;
}

/** Shrink from maxFontSize until the full name fits inside the text box. */
export function fitNameInBox(
  text: string,
  options: { font: string; weight: string; maxFontSize: number; boxWidth: number; minSize?: number },
) {
  if (!text || typeof document === "undefined") return options.maxFontSize;

  const minSize = options.minSize ?? Math.max(14, options.maxFontSize * 0.35);
  let low = minSize;
  let high = options.maxFontSize;
  let best = minSize;

  while (low <= high) {
    const mid = Math.round(((low + high) / 2) * 2) / 2;
    const width = measureNameWidth(text, {
      font: options.font,
      weight: options.weight,
      size: mid,
    });
    if (width <= options.boxWidth) {
      best = mid;
      low = mid + 0.5;
    } else {
      high = mid - 0.5;
    }
  }

  return best;
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

export function parseCsv(text: string): Attendee[] {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((row) => row.trim()).map(splitCsvLine);
  if (!rows.length) return [];
  const first = rows[0].map((cell) => cell.toLowerCase());
  const nameIndex = first.findIndex((cell) => ["name", "full name", "fullname", "attendee"].includes(cell));
  const emailIndex = first.findIndex((cell) => cell === "email" || cell === "email address");
  const hasHeader = nameIndex >= 0;
  const actualNameIndex = hasHeader ? nameIndex : 0;
  const attendees: Attendee[] = [];
  for (const row of rows.slice(hasHeader ? 1 : 0)) {
    const name = row[actualNameIndex]?.trim();
    if (!name) continue;
    attendees.push({ name, email: emailIndex >= 0 ? row[emailIndex]?.trim() : undefined });
  }
  return attendees;
}

export function safeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim() || "certificate";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function makeCertificate(
  template: HTMLImageElement | null,
  name: string,
  options: { x: number; y: number; size: number; color: string; font: string; uppercase: boolean },
) {
  const canvas = document.createElement("canvas");
  canvas.width = template?.naturalWidth || 1600;
  canvas.height = template?.naturalHeight || 1131;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");

  if (template) ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
  else {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#fbfaf6");
    gradient.addColorStop(1, "#f1eee5");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e4d3c";
    ctx.lineWidth = 4;
    ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);
    ctx.strokeStyle = "#c3a55d";
    ctx.lineWidth = 2;
    ctx.strokeRect(72, 72, canvas.width - 144, canvas.height - 144);
    ctx.textAlign = "center";
    ctx.fillStyle = "#173f33";
    ctx.font = `600 34px ${FONT_SANS}`;
    ctx.fillText("CERTIQ ACADEMY", canvas.width / 2, 190);
    ctx.fillStyle = "#222b28";
    ctx.font = `600 76px ${FONT_SERIF}`;
    ctx.fillText("Certificate of Achievement", canvas.width / 2, 330);
    ctx.fillStyle = "#6a716e";
    ctx.font = `28px ${FONT_SANS}`;
    ctx.fillText("This certificate is proudly presented to", canvas.width / 2, 445);
    ctx.fillText("for outstanding participation and commitment", canvas.width / 2, 700);
    ctx.strokeStyle = "#c3a55d";
    ctx.beginPath();
    ctx.moveTo(450, 650);
    ctx.lineTo(1150, 650);
    ctx.stroke();
    ctx.font = `600 24px ${FONT_SANS}`;
    ctx.fillStyle = "#173f33";
    ctx.fillText("AUGUST 2026", 440, 900);
    ctx.fillText("EVENT DIRECTOR", 1160, 900);
  }

  const displayName = options.uppercase ? name.toUpperCase() : name;
  const px = (options.x / 100) * canvas.width;
  const py = (options.y / 100) * canvas.height;
  const boxWidth = nameTextWidth(canvas.width);
  const maxFontSize = scaledNameSize(options.size, canvas.width);
  const fittedSize = fitNameInBox(displayName, {
    font: options.font,
    weight: certificateFontWeight(options.font),
    maxFontSize,
    boxWidth,
  });
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = options.color;
  ctx.font = `${certificateFontWeight(options.font)} ${fittedSize}px ${options.font}`;
  ctx.fillText(displayName, px, py);
  return canvas;
}
