// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

import {
  buildIdentityConflictCleanupSql,
  buildIdentityConflictSeedSql,
} from "../../../src/testing/identity-conflicts";
import { listIdentityConflicts } from "../../../src/repository/identity-conflict";
import { setupD1, type InMemoryD1 } from "../../../src/repository/__tests__/_setup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEED_DIR = join(__dirname, "..");
const SEED_SQL = readFileSync(join(SEED_DIR, "identity-conflict-staging-seed.sql"), "utf8");
const CLEANUP_SQL = readFileSync(join(SEED_DIR, "identity-conflict-cleanup.sql"), "utf8");

const stripComments = (sql: string): string =>
  sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");

const splitStatements = (sql: string): string[] =>
  stripComments(sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
    .filter((statement) => !/^(BEGIN|COMMIT|END)\s*(TRANSACTION)?$/i.test(statement));

const execAll = async (env: InMemoryD1, sql: string): Promise<void> => {
  for (const statement of splitStatements(sql)) {
    await env.db.exec(statement.replace(/\n/g, " "));
  }
};

const count = async (env: InMemoryD1, table: string, where: string): Promise<number> => {
  const row = await env.db
    .prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`)
    .first<{ c: number }>();
  return row?.c ?? -1;
};

describe("identity conflict staging seed SQL", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
  });

  it("committed seed artifacts match the generator byte-for-byte", () => {
    expect(SEED_SQL).toBe(buildIdentityConflictSeedSql());
    expect(CLEANUP_SQL).toBe(buildIdentityConflictCleanupSql());
  });

  it("seeds 10 members and deterministically produces exactly 5 conflict candidates", async () => {
    await execAll(env, SEED_SQL);
    await execAll(env, SEED_SQL);

    expect(await count(env, "member_identities", "member_id BETWEEN 'TEST-MEM-21' AND 'TEST-MEM-30'")).toBe(10);
    expect(await count(env, "member_status", "member_id BETWEEN 'TEST-MEM-21' AND 'TEST-MEM-30'")).toBe(10);
    expect(await count(env, "response_fields", "response_id BETWEEN 'TEST-RES-21' AND 'TEST-RES-30'")).toBe(60);
    expect(await count(env, "schema_questions", "revision_id = 'TEST-REV-DUP'")).toBe(6);

    const conflicts = await listIdentityConflicts(env.ctx, null, 20);
    expect(conflicts.items).toHaveLength(5);
    expect(conflicts.nextCursor).toBeNull();
    expect(conflicts.items.map((item) => item.conflictId)).toEqual([
      "TEST-MEM-30__TEST-MEM-29",
      "TEST-MEM-28__TEST-MEM-27",
      "TEST-MEM-26__TEST-MEM-25",
      "TEST-MEM-24__TEST-MEM-23",
      "TEST-MEM-22__TEST-MEM-21",
    ]);
    expect(conflicts.items.every((item) => item.matchedFields.join(",") === "name,affiliation")).toBe(true);
  });

  it("cleanup is scoped and idempotent", async () => {
    await execAll(env, SEED_SQL);
    await execAll(env, CLEANUP_SQL);
    await execAll(env, CLEANUP_SQL);

    expect(await count(env, "member_identities", "member_id BETWEEN 'TEST-MEM-21' AND 'TEST-MEM-30'")).toBe(0);
    expect(await count(env, "member_status", "member_id BETWEEN 'TEST-MEM-21' AND 'TEST-MEM-30'")).toBe(0);
    expect(await count(env, "response_fields", "response_id BETWEEN 'TEST-RES-21' AND 'TEST-RES-30'")).toBe(0);
    expect(await count(env, "schema_questions", "revision_id = 'TEST-REV-DUP'")).toBe(0);
  });
});
