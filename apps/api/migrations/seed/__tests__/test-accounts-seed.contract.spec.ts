// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setupD1, type InMemoryD1 } from "../../../src/repository/__tests__/_setup";
import { buildCleanupSql, buildManifestJson, buildSeedSql } from "../../../src/testing/test-accounts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SEED_DIR = join(__dirname, "..");
const SEED_SQL = readFileSync(join(SEED_DIR, "test-accounts-seed.sql"), "utf8");
const CLEANUP_SQL = readFileSync(join(SEED_DIR, "test-accounts-cleanup.sql"), "utf8");
const MANIFEST_JSON = readFileSync(join(SEED_DIR, "test-accounts.manifest.json"), "utf8");

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

const count = async (env: InMemoryD1, table: string, column: string): Promise<number> => {
  const row = await env.db
    .prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE ${column} LIKE 'TEST-%'`)
    .first<{ c: number }>();
  return row?.c ?? -1;
};

describe("test accounts seed SQL", () => {
  let env: InMemoryD1;

  beforeAll(async () => {
    env = await setupD1();
  });

  it("committed seed artifacts match the generator byte-for-byte", () => {
    expect(SEED_SQL).toBe(buildSeedSql());
    expect(CLEANUP_SQL).toBe(buildCleanupSql());
    expect(MANIFEST_JSON).toBe(buildManifestJson());
  });

  it("seeds 10 members, 3 admins, 3 meetings and remains idempotent", async () => {
    await execAll(env, SEED_SQL);
    await execAll(env, SEED_SQL);
    expect(await count(env, "member_identities", "member_id")).toBe(10);
    expect(await count(env, "member_status", "member_id")).toBe(10);
    expect(await count(env, "admin_users", "admin_id")).toBe(3);
    expect(await count(env, "meeting_sessions", "session_id")).toBe(3);
  });

  it("persists visibility, photos, and escaped answer edge cases", async () => {
    const publicRows = await env.db
      .prepare(
        "SELECT COUNT(*) AS c FROM member_status WHERE member_id LIKE 'TEST-MEM-%' AND public_consent='consented' AND publish_state='public' AND is_deleted=0",
      )
      .first<{ c: number }>();
    const photos = await env.db
      .prepare("SELECT COUNT(*) AS c FROM member_photos WHERE member_id LIKE 'TEST-MEM-%'")
      .first<{ c: number }>();
    const selfPhoto = await env.db
      .prepare(
        "SELECT source, processing_status, thumb_object_key FROM member_photos WHERE member_id='TEST-MEM-09'",
      )
      .first<{ source: string; processing_status: string; thumb_object_key: string | null }>();
    const edge = await env.db
      .prepare("SELECT answers_json FROM member_responses WHERE response_id='TEST-RES-10'")
      .first<{ answers_json: string }>();

    expect(publicRows?.c).toBe(5);
    expect(photos?.c).toBe(4);
    expect(selfPhoto).toEqual({
      source: "self",
      processing_status: "completed",
      thumb_object_key: "test-accounts/TEST-MEM-09/thumb.jpg",
    });
    expect(JSON.parse(edge?.answers_json ?? "{}").fullName).toBe("[TEST] 山田'太郎😀 長い名前エッジケース");
  });

  it("cleanup is idempotent and removes only TEST rows", async () => {
    await execAll(env, CLEANUP_SQL);
    await execAll(env, CLEANUP_SQL);
    expect(await count(env, "member_identities", "member_id")).toBe(0);
    expect(await count(env, "member_status", "member_id")).toBe(0);
    expect(await count(env, "admin_users", "admin_id")).toBe(0);
    expect(await count(env, "meeting_sessions", "session_id")).toBe(0);
  });
});
