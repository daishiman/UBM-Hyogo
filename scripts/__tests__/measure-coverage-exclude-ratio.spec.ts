import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  extractCoverageExcludePatterns,
  measureCoverageExcludeRatio,
  toMarkdown,
} from "../measure-coverage-exclude-ratio";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "exclude-ratio-"));
});

afterEach(async () => {
  await import("node:fs/promises").then((fs) => fs.rm(root, { recursive: true, force: true }));
});

async function put(path: string, body = "export default null\n"): Promise<void> {
  const fullPath = join(root, path);
  await mkdir(join(fullPath, ".."), { recursive: true });
  await writeFile(fullPath, body, "utf8");
}

describe("measureCoverageExcludeRatio", () => {
  it("extracts coverage exclude string patterns", () => {
    const patterns = extractCoverageExcludePatterns(`
      export default defineConfig({
        test: {
          coverage: {
            exclude: [
              "apps/web/app/**/page.tsx",
              'apps/web/app/**/layout.tsx',
            ],
          },
        },
      })
    `);

    expect(patterns).toEqual(["apps/web/app/**/page.tsx", "apps/web/app/**/layout.tsx"]);
  });

  it("measures excluded file ratio against the target root", async () => {
    await put("vitest.config.ts", `
      export default {
        test: {
          coverage: {
            exclude: ["${root}/app/**/page.tsx", "${root}/app/**/layout.tsx"],
          },
        },
      };
    `);
    await put("app/page.tsx");
    await put("app/layout.tsx");
    await put("app/loading.tsx");
    await put("app/page.spec.tsx");
    await put("app/notes.md");

    const result = await measureCoverageExcludeRatio({
      vitestConfigPath: join(root, "vitest.config.ts"),
      targetRoot: join(root, "app"),
      threshold: 0.5,
    });

    expect(result.total_files).toBe(3);
    expect(result.excluded_count).toBe(2);
    expect(result.ratio).toBeCloseTo(2 / 3);
    expect(result.status).toBe("warn");
  });

  it("does not count spec files in the production source denominator", async () => {
    await put("vitest.config.ts", `
      export default {
        test: {
          coverage: {
            exclude: ["**/*.spec.{ts,tsx}", "${root}/app/**/page.tsx"],
          },
        },
      };
    `);
    await put("app/page.tsx");
    await put("app/page.spec.tsx");
    await put("app/loading.tsx");

    const result = await measureCoverageExcludeRatio({
      vitestConfigPath: join(root, "vitest.config.ts"),
      targetRoot: join(root, "app"),
    });

    expect(result.total_files).toBe(2);
    expect(result.excluded_files).not.toContain(expect.stringContaining("page.spec.tsx"));
    expect(result.excluded_count).toBe(1);
    expect(result.ratio).toBe(0.5);
  });

  it("returns ok for an empty target directory", async () => {
    await put("vitest.config.ts", "export default { test: { coverage: { exclude: [] } } }");
    await mkdir(join(root, "app"), { recursive: true });

    const result = await measureCoverageExcludeRatio({
      vitestConfigPath: join(root, "vitest.config.ts"),
      targetRoot: join(root, "app"),
    });

    expect(result.total_files).toBe(0);
    expect(result.ratio).toBe(0);
    expect(result.status).toBe("ok");
  });

  it("renders markdown summary", () => {
    const markdown = toMarkdown({
      measured_at: "2026-05-18T00:00:00.000Z",
      vitest_config_path: "vitest.config.ts",
      target_root: "apps/web/app",
      target_extensions: [".ts", ".tsx"],
      total_files: 1,
      excluded_files: ["apps/web/app/page.tsx"],
      excluded_count: 1,
      ratio: 1,
      threshold: 0.3,
      status: "warn",
    });

    expect(markdown).toContain("ratio: 100.0%");
    expect(markdown).toContain("apps/web/app/page.tsx");
  });
});
