// @vitest-environment node
// T-03 / T-04: seed SQL の構文検証 + cleanup の冪等性。
// In-memory D1 (Miniflare) に migration を流したうえで seed → cleanup を 2 回実行する。
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setupD1, type InMemoryD1 } from "../../../src/repository/__tests__/_setup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEED_DIR = join(__dirname, "..");
const SEED_SQL = readFileSync(join(SEED_DIR, "issue-399-admin-queue-staging-seed.sql"), "utf8");
const CLEANUP_SQL = readFileSync(
  join(SEED_DIR, "issue-399-admin-queue-staging-cleanup.sql"),
  "utf8",
);

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
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => !/^(BEGIN|COMMIT|END)\s*(TRANSACTION)?$/i.test(s));

const execAll = async (env: InMemoryD1, sql: string): Promise<void> => {
  for (const stmt of splitStatements(sql)) {
    await env.db.exec(stmt.replace(/\n/g, " "));
  }
};

const countNotes = async (env: InMemoryD1): Promise<number> => {
  const r = await env.db
    .prepare("SELECT count(*) AS c FROM admin_member_notes WHERE note_id LIKE 'ISSUE399-%'")
    .first<{ c: number }>();
  return r?.c ?? -1;
};

const countMembers = async (env: InMemoryD1): Promise<number> => {
  const r = await env.db
    .prepare("SELECT count(*) AS c FROM member_status WHERE member_id LIKE 'ISSUE399-%'")
    .first<{ c: number }>();
  return r?.c ?? -1;
};

const countDeleted = async (env: InMemoryD1): Promise<number> => {
  const r = await env.db
    .prepare("SELECT count(*) AS c FROM deleted_members WHERE member_id LIKE 'ISSUE399-%'")
    .first<{ c: number }>();
  return r?.c ?? -1;
};

const countAudit = async (env: InMemoryD1): Promise<number> => {
  const r = await env.db
    .prepare("SELECT count(*) AS c FROM audit_log WHERE target_id LIKE 'ISSUE399-%'")
    .first<{ c: number }>();
  return r?.c ?? -1;
};

describe("issue-399 staging seed/cleanup SQL", () => {
  let env: InMemoryD1;

  beforeAll(async () => {
    env = await setupD1();
  });

  it("seed inserts 5 ISSUE399- members and 5 ISSUE399- notes", async () => {
    await execAll(env, SEED_SQL);
    expect(await countMembers(env)).toBe(5);
    expect(await countNotes(env)).toBe(5);
  });

  it("3 visibility_request + 2 delete_request rows are pending", async () => {
    const v = await env.db
      .prepare(
        "SELECT count(*) AS c FROM admin_member_notes WHERE note_id LIKE 'ISSUE399-%' AND note_type='visibility_request' AND request_status='pending'",
      )
      .first<{ c: number }>();
    const d = await env.db
      .prepare(
        "SELECT count(*) AS c FROM admin_member_notes WHERE note_id LIKE 'ISSUE399-%' AND note_type='delete_request' AND request_status='pending'",
      )
      .first<{ c: number }>();
    expect(v?.c).toBe(3);
    expect(d?.c).toBe(2);
  });

  it("seed is idempotent before cleanup", async () => {
    await execAll(env, SEED_SQL);
    expect(await countMembers(env)).toBe(5);
    expect(await countNotes(env)).toBe(5);
  });

  it("cleanup removes runtime byproducts for ISSUE399 members", async () => {
    await env.db.exec(
      "INSERT OR REPLACE INTO deleted_members (member_id, deleted_by, deleted_at, reason) VALUES ('ISSUE399-MEM-D1', 'admin', datetime('now'), 'test')",
    );
    await env.db.exec(
      "INSERT OR REPLACE INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES ('ISSUE399-AUDIT-1', 'admin@example.invalid', 'admin.request.approved', 'member', 'ISSUE399-MEM-D1', NULL, '{}', datetime('now'))",
    );

    await execAll(env, CLEANUP_SQL);
    expect(await countDeleted(env)).toBe(0);
    expect(await countAudit(env)).toBe(0);
    expect(await countMembers(env)).toBe(0);
    expect(await countNotes(env)).toBe(0);
  });

  it("cleanup is idempotent — first run zeroes out, second run remains 0", async () => {
    await execAll(env, CLEANUP_SQL);
    expect(await countMembers(env)).toBe(0);
    expect(await countNotes(env)).toBe(0);

    await execAll(env, CLEANUP_SQL);
    expect(await countMembers(env)).toBe(0);
    expect(await countNotes(env)).toBe(0);
  });
});
