import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { OG_BRAND, OG_LAYOUT, OG_TYPO, titleFontSize } from "../og-tokens";

const tokensCss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../web/src/styles/tokens.css"),
  "utf8",
);

function cssToken(name: string): string {
  const match = tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing CSS token: --${name}`);
  return match[1].trim();
}

function fallbackCssToken(name: string): string {
  const fallbackBlock = tokensCss.match(/@supports not \(color: oklch\(0% 0 0\)\) \{[\s\S]*?:root \{([\s\S]*?)\n  \}/);
  if (!fallbackBlock) throw new Error("Missing sRGB fallback block");
  const match = fallbackBlock[1].match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Missing fallback CSS token: --${name}`);
  return match[1].trim();
}

describe("OG design tokens", () => {
  it("matches the web design-token source of truth hex values", () => {
    expect(OG_BRAND).toMatchObject({
      surface: cssToken("ubm-color-surface-bg"),
      panel: cssToken("ubm-color-surface-panel"),
      ink: cssToken("ubm-color-text-primary"),
      body: cssToken("ubm-color-text-secondary"),
      muted: cssToken("ubm-color-text-muted"),
      line: cssToken("ubm-color-border-default"),
      accent: fallbackCssToken("ubm-color-accent"),
      accentInk: fallbackCssToken("ubm-color-accent-ink"),
      accentSoft: fallbackCssToken("ubm-color-accent-soft"),
    });
    expect(OG_TYPO.eyebrowTracking).toBe(cssToken("ubm-eyebrow-tracking"));
  });

  it("sizes long member names without changing the OG canvas contract", () => {
    expect(OG_LAYOUT.outerPadPx).toBe(64);
    expect(titleFontSize("山田 太郎")).toBe(76);
    expect(titleFontSize("十五文字以上のメンバー氏名追加")).toBe(64);
    expect(titleFontSize("二十九文字以上の非常に長いメンバー名を想定したテスト追加語")).toBe(54);
  });
});
