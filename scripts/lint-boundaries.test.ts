import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = resolve(__dirname, "lint-boundaries.mjs");

let root: string;

function writeWebFile(path: string, body: string): void {
  const fullPath = resolve(root, "apps/web", path);
  mkdirSync(resolve(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, body, "utf8");
}

function run(): { code: number; stderr: string } {
  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd: root,
    encoding: "utf8",
  });
  return { code: result.status ?? 1, stderr: result.stderr ?? "" };
}

beforeEach(() => {
  root = mkdtempSync(resolve(tmpdir(), "lint-boundaries-"));
  mkdirSync(resolve(root, "apps/web/src"), { recursive: true });
  mkdirSync(resolve(root, "apps/api/src"), { recursive: true });
  writeFileSync(resolve(root, "apps/api/src/env.ts"), "export interface Env {}\n", "utf8");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("lint-boundaries.mjs", () => {
  it("allows ordinary web source", () => {
    writeWebFile("src/page.ts", "export const ok = true;\n");

    expect(run().code).toBe(0);
  });

  it("blocks apps/api imports through relative paths", () => {
    writeWebFile("src/probe.ts", 'import type { Env } from "../../api/src/env";\n');

    const result = run();
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("imports forbidden apps/api module via relative path");
  });
});
