import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = resolve(__dirname, "coverage-guard.sh");

let root: string;

function writeSummary(pkgRel: string, total: {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}): void {
  const dir = resolve(root, pkgRel, "coverage");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    resolve(dir, "coverage-summary.json"),
    JSON.stringify({
      total: {
        lines: { total: 100, covered: total.lines, skipped: 0, pct: total.lines },
        branches: { total: 100, covered: total.branches, skipped: 0, pct: total.branches },
        functions: { total: 100, covered: total.functions, skipped: 0, pct: total.functions },
        statements: { total: 100, covered: total.statements, skipped: 0, pct: total.statements },
      },
    }),
    "utf8",
  );
}

function writePkg(pkgRel: string, name: string): void {
  const dir = resolve(root, pkgRel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    resolve(dir, "package.json"),
    JSON.stringify({ name, private: true, scripts: { "test:coverage": "true" } }),
    "utf8",
  );
}

function run(args: string[] = []): { code: number; stderr: string; stdout: string } {
  const { spawnSync } = require("node:child_process") as typeof import("node:child_process");
  const r = spawnSync("bash", [SCRIPT, "--no-run", ...args], {
    cwd: root,
    env: { ...process.env, COVERAGE_GUARD_ROOT: root },
    encoding: "utf8",
  });
  return { code: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "cov-guard-"));
  // workspace markers
  writeFileSync(resolve(root, "package.json"), JSON.stringify({ name: "fx-root", private: true }));
  writeFileSync(resolve(root, "pnpm-workspace.yaml"), 'packages:\n  - "apps/*"\n  - "packages/*"\n');
  // discoverable packages
  writePkg("apps/api", "@fx/api");
  writePkg("apps/web", "@fx/web");
  writePkg("packages/shared", "@fx/shared");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("coverage-guard.sh", () => {
  it("PASS: 全 package が threshold 以上で exit 0", () => {
    writeSummary("apps/api", { lines: 90, branches: 85, functions: 92, statements: 90 });
    writeSummary("apps/web", { lines: 81, branches: 80, functions: 80, statements: 80 });
    writeSummary("packages/shared", { lines: 100, branches: 100, functions: 100, statements: 100 });

    const result = run();
    expect(result.code).toBe(0);
    expect(result.stderr).toContain("PASS: all packages");
  });

  it("FAIL: いずれかの package で metric 未達なら exit 1 + FAIL ログ", () => {
    writeSummary("apps/api", { lines: 90, branches: 90, functions: 90, statements: 90 });
    writeSummary("apps/web", { lines: 60, branches: 60, functions: 60, statements: 60 });
    writeSummary("packages/shared", { lines: 90, branches: 90, functions: 90, statements: 90 });

    const result = run();
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("FAIL: apps/web lines=60");
    expect(result.stderr).toContain("HINT:");
  });

  it("MISSING: coverage-summary.json 欠損で exit 1", () => {
    writeSummary("apps/api", { lines: 90, branches: 90, functions: 90, statements: 90 });
    // apps/web / packages/shared は summary なし

    const result = run();
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("MISSING: apps/web/coverage/coverage-summary.json");
  });

  it("--threshold で閾値を上書きできる", () => {
    writeSummary("apps/api", { lines: 90, branches: 90, functions: 90, statements: 90 });
    writeSummary("apps/web", { lines: 90, branches: 90, functions: 90, statements: 90 });
    writeSummary("packages/shared", { lines: 90, branches: 90, functions: 90, statements: 90 });

    const result = run(["--threshold", "95"]);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("(< 95%)");
  });

  it("--package で単一 package のみ評価する", () => {
    writeSummary("apps/api", { lines: 90, branches: 90, functions: 90, statements: 90 });
    // apps/web / packages/shared は summary なしだが --package apps/api 限定なら無視される

    const result = run(["--package", "apps/api"]);
    expect(result.code).toBe(0);
    expect(result.stderr).not.toContain("MISSING");
  });
});
