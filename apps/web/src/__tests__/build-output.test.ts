import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const assetDir = join(__dirname, "../../.open-next/assets/_next/static/chunks");

function readGeneratedCss() {
  if (!existsSync(assetDir)) {
    return "";
  }

  return readdirSync(assetDir)
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(join(assetDir, file), "utf-8"))
    .join("\n");
}

describe("Tailwind build output", () => {
  it("emits token-backed utility selectors after build:cloudflare", () => {
    const css = readGeneratedCss();

    expect(css, "run pnpm --filter @ubm-hyogo/web build:cloudflare first").not.toBe("");
    expect(css).toContain(".bg-accent");
    expect(css).toContain("var(--ubm-color-accent)");
    expect(css).toContain(".text-info");
    expect(css).toContain(".bg-zone-a");
  });
});
