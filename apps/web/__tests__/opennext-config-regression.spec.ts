import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../../..");
const wranglerPath = resolve(repoRoot, "apps/web/wrangler.toml");
const packageJsonPath = resolve(repoRoot, "apps/web/package.json");
const assetsIgnorePath = resolve(repoRoot, "apps/web/.assetsignore");
const openNextConfigPath = resolve(repoRoot, "apps/web/open-next.config.ts");
const appDir = resolve(repoRoot, "apps/web/app");
const srcDir = resolve(repoRoot, "apps/web/src");

type TomlValue = string | string[] | boolean;
type TomlSection = Record<string, TomlValue>;

function parseWranglerToml(): Record<string, TomlSection> {
  const sections: Record<string, TomlSection> = { "": {} };
  let current = "";

  for (const rawLine of readFileSync(wranglerPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      current = sectionMatch[1];
      sections[current] ??= {};
      continue;
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/);
    if (!keyValueMatch) {
      continue;
    }

    const [, key, rawValue] = keyValueMatch;
    sections[current][key] = parseTomlValue(rawValue);
  }

  return sections;
}

function parseTomlValue(rawValue: string): TomlValue {
  const value = rawValue.trim();
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    return Array.from(value.matchAll(/"([^"]+)"/g), ([, item]) => item);
  }
  const quoted = value.match(/^"([^"]*)"$/);
  return quoted ? quoted[1] : value;
}

function listTextFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...listTextFiles(fullPath));
      continue;
    }
    if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("OpenNext Workers config regression guard", () => {
  const wrangler = parseWranglerToml();

  it("keeps apps/web wrangler.toml on OpenNext Workers, not Pages output", () => {
    expect(wrangler[""]).not.toHaveProperty("pages_build_output_dir");
    expect(wrangler[""]).toMatchObject({
      main: ".open-next/worker.js",
      compatibility_flags: ["nodejs_compat"],
    });
  });

  it("declares static assets binding at top-level and in each deploy env", () => {
    for (const section of ["assets", "env.staging.assets", "env.production.assets"]) {
      expect(wrangler[section], `[${section}]`).toMatchObject({
        directory: ".open-next/assets",
        binding: "ASSETS",
        not_found_handling: "single-page-application",
      });
    }
  });

  it("does not reintroduce package-level deploy scripts that bypass scripts/cf.sh", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts).not.toHaveProperty("deploy");
    expect(packageJson.scripts).not.toHaveProperty("deploy:staging");
    expect(packageJson.scripts).not.toHaveProperty("deploy:production");
  });

  it("keeps non-asset development files out of the Workers Static Assets upload", () => {
    const lines = new Set(
      readFileSync(assetsIgnorePath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    );

    for (const requiredLine of ["node_modules", ".DS_Store", ".git", "*.map", "*.test.*", "*.spec.*", "__tests__"]) {
      expect(lines.has(requiredLine), `${requiredLine} is listed in apps/web/.assetsignore`).toBe(true);
    }
  });

  it("keeps OpenNext production minification enabled by not opting into debug output", () => {
    const config = readFileSync(openNextConfigPath, "utf8");

    expect(config).toContain("defineCloudflareConfig");
    expect(config).not.toMatch(/OPEN_NEXT_DEBUG\s*[:=]\s*['"]?1/);
    expect(config).not.toMatch(/debug\s*:\s*true/);
  });

  it("does not reintroduce next/og ImageResponse into the Worker bundle sources", () => {
    const source = listTextFiles(appDir)
      .concat(listTextFiles(srcDir))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");

    expect(source).not.toMatch(/from\s+["']next\/og["']/);
    expect(source).not.toContain("ImageResponse");
  });
});
