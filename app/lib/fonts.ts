export const FONT_SANS = "'Plus Jakarta Sans', sans-serif";
export const FONT_SERIF = "'Cormorant Garamond', serif";

export const CERT_FONT_OPTIONS = [
  { label: "Garamond", value: "'Cormorant Garamond', Garamond, serif" },
  { label: "Baskerville", value: "'Libre Baskerville', Baskerville, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
] as const;

export const DEFAULT_CERT_FONT = "'Cormorant Garamond', Garamond, serif";

export function certificateFontWeight(font: string) {
  return font.includes("Helvetica") ? "700" : "600";
}

export async function ensureCertificateFont(font: string, size = 48) {
  if (typeof document === "undefined") return;
  const weight = certificateFontWeight(font);
  await document.fonts.load(`${weight} ${size}px ${font}`);
  await document.fonts.ready;
}
