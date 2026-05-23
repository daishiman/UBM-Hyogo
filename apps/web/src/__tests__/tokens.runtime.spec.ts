import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const tokensCss = readFileSync(resolve(__dirname, "../styles/tokens.css"), "utf-8");
const globalsCss = readFileSync(resolve(__dirname, "../styles/globals.css"), "utf-8");
const postcssCfg = readFileSync(resolve(__dirname, "../../postcss.config.mjs"), "utf-8");
const tailwindCfg = readFileSync(resolve(__dirname, "../../tailwind.config.ts"), "utf-8");

describe("design tokens (tokens.css)", () => {
  it("OKLch palette が全て定義されている", () => {
    const required = [
      "--ubm-color-surface-bg",
      "--ubm-color-surface-bg-2",
      "--ubm-color-surface-panel",
      "--ubm-color-surface-panel-2",
      "--ubm-color-text-primary",
      "--ubm-color-text-secondary",
      "--ubm-color-text-muted",
      "--ubm-color-border-default",
      "--ubm-color-border-strong",
      "--ubm-color-accent",
      "--ubm-color-accent-soft",
      "--ubm-color-accent-ink",
      "--ubm-color-ok",
      "--ubm-color-ok-soft",
      "--ubm-color-warn",
      "--ubm-color-warn-soft",
      "--ubm-color-danger",
      "--ubm-color-danger-soft",
      "--ubm-color-info",
      "--ubm-color-info-soft",
      "--ubm-color-zone-a",
      "--ubm-color-zone-b",
      "--ubm-color-zone-c",
      "--ubm-color-zone-d",
      "--ubm-color-zone-e",
      "--ubm-radius-sm",
      "--ubm-radius-md",
      "--ubm-radius-lg",
      "--ubm-radius-xl",
      "--ubm-radius-2xl",
      "--ubm-shadow-xs",
      "--ubm-shadow-sm",
      "--ubm-shadow-md",
      "--ubm-shadow-lg",
      "--ubm-dur-fast",
      "--ubm-dur-base",
      "--ubm-dur-slow",
      "--ubm-ease-standard",
      "--ubm-ease-emphasized",
      "--ubm-ease-decelerate",
      "--ubm-ease-accelerate",
      "--ubm-font-jp",
      "--ubm-font-en",
      "--ubm-font-serif",
      "--ubm-font-body",
      "--ubm-font-mono",
      "--ubm-text-xs",
      "--ubm-text-sm",
      "--ubm-text-base",
      "--ubm-text-md",
      "--ubm-text-lg",
      "--ubm-text-xl",
      "--ubm-text-2xl",
      "--ubm-text-3xl",
      "--ubm-space-0",
      "--ubm-space-1",
      "--ubm-space-2",
      "--ubm-space-3",
      "--ubm-space-4",
      "--ubm-space-6",
      "--ubm-space-8",
      "--ubm-space-12",
      "--ubm-space-16",
      "--ubm-space-24",
    ];
    for (const t of required) {
      expect(tokensCss, `missing token: ${t}`).toContain(t);
    }
  });

  it("OKLch fallback (@supports not) が宣言されている", () => {
    expect(tokensCss).toMatch(/@supports not \(color:\s*oklch/);
  });

  it("warm/cool theme override が宣言されている", () => {
    expect(tokensCss).toMatch(/\[data-theme="warm"\]/);
    expect(tokensCss).toMatch(/\[data-theme="cool"\]/);
  });
});

describe("globals.css @theme bridge", () => {
  it("@theme inline ブロックが宣言されている", () => {
    expect(globalsCss).toMatch(/@theme\s+inline\s*\{/);
  });

  it("代表的な --color-* / --radius-* / --shadow-* / --font-* が var(--ubm-*) 経由で bridge されている", () => {
    const bridges: Array<[string, string]> = [
      ["--color-surface", "--ubm-color-surface-bg"],
      ["--color-accent", "--ubm-color-accent"],
      ["--color-ok", "--ubm-color-ok"],
      ["--color-info", "--ubm-color-info"],
      ["--color-zone-a", "--ubm-color-zone-a"],
      ["--radius-md", "--ubm-radius-md"],
      ["--shadow-md", "--ubm-shadow-md"],
      ["--font-sans", "--ubm-font-body"],
      ["--text-xs", "--ubm-text-xs"],
      ["--text-sm", "--ubm-text-sm"],
      ["--text-base", "--ubm-text-base"],
    ];
    for (const [tw, ubm] of bridges) {
      const re = new RegExp(`${tw}\\s*:\\s*var\\(${ubm}\\)`);
      expect(globalsCss, `missing bridge: ${tw} -> var(${ubm})`).toMatch(re);
    }
  });

  it('@import "tailwindcss" が globals.css の先頭に存在する', () => {
    expect(globalsCss).toMatch(/^@import\s+["']tailwindcss["']/m);
  });

  it("@source で app / components / utility-probe を CSS-first content scan に明示している", () => {
    expect(globalsCss).toContain('@source "../../app"');
    expect(globalsCss).toContain('@source "../components"');
    expect(globalsCss).toContain('@source "../__tests__/__fixtures__"');
  });
});

describe("postcss / tailwind config", () => {
  it("postcss.config.mjs は @tailwindcss/postcss 1 plugin のみ（autoprefixer なし）", () => {
    expect(postcssCfg).toMatch(/@tailwindcss\/postcss/);
    expect(postcssCfg).not.toMatch(/autoprefixer/);
  });

  it("tailwind.config.ts は content glob のみ（theme.extend / plugins 拡張なし）", () => {
    expect(tailwindCfg).toMatch(/content:\s*\[/);
    expect(tailwindCfg).not.toMatch(/theme:\s*\{\s*extend/);
    expect(tailwindCfg).not.toMatch(/plugins:\s*\[[^\]]+\]/);
  });
});
