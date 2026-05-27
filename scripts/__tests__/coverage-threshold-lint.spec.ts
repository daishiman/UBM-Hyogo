import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  lintCoverageThresholds,
  parseCodecovThreshold,
  parseExecutorThreshold,
  parseSsotThreshold,
  runLint,
} from "../coverage-threshold-lint";

let root: string;

function write(path: string, content: string): void {
  const abs = resolve(root, path);
  mkdirSync(resolve(abs, ".."), { recursive: true });
  writeFileSync(abs, content, "utf8");
}

function writeDefaults(threshold = 80): void {
  write(
    ".claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md",
    [
      "### カバレッジ閾値設定（更新 2026-04-29）",
      "",
      "| パッケージパス | package name | lines | branches | functions | statements |",
      "| --- | --- | --- | --- | --- | --- |",
      `| apps/web | @ubm-hyogo/web | ${threshold}% | ${threshold}% | ${threshold}% | ${threshold}% |`,
      `| apps/api | @ubm-hyogo/api | ${threshold}% | ${threshold}% | ${threshold}% | ${threshold}% |`,
      `| packages/shared | @ubm-hyogo/shared | ${threshold}% | ${threshold}% | ${threshold}% | ${threshold}% |`,
    ].join("\n"),
  );
  write("scripts/coverage-guard.sh", `#!/usr/bin/env bash\nTHRESHOLD=${threshold}\n`);
}

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "coverage-threshold-lint-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("coverage-threshold-lint", () => {
  it("parses the SSOT package threshold table as one value", () => {
    writeDefaults(80);

    const result = lintCoverageThresholds({ rootDir: root });

    expect(result).toMatchObject({ ok: true, threshold: 80 });
  });

  it("fails drift when executor threshold differs from SSOT", () => {
    writeDefaults(80);
    write("scripts/coverage-guard.sh", "THRESHOLD=85\n");

    const result = lintCoverageThresholds({ rootDir: root });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ errorKind: "drift", threshold: 80 });
  });

  it("includes codecov.yml only when present", () => {
    writeDefaults(80);
    write("codecov.yml", "coverage:\n  status:\n    project:\n      default:\n        target: 80%\n        threshold: 1%\n");

    const result = lintCoverageThresholds({ rootDir: root });

    expect(result).toMatchObject({ ok: true, threshold: 80 });
    expect(result.sources.map((source) => source.kind)).toEqual(["ssot", "executor", "codecov"]);
  });

  it("reports codecov drift separately from the two required sources", () => {
    writeDefaults(80);
    write("codecov.yml", "coverage:\n  status:\n    project:\n      default:\n        target: 75%\n");

    const result = lintCoverageThresholds({ rootDir: root });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ errorKind: "drift" });
    if (!result.ok && result.errorKind === "drift") {
      expect(result.mismatches.map((source) => source.kind)).toEqual(["codecov"]);
    }
  });

  it("distinguishes parse failures from drift failures", () => {
    write("scripts/coverage-guard.sh", "THRESHOLD=80\n");
    write(".claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md", "no table\n");

    const result = lintCoverageThresholds({ rootDir: root });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ errorKind: "parse" });
  });

  it("keeps parser helpers deterministic", () => {
    expect(parseExecutorThreshold("THRESHOLD=80 # default coverage gate\n")).toBe(80);
    expect(parseCodecovThreshold("target: 80%\nthreshold: 1%\n")).toBe(80);
    expect(
      parseSsotThreshold(
        [
          "### カバレッジ閾値設定",
          "| パッケージパス | lines | branches | functions | statements |",
          "| --- | --- | --- | --- | --- |",
          "| apps/web | 80% | 80% | 80% | 80% |",
        ].join("\n"),
      ),
    ).toBe(80);
  });

  it("exports the documented runLint alias", () => {
    writeDefaults(80);

    expect(runLint({ rootDir: root })).toMatchObject({ ok: true, threshold: 80 });
  });

  it("prints machine-readable JSON only with --json", () => {
    writeDefaults(80);

    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        resolve(process.cwd(), "scripts/coverage-threshold-lint.ts"),
        "--root",
        root,
        "--json",
      ],
      { encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true, threshold: 80 });
    expect(result.stdout).not.toContain("coverage-threshold-lint: OK");
    expect(result.stderr).toBe("");
  });
});
