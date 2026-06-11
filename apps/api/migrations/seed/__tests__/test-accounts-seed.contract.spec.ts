// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setupD1, type InMemoryD1 } from "../../../src/repository/__tests__/_setup";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import type { AttendanceProvider } from "../../../src/repository/attendance";
import { getPublicMemberProfileUseCase } from "../../../src/use-cases/public/get-public-member-profile";
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

const emptyAttendanceProvider: AttendanceProvider = {
  async findByMemberIds() {
    return new Map();
  },
  async findByMemberId() {
    return { records: [], hasMore: false, nextCursor: null };
  },
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
    expect(await count(env, "member_field_visibility", "member_id")).toBe(310);
    expect(await count(env, "schema_questions", "question_pk")).toBe(31);
    expect(await count(env, "admin_users", "admin_id")).toBe(3);
    expect(await count(env, "meeting_sessions", "session_id")).toBe(3);
  });

  it("persists all response fields, visibility, photos, and escaped answer edge cases", async () => {
    const publicRows = await env.db
      .prepare(
        "SELECT COUNT(*) AS c FROM member_status WHERE member_id LIKE 'TEST-MEM-%' AND public_consent='consented' AND publish_state='public' AND is_deleted=0",
      )
      .first<{ c: number }>();
    const responseFields = await env.db
      .prepare("SELECT COUNT(*) AS c FROM response_fields WHERE response_id LIKE 'TEST-RES-%'")
      .first<{ c: number }>();
    const publicVisibility = await env.db
      .prepare(
        "SELECT COUNT(*) AS c FROM member_field_visibility WHERE member_id LIKE 'TEST-MEM-%' AND visibility='public'",
      )
      .first<{ c: number }>();
    const memberVisibility = await env.db
      .prepare(
        "SELECT COUNT(*) AS c FROM member_field_visibility WHERE member_id LIKE 'TEST-MEM-%' AND visibility='member'",
      )
      .first<{ c: number }>();
    const adminVisibility = await env.db
      .prepare(
        "SELECT COUNT(*) AS c FROM member_field_visibility WHERE member_id LIKE 'TEST-MEM-%' AND visibility='admin'",
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
    expect(responseFields?.c).toBe(310);
    expect(publicVisibility?.c).toBe(260);
    expect(memberVisibility?.c).toBe(30);
    expect(adminVisibility?.c).toBe(20);
    expect(photos?.c).toBe(4);
    expect(selfPhoto).toEqual({
      source: "self",
      processing_status: "completed",
      thumb_object_key: "test-accounts/TEST-MEM-09/thumb.jpg",
    });
    expect(JSON.parse(edge?.answers_json ?? "{}").fullName).toBe("[TEST] 山田'太郎😀 長い名前エッジケース");
  });

  it("builds public member detail sections from seeded schema_questions", async () => {
    const result = await getPublicMemberProfileUseCase("TEST-MEM-06", {
      ctx: {
        db: env.db,
        var: { attendanceProvider: emptyAttendanceProvider },
      },
    });
    const publicKeys = new Set(
      result.publicSections.flatMap((section) =>
        section.fields.map((field) => field.stableKey),
      ),
    );

    expect(publicKeys).toContain(STABLE_KEY.businessOverview);
    expect(publicKeys).toContain(STABLE_KEY.urlWebsite);
    expect(publicKeys).toContain(STABLE_KEY.selfIntroduction);
    expect(publicKeys).not.toContain(STABLE_KEY.birthDate);
    expect(publicKeys).not.toContain(STABLE_KEY.challenges);
    expect(publicKeys).not.toContain(STABLE_KEY.publicConsent);
  });

  it("keeps public visibility restricted to public stable keys for TEST-MEM-06", async () => {
    const rows = await env.db
      .prepare(
        "SELECT rf.stable_key, mfv.visibility FROM response_fields rf JOIN member_field_visibility mfv ON mfv.member_id = 'TEST-MEM-06' AND mfv.stable_key = rf.stable_key WHERE rf.response_id = 'TEST-RES-06'",
      )
      .all<{ stable_key: string; visibility: string }>();
    const byKey = new Map(rows.results.map((row) => [row.stable_key, row.visibility]));

    expect(rows.results).toHaveLength(31);
    expect(byKey.get(STABLE_KEY.businessOverview)).toBe("public");
    expect(byKey.get(STABLE_KEY.birthDate)).toBe("member");
    expect(byKey.get(STABLE_KEY.challenges)).toBe("member");
    expect(byKey.get(STABLE_KEY.publicConsent)).toBe("admin");
    expect(byKey.get(STABLE_KEY.rulesConsent)).toBe("admin");
  });

  it("cleanup is idempotent and removes only TEST rows", async () => {
    await execAll(env, CLEANUP_SQL);
    await execAll(env, CLEANUP_SQL);
    expect(await count(env, "member_identities", "member_id")).toBe(0);
    expect(await count(env, "member_status", "member_id")).toBe(0);
    expect(await count(env, "member_field_visibility", "member_id")).toBe(0);
    expect(await count(env, "schema_questions", "question_pk")).toBe(0);
    expect(await count(env, "admin_users", "admin_id")).toBe(0);
    expect(await count(env, "meeting_sessions", "session_id")).toBe(0);
  });
});
