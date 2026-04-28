// AC-3 / AC-4: apps/web から apps/api/src/repository および D1Database を直接 import すると
// scripts/lint-boundaries.mjs（既存 boundary 検査）が error を出すことを検証する。
//
// 戦略:
//   1. 違反 snippet を tmp ファイルに書き、lint-boundaries.mjs を spawn で叩いて exit code 1 を確認
//   2. 通常 snippet（forbidden token 不在）では exit code 0
import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "../../../../..");
const SCRIPT = join(REPO_ROOT, "scripts/lint-boundaries.mjs");

const runLint = (cwd: string): { code: number; stderr: string } => {
  const r = spawnSync("node", [SCRIPT], { cwd, encoding: "utf8" });
  return { code: r.status ?? 0, stderr: r.stderr };
};

const setupFakeRepo = (snippet: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "boundary-test-"));
  mkdirSync(join(dir, "apps/web/src"), { recursive: true });
  writeFileSync(join(dir, "apps/web/src/page.tsx"), snippet);
  return dir;
};

describe("AC-3 / AC-4: data access boundary", () => {
  it("apps/web から D1Database を import すると boundary lint が error", () => {
    const dir = setupFakeRepo(
      `import type { D1Database } from "@cloudflare/workers-types";\nexport const x: D1Database = {} as D1Database;\n`,
    );
    try {
      const { code, stderr } = runLint(dir);
      expect(code).toBe(1);
      expect(stderr).toContain("forbidden token");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("apps/web から apps/api を import すると boundary lint が error", () => {
    const dir = setupFakeRepo(
      `import { findByEmail } from "@ubm-hyogo/api/repository/adminUsers";\nexport { findByEmail };\n`,
    );
    try {
      const { code, stderr } = runLint(dir);
      expect(code).toBe(1);
      expect(stderr).toContain("@ubm-hyogo/api");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("通常コードでは boundary lint が pass する", () => {
    const dir = setupFakeRepo(
      `export const greeting = "hello";\nexport function add(a: number, b: number) { return a + b; }\n`,
    );
    try {
      const { code } = runLint(dir);
      expect(code).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
