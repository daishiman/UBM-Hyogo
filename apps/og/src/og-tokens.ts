export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_BRAND = {
  /*
   * Source: apps/web/src/styles/tokens.css
   * - text/surface/border: :root plain hex tokens
   * - accent tokens: sRGB fallback block for Satori, which cannot render oklch()
   */
  surface: "#f5f4f1", // --ubm-color-surface-bg
  panel: "#ffffff", // --ubm-color-surface-panel
  ink: "#1a1917", // --ubm-color-text-primary
  body: "#57554e", // --ubm-color-text-secondary
  muted: "#8a877e", // --ubm-color-text-muted
  line: "#e7e5df", // --ubm-color-border-default
  accent: "#b08049", // --ubm-color-accent fallback
  accentInk: "#6f4f25", // --ubm-color-accent-ink fallback
  accentSoft: "#f3ece1", // --ubm-color-accent-soft fallback
} as const;

export const OG_TYPO = {
  fontFamily: "Noto Sans JP",
  eyebrowTracking: "0.12em",
  titleMaxFontPx: 76,
  titleMinFontPx: 54,
  titleShrinkThreshold: 14,
  subtitleFontPx: 32,
  eyebrowFontPx: 28,
  footerFontPx: 24,
} as const;

export const OG_LAYOUT = {
  width: OG_SIZE.width,
  height: OG_SIZE.height,
  outerPadPx: 64,
  cardPadPx: 56,
  cardRadiusPx: 36,
  cardBorderPx: 2,
  dotPx: 18,
  stackGapPx: 28,
} as const;

export function titleFontSize(title: string): number {
  const length = [...title].length;
  if (length <= OG_TYPO.titleShrinkThreshold) return OG_TYPO.titleMaxFontPx;
  if (length <= OG_TYPO.titleShrinkThreshold * 2) return 64;
  return OG_TYPO.titleMinFontPx;
}
