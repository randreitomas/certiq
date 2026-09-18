export const FONT_SANS = "'Plus Jakarta Sans', sans-serif";
export const FONT_SERIF = "'Cormorant Garamond', serif";

export const CERT_FONT_OPTIONS = [
  { label: "Cormorant Garamond",  value: "Cormorant Garamond" },
  { label: "Playfair Display",    value: "Playfair Display" },
  { label: "Cinzel",              value: "Cinzel" },
  { label: "Lora",                value: "Lora" },
  { label: "Merriweather",        value: "Merriweather" },
  { label: "Dancing Script",      value: "Dancing Script" },
  { label: "Great Vibes",         value: "Great Vibes" },
  { label: "Raleway",             value: "Raleway" },
  { label: "Montserrat",          value: "Montserrat" },
  { label: "Times New Roman",     value: "Times New Roman" },
] as const;

export const DEFAULT_CERT_FONT = "Cormorant Garamond";

/** Weight that actually exists in the loaded font file for each family */
export function certificateFontWeight(font: string): string {
  if (font.includes("Great Vibes") || font.includes("Dancing Script")) return "400";
  if (font.includes("Merriweather") || font.includes("Montserrat")) return "700";
  return "600";
}

/** For canvas ctx.font */
export function canvasFontString(family: string, weight: string, size: number): string {
  return `${weight} ${size}px "${family}"`;
}

// Map each Google Font family to its URL on Google Fonts CDN
const GFONT_URLS: Record<string, string> = {
  "Cormorant Garamond": "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap",
  "Playfair Display":   "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap",
  "Cinzel":             "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap",
  "Lora":               "https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap",
  "Merriweather":       "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
  "Dancing Script":     "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&display=swap",
  "Great Vibes":        "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap",
  "Raleway":            "https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap",
  "Montserrat":         "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap",
};

const loaded = new Set<string>();

/** Injects a <link> for the font if not already done, then waits for it to be ready */
export async function ensureCertificateFont(font: string, _size = 48): Promise<void> {
  if (typeof document === "undefined") return;

  // System fonts — no loading needed
  if (font === "Times New Roman") return;

  // Already loaded
  if (loaded.has(font)) {
    await document.fonts.ready;
    return;
  }

  const url = GFONT_URLS[font];
  if (!url) {
    await document.fonts.ready;
    return;
  }

  // Inject <link> if not already in DOM
  const linkId = `gfont-${font.replace(/\s+/g, "-").toLowerCase()}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);

    // Wait for the stylesheet to parse
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
      // Fallback timeout
      setTimeout(resolve, 3000);
    });
  }

  // Now wait for the specific font face to be available
  const weight = certificateFontWeight(font);
  try {
    await document.fonts.load(`${weight} 48px "${font}"`);
  } catch {
    // silent fallback
  }

  loaded.add(font);
  await document.fonts.ready;
}
