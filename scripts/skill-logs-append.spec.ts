import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { escapeBranch } from "./lib/branch-escape.js";
import { FRAGMENT_NAME_REGEX } from "./lib/fragment-path.js";
import { parseFragment } from "./lib/front-matter.js";
import { CollisionError } from "./lib/retry-on-collision.js";
import { appendFragment } from "./skill-logs-append.js";

let root: string;
const SKILL = "test-skill";

function setupSkillRoot(): void {
  mkdirSync(resolve(root, ".claude", "skills", SKILL), { recursive: true });
}

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "a2-append-"));
  setupSkillRoot();
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("escapeBranch", () => {
  it("lowercases / replaces / and trims to 64 chars", () => {
    expect(escapeBranch("Feat/Foo_Bar")).toBe("feat-foo_bar");
    expect(escapeBranch("a".repeat(80)).length).toBe(64);
  });
});

describe("appendFragment", () => {
  it("C-1: same-second / same-branch — nonce differentiates", async () => {
    const now = new Date("2026-04-28T10:00:00Z");
    const nonces = ["aaaaaaaa", "bbbbbbbb"];
    let i = 0;
    const r1 = await appendFragment({
      skill: SKILL, type: "log", branch: "feat/x", author: "u@e", now,
      rootDir: root, generateNonce: () => nonces[i++]!,
    });
    const r2 = await appendFragment({
      skill: SKILL, type: "log", branch: "feat/x", author: "u@e", now,
      rootDir: root, generateNonce: () => nonces[i++]!,
    });
    expect(r1.absPath).not.toBe(r2.absPath);
    expect(FRAGMENT_NAME_REGEX.test(r1.relPathFromSkillRoot)).toBe(true);
    expect(FRAGMENT_NAME_REGEX.test(r2.relPathFromSkillRoot)).toBe(true);
  });

  it("C-3: nonce collision retries up to 3 times then throws", async () => {
    const now = new Date("2026-04-28T10:00:00Z");
    // Pre-create files at the deterministic nonces to force collisions.
    const nonces = ["11111111", "22222222", "33333333", "44444444"];
    const skillDir = resolve(root, ".claude", "skills", SKILL, "LOGS");
    mkdirSync(skillDir, { recursive: true });
    const branchEsc = escapeBranch("feat/x");
    for (const n of nonces) {
      const fname = `20260428-100000-${branchEsc}-${n}.md`;
      // create the file so collision check sees it
      mkdirSync(skillDir, { recursive: true });
      const fpath = resolve(skillDir, fname);
      writeFileSync(fpath, "x", "utf8");
    }
    let i = 0;
    await expect(
      appendFragment({
        skill: SKILL, type: "log", branch: "feat/x", author: "u@e", now,
        rootDir: root, generateNonce: () => nonces[i++]!,
      }),
    ).rejects.toBeInstanceOf(CollisionError);
  });

  it("writes valid front matter with required keys", async () => {
    const r = await appendFragment({
      skill: SKILL, type: "log", branch: "main", author: "a@b", body: "hello",
      now: new Date("2026-04-28T10:00:00Z"), rootDir: root,
      generateNonce: () => "abcdef01",
    });
    const content = readFileSync(r.absPath, "utf8");
    const parsed = parseFragment(content, r.relPathFromSkillRoot);
    expect(parsed.frontMatter.timestamp).toBe("2026-04-28T10:00:00Z");
    expect(parsed.frontMatter.branch).toBe("main");
    expect(parsed.frontMatter.author).toBe("a@b");
    expect(parsed.frontMatter.type).toBe("log");
    expect(parsed.body.trim()).toBe("hello");
  });

  it("rejects when skill directory not found", async () => {
    await expect(
      appendFragment({
        skill: "no-such-skill", type: "log", rootDir: root, branch: "main",
        author: "a@b", now: new Date(), generateNonce: () => "00000000",
      }),
    ).rejects.toThrow(/skill directory not found/);
  });

  it("rejects invalid fragment type at the API boundary", async () => {
    await expect(
      appendFragment({
        skill: SKILL,
        type: "invalid" as never,
        rootDir: root,
        branch: "main",
        author: "a@b",
        now: new Date(),
        generateNonce: () => "00000000",
      }),
    ).rejects.toThrow(/invalid --type/);
  });

  it("creates LOGS / changelog / lessons-learned directories on demand", async () => {
    for (const t of ["log", "changelog", "lessons-learned"] as const) {
      const r = await appendFragment({
        skill: SKILL, type: t, branch: "main", author: "a@b",
        now: new Date("2026-04-28T10:00:00Z"), rootDir: root,
        generateNonce: () =>
          // unique per type
          (t === "log" ? "00000001" : t === "changelog" ? "00000002" : "00000003"),
      });
      expect(existsSync(r.absPath)).toBe(true);
    }
  });
});
