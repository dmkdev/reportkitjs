import { Font } from '@react-pdf/renderer';
// Bundled Inter fonts (full builds, Latin + Cyrillic). The `?inline` suffix
// makes Vite embed each file as a base64 data URL at build time, so the PDF
// export has NO runtime network dependency — no CDN, no fetch.
import interRegular from './fonts/Inter-Regular.woff?inline';
import interMedium from './fonts/Inter-Medium.woff?inline';
import interSemiBold from './fonts/Inter-SemiBold.woff?inline';
import interBold from './fonts/Inter-Bold.woff?inline';

/**
 * Font sources for a single family. Each entry is one weight/style.
 * `src` may be a URL, a base64 data URL, or a local file path.
 */
export interface PdfFontSource {
  src: string;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
}

export interface PdfFontOptions {
  /** Family name to register and use in stylesheets. */
  family?: string;
  /** Font sources for the family. Defaults to the bundled Inter fonts. */
  fonts?: PdfFontSource[];
}

/**
 * Default fonts: Inter (full builds, Latin + Cyrillic), bundled into the
 * package as base64 data URLs. The built-in PDF fonts (Helvetica etc.) have
 * no Cyrillic glyphs, so a custom family must be registered for Russian text
 * to render. Because the fonts are inlined, exporting a PDF works fully
 * offline — no CDN or network access is required.
 */
const DEFAULT_FONTS: PdfFontSource[] = [
  { src: interRegular, fontWeight: 400 },
  { src: interMedium, fontWeight: 500 },
  { src: interSemiBold, fontWeight: 600 },
  { src: interBold, fontWeight: 700 },
];

const DEFAULT_FAMILY = 'Inter';

let currentFamily = DEFAULT_FAMILY;
let registered = false;

/**
 * Register a font family for PDF rendering. Call once before exporting
 * (e.g. at app startup) to override the bundled Inter fonts, for example
 * with your own files:
 *
 * ```ts
 * import regular from './fonts/MyFont-Regular.woff?inline';
 * configurePdfFonts({
 *   family: 'MyFont',
 *   fonts: [{ src: regular, fontWeight: 400 }],
 * });
 * ```
 *
 * @returns the family name to use in stylesheets.
 */
export function configurePdfFonts(options: PdfFontOptions = {}): string {
  const family = options.family ?? DEFAULT_FAMILY;
  Font.register({ family, fonts: options.fonts ?? DEFAULT_FONTS });
  currentFamily = family;
  registered = true;
  return family;
}

/**
 * Ensure the default font family is registered and return its name.
 * Safe to call repeatedly.
 */
export function getPdfFontFamily(): string {
  if (!registered) {
    configurePdfFonts();
  }
  return currentFamily;
}
