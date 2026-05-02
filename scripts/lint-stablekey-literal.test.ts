// 03a AC-7: stableKey リテラル直書き禁止 rule のユニットテスト
// Phase 4 test matrix と Phase 6 violation fixture spec をカバーする。

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const lintScript = join(repoRoot, "scripts", "lint-stablekey-literal.mjs");

interface LintViolation {
  file: string;
  line: number;
  col: number;
  value: string;
  kind: "string" | "template";
}

interface LintReport {
  mode: "warning" | "error";
  stableKeyCount: number;
  allowList: string[];
  violations: LintViolation[];
}

function runLint(extraArgs: string[] = []): { code: number | null; report: LintReport } {
  const r = spawnSync("node", [lintScript, "--json", ...extraArgs], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return { code: r.status, report: JSON.parse(r.stdout) as LintReport };
}

describe("lint-stablekey-literal", () => {
  it("loads exactly 31 stableKeys from field.ts", () => {
    const { report } = runLint();
    expect(report.stableKeyCount).toBe(31);
  });

  it("declares the documented allow-list entries", () => {
    const { report } = runLint();
    expect(report.allowList).toContain("packages/shared/src/zod/field.ts");
    expect(report.allowList).toContain("packages/integrations/google/src/forms/mapper.ts");
  });

  it("does not flag the supply modules themselves (allow-list)", () => {
    const { report } = runLint();
    const fromSupply = report.violations.filter(
      (v) =>
        v.file === "packages/shared/src/zod/field.ts" ||
        v.file === "packages/integrations/google/src/forms/mapper.ts",
    );
    expect(fromSupply).toHaveLength(0);
  });

  it("does not flag .test.ts files (exception glob)", () => {
    const { report } = runLint();
    const fromTests = report.violations.filter((v) => /\.test\.(ts|tsx)$/.test(v.file));
    expect(fromTests).toHaveLength(0);
  });

  it("does not flag __fixtures__ files (exception glob)", () => {
    const { report } = runLint();
    const fromFixtures = report.violations.filter((v) => /__fixtures__/.test(v.file));
    expect(fromFixtures).toHaveLength(0);
  });

  it("default mode is warning (exit 0 even with violations)", () => {
    const { code } = runLint();
    expect(code).toBe(0);
  });

  it("strict mode exits non-zero when violations exist", () => {
    const { code, report } = runLint(["--strict"]);
    if (report.violations.length > 0) {
      expect(code).toBe(1);
    } else {
      expect(code).toBe(0);
    }
  });

  it("can directly scan Phase 6 violation fixtures even though fixtures are excluded from default scan", () => {
    const { code, report } = runLint([
      "--strict",
      "--include",
      "scripts/__fixtures__/stablekey-literal-lint/violation.ts,scripts/__fixtures__/stablekey-literal-lint/edge.ts",
    ]);
    expect(code).toBe(1);
    expect(report.violations.map((v) => v.value)).toEqual([
      "fullName",
      "nickname",
      "ubmZone",
      "publicConsent",
    ]);
  });

  it("does not report stableKey strings that appear only in comments", () => {
    const { report } = runLint([
      "--include",
      "scripts/__fixtures__/stablekey-literal-lint/edge.ts",
    ]);
    expect(report.violations).toEqual([
      expect.objectContaining({ value: "publicConsent", kind: "template" }),
    ]);
  });
});
