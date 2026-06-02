import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// issue-230: scripts/verify-hook-integrity.sh の振る舞い検証（R-1 CI 観測面）
const SCRIPT = resolve(__dirname, "..", "verify-hook-integrity.sh");

let root: string;

function git(args: string[]): void {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if ((r.status ?? 1) !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  }
}

function initRepo(): void {
  git(["init", "-q"]);
  git(["config", "user.email", "t@example.com"]);
  git(["config", "user.name", "Test"]);
}

function run(): { code: number; stderr: string; stdout: string } {
  const r = spawnSync("bash", [SCRIPT], { cwd: root, env: { ...process.env }, encoding: "utf8" });
  return { code: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function writeHookScript(rel: string): void {
  const abs = resolve(root, rel);
  mkdirSync(resolve(abs, ".."), { recursive: true });
  writeFileSync(abs, "#!/usr/bin/env bash\nexit 0\n");
}

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "hook-integrity-"));
  initRepo();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("verify-hook-integrity.sh", () => {
  it("VI-a: 参照先実在 + min_version あり + 引数付き run: でも誤検出なし（exit 0）", () => {
    writeHookScript("scripts/hooks/foo.sh");
    writeHookScript("scripts/bar.sh");
    writeFileSync(
      resolve(root, "lefthook.yml"),
      [
        "min_version: 1.6.0",
        "pre-commit:",
        "  commands:",
        "    foo:",
        "      run: bash scripts/hooks/foo.sh",
        "    bar:",
        "      run: bash scripts/bar.sh --changed",
        "",
      ].join("\n"),
    );
    git(["add", "-A"]);
    const r = run();
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("OK");
  });

  it("VI-b: 参照先 script 欠落で exit 1（::error:: と missing パスを含む）", () => {
    writeFileSync(
      resolve(root, "lefthook.yml"),
      [
        "min_version: 1.6.0",
        "pre-commit:",
        "  commands:",
        "    missing:",
        "      run: bash scripts/hooks/missing.sh",
        "",
      ].join("\n"),
    );
    git(["add", "-A"]);
    const r = run();
    expect(r.code).toBe(1);
    const out = r.stdout + r.stderr;
    expect(out).toContain("::error::");
    expect(out).toContain("missing.sh");
  });

  it("VI-c: min_version 行欠落で exit 1", () => {
    writeHookScript("scripts/hooks/foo.sh");
    writeFileSync(
      resolve(root, "lefthook.yml"),
      [
        "pre-commit:",
        "  commands:",
        "    foo:",
        "      run: bash scripts/hooks/foo.sh",
        "",
      ].join("\n"),
    );
    git(["add", "-A"]);
    const r = run();
    expect(r.code).toBe(1);
    const out = r.stdout + r.stderr;
    expect(out).toContain("::error::");
    expect(out).toContain("min_version");
  });

  it("VI-d: tracked stray hook（hooks/pre-commit が commit 済み）で exit 1", () => {
    writeHookScript("scripts/hooks/foo.sh");
    writeFileSync(
      resolve(root, "lefthook.yml"),
      [
        "min_version: 1.6.0",
        "pre-commit:",
        "  commands:",
        "    foo:",
        "      run: bash scripts/hooks/foo.sh",
        "",
      ].join("\n"),
    );
    mkdirSync(resolve(root, "hooks"), { recursive: true });
    writeFileSync(resolve(root, "hooks/pre-commit"), "#!/bin/sh\necho stray\n");
    git(["add", "-A"]);
    git(["commit", "-q", "-m", "fixture"]);
    const r = run();
    expect(r.code).toBe(1);
    const out = r.stdout + r.stderr;
    expect(out).toContain("::error::");
    expect(out).toContain("hooks/pre-commit");
  });
});
