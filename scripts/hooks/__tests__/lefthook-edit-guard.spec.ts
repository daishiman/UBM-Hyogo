import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// issue-230: scripts/hooks/lefthook-edit-guard.sh の振る舞い検証（R-1 local / R-2 / R-3 / R-4）
const SCRIPT = resolve(__dirname, "..", "lefthook-edit-guard.sh");

let root: string;

function git(args: string[]): void {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if ((r.status ?? 1) !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  }
}

/** 一時 git repo を初期化し、.git/hooks を空にリセットする。 */
function initRepo(): void {
  git(["init", "-q"]);
  git(["config", "user.email", "t@example.com"]);
  git(["config", "user.name", "Test"]);
  // git init 直後の .sample 群を一旦消して検証を決定的にする
  rmSync(resolve(root, ".git/hooks"), { recursive: true, force: true });
  mkdirSync(resolve(root, ".git/hooks"), { recursive: true });
}

function run(
  ack?: string,
): { code: number; stderr: string; stdout: string } {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.LEFTHOOK_EDIT_ACK;
  if (ack !== undefined) env.LEFTHOOK_EDIT_ACK = ack;
  const r = spawnSync("bash", [SCRIPT], { cwd: root, env, encoding: "utf8" });
  return { code: r.status ?? 1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "lefthook-guard-"));
  initRepo();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("lefthook-edit-guard.sh", () => {
  it("LG-a: clean repo（staged 変更なし・手書き hook なし）は exit 0", () => {
    const r = run();
    expect(r.code).toBe(0);
  });

  it("LG-b: lefthook.yml を stage + ack 無で block（ack 方法/CLAUDE.md/lefthook-operations.md を含む）", () => {
    writeFileSync(resolve(root, "lefthook.yml"), "pre-commit:\n  commands: {}\n");
    git(["add", "lefthook.yml"]);
    const r = run();
    expect(r.code).toBe(1);
    const out = r.stdout + r.stderr;
    expect(out).toContain("LEFTHOOK_EDIT_ACK");
    expect(out).toContain("CLAUDE.md");
    expect(out).toContain("lefthook-operations.md");
  });

  it("LG-c: lefthook.yml を stage + LEFTHOOK_EDIT_ACK=1 で通過", () => {
    writeFileSync(resolve(root, "lefthook.yml"), "pre-commit:\n  commands: {}\n");
    git(["add", "lefthook.yml"]);
    const r = run("1");
    expect(r.code).toBe(0);
  });

  it("LG-d: 手書き .git/hooks/pre-commit（署名なし）を block", () => {
    writeFileSync(resolve(root, ".git/hooks/pre-commit"), "#!/bin/sh\necho custom\n");
    const r = run();
    expect(r.code).toBe(1);
    const out = r.stdout + r.stderr;
    expect(out).toContain("pre-commit");
    expect(out).toContain("CLAUDE.md");
    expect(out).toContain("lefthook-operations.md");
  });

  it("LG-e: .git/hooks/pre-commit.sample は offender にしない（exit 0）", () => {
    writeFileSync(resolve(root, ".git/hooks/pre-commit.sample"), "#!/bin/sh\n");
    const r = run();
    expect(r.code).toBe(0);
  });

  it("LG-h: 拡張子付きバックアップ（.old / .bak）は git が実行しないため offender にしない（exit 0）", () => {
    writeFileSync(resolve(root, ".git/hooks/pre-commit.old"), "#!/bin/sh\necho old\n");
    writeFileSync(resolve(root, ".git/hooks/post-merge.bak"), "#!/bin/sh\necho bak\n");
    const r = run();
    expect(r.code).toBe(0);
  });

  it("LG-f: lefthook 署名入り hook は managed として除外（exit 0）", () => {
    writeFileSync(
      resolve(root, ".git/hooks/pre-commit"),
      "#!/bin/sh\n# LEFTHOOK\nlefthook run pre-commit\n",
    );
    const r = run();
    expect(r.code).toBe(0);
  });

  it("LG-g: MERGE_HEAD 存在時は全 guard を skip（exit 0）", () => {
    // 手書き hook + lefthook.yml stage を両方仕込んでも marker があれば skip
    writeFileSync(resolve(root, ".git/hooks/pre-commit"), "#!/bin/sh\necho custom\n");
    writeFileSync(resolve(root, "lefthook.yml"), "pre-commit:\n  commands: {}\n");
    git(["add", "lefthook.yml"]);
    writeFileSync(resolve(root, ".git/MERGE_HEAD"), "deadbeef\n");
    const r = run();
    expect(r.code).toBe(0);
  });
});
