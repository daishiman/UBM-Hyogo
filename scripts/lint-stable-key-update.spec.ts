import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const script = join(process.cwd(), "scripts", "lint-stable-key-update.mjs");
const fixture = (name: string) => join("scripts", "__fixtures__", "stable-key-update-lint", name);

function run(args: string[]) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const expectsJson = args.includes("--json");
  return {
    status: result.status ?? 0,
    stdout: result.stdout,
    stderr: result.stderr,
    json: expectsJson && result.stdout ? JSON.parse(result.stdout) : null,
  };
}

describe("lint-stable-key-update", () => {
  it("detects direct SQL UPDATE schema_questions SET stable_key", () => {
    const r = run(["--include", fixture("violation-sql-update.ts"), "--strict", "--json"]);
    expect(r.status).toBe(1);
    expect(r.json.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ detector: "sql-direct-update", severity: "error" })]),
    );
  });

  it("detects multiline SQL direct stable_key update", () => {
    const r = run(["--include", fixture("violation-multiline-sql.ts"), "--strict", "--json"]);
    expect(r.status).toBe(1);
    expect(r.json.violations.some((v: { detector: string }) => v.detector === "sql-direct-update")).toBe(true);
  });

  it("detects quoted schema-qualified SQL direct stable_key update", () => {
    const r = run(["--include", fixture("violation-quoted-schema-sql-update.ts"), "--strict", "--json"]);
    expect(r.status).toBe(1);
    expect(r.json.violations.some((v: { detector: string }) => v.detector === "sql-direct-update")).toBe(true);
  });

  it("detects drizzle builder stableKey update", () => {
    const r = run(["--include", fixture("violation-drizzle-update.ts"), "--strict", "--json"]);
    expect(r.status).toBe(1);
    expect(r.json.violations.some((v: { detector: string }) => v.detector === "builder-direct-update")).toBe(true);
  });

  it("detects camelCase stableKey set shorthand", () => {
    const r = run(["--include", fixture("violation-camelcase-set.ts"), "--strict", "--json"]);
    expect(r.status).toBe(1);
    expect(r.json.violations.some((v: { detector: string }) => v.detector === "builder-direct-update")).toBe(true);
  });

  it("allows stable_key reads from schema_questions", () => {
    const r = run(["--include", fixture("allowed-read.ts"), "--strict", "--json"]);
    expect(r.status).toBe(0);
    expect(r.json.violations).toEqual([]);
  });

  it("allows schema_aliases stable_key updates", () => {
    const r = run(["--include", fixture("allowed-alias-update.ts"), "--strict", "--json"]);
    expect(r.status).toBe(0);
    expect(r.json.violations).toEqual([]);
  });

  it("ignores violations in comments", () => {
    const r = run(["--include", fixture("allowed-comment.ts"), "--strict", "--json"]);
    expect(r.status).toBe(0);
    expect(r.json.violations).toEqual([]);
  });

  it("reports function-style mutations as warning only", () => {
    const r = run(["--include", fixture("warning-function-call.ts"), "--strict", "--json"]);
    expect(r.status).toBe(0);
    expect(r.json.violations).toEqual([
      expect.objectContaining({ detector: "function-direct-update", severity: "warning" }),
    ]);
  });

  it("keeps non-strict mode non-fatal for direct update findings", () => {
    const r = run(["--include", fixture("violation-sql-update.ts"), "--json"]);
    expect(r.status).toBe(0);
    expect(r.json.violations).toHaveLength(1);
  });

  it("prints the schema_aliases remediation path", () => {
    const r = run(["--include", fixture("violation-sql-update.ts"), "--strict"]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("schema_aliases / POST /admin/schema/aliases");
  });

  it("scans comma-separated include targets", () => {
    const r = run([
      "--include",
      [fixture("violation-sql-update.ts"), fixture("allowed-read.ts"), fixture("violation-drizzle-update.ts")].join(","),
      "--strict",
      "--json",
    ]);
    expect(r.status).toBe(1);
    expect(r.json.violations).toHaveLength(2);
  });

  it("reports multiple direct updates in one file", () => {
    const r = run(["--include", fixture("violation-multiple-sql-updates.ts"), "--strict", "--json"]);
    expect(r.status).toBe(1);
    expect(r.json.violations).toHaveLength(2);
    expect(r.json.violations.every((v: { snippet?: string }) => typeof v.snippet === "string" && v.snippet.length > 0)).toBe(true);
  });

  it("scans repository without fixture false positives", () => {
    const r = run(["--strict", "--json"]);
    expect(r.status).toBe(0);
    expect(r.json.violations).toEqual([]);
    expect(r.json.scanned).toBeGreaterThan(0);
  });
});
