// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { D1Database } from "@cloudflare/workers-types";
import { setupD1 } from "../../src/repository/__tests__/_setup";

const migrationSql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "0026_member_status_fk_constraint.sql"),
  "utf8",
)
  .replace(/^--.*$/gm, "")
  .replace(/\s+/g, " ")
  .trim();

const backfillSql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "0025_backfill_member_status.sql"),
  "utf8",
)
  .replace(/^--.*$/gm, "")
  .replace(/\s+/g, " ")
  .trim();

const createLegacyMemberStatusTable = async (db: D1Database): Promise<void> => {
  await db.exec(
    "CREATE TABLE member_status (member_id TEXT PRIMARY KEY, public_consent TEXT NOT NULL DEFAULT 'unknown', rules_consent TEXT NOT NULL DEFAULT 'unknown', publish_state TEXT NOT NULL DEFAULT 'member_only', is_deleted INTEGER NOT NULL DEFAULT 0, hidden_reason TEXT, last_notified_at TEXT, updated_by TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')), notification_opt_out INTEGER NOT NULL DEFAULT 0)",
  );
};

const seedIdentity = async (db: D1Database, memberId: string): Promise<void> => {
  await db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES (?1, ?2, ?3, ?3, '2026-06-05T00:00:00Z')`,
    )
    .bind(memberId, `${memberId}@example.com`, `response-${memberId}`)
    .run();
};

const getSingleStatusRow = async (db: D1Database, memberId: string): Promise<Record<string, unknown>> => {
  const row = await db
    .prepare("SELECT * FROM member_status WHERE member_id = ?1")
    .bind(memberId)
    .first<Record<string, unknown>>();
  if (!row) throw new Error(`member_status row not found: ${memberId}`);
  return row;
};

describe("0026_member_status_fk_constraint", () => {
  it("declares the member_status.member_id foreign key", async () => {
    const env = await setupD1();

    const foreignKeys = await env.db.prepare("PRAGMA foreign_key_list(member_status)").all<{
      table: string;
      from: string;
      to: string;
    }>();

    expect(foreignKeys.results).toContainEqual(
      expect.objectContaining({
        table: "member_identities",
        from: "member_id",
        to: "member_id",
      }),
    );
  });

  it("rejects orphan member_status rows when foreign_keys is enabled", async () => {
    const env = await setupD1();
    await env.db.exec("PRAGMA foreign_keys = ON");

    await expect(
      env.db.prepare("INSERT INTO member_status (member_id) VALUES ('ghost-member')").run(),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/i);
  });

  it("allows valid member_status rows and preserves all current columns on reapply", async () => {
    const env = await setupD1();
    await env.db.exec("PRAGMA foreign_keys = ON");
    await seedIdentity(env.db, "m-data");
    await env.db
      .prepare(
        `INSERT INTO member_status
          (member_id, public_consent, rules_consent, publish_state, is_deleted,
           hidden_reason, last_notified_at, updated_by, updated_at, notification_opt_out)
         VALUES
          ('m-data', 'consented', 'consented', 'public', 0,
           'manual', '2026-06-02T00:00:00Z', 'admin-1', '2026-06-02T01:00:00Z', 1)`,
      )
      .run();

    const before = await getSingleStatusRow(env.db, "m-data");
    await env.db.exec(migrationSql);
    await env.db.exec(migrationSql);
    const after = await getSingleStatusRow(env.db, "m-data");

    expect(after).toEqual(before);
  });

  it("backfills identities before the FK migration and keeps the public index", async () => {
    const env = await setupD1();
    await seedIdentity(env.db, "m-backfilled");
    await env.db.exec(backfillSql);

    const status = await getSingleStatusRow(env.db, "m-backfilled");
    expect(status).toMatchObject({
      member_id: "m-backfilled",
      public_consent: "unknown",
      rules_consent: "unknown",
      publish_state: "member_only",
      is_deleted: 0,
      notification_opt_out: 0,
    });

    const indexes = await env.db.prepare("PRAGMA index_list(member_status)").all<{
      name: string;
    }>();
    expect(indexes.results.map((index) => index.name)).toContain("idx_member_status_public");

    const indexInfo = await env.db.prepare("PRAGMA index_info(idx_member_status_public)").all<{
      name: string;
    }>();
    expect(indexInfo.results.map((column) => column.name)).toEqual([
      "public_consent",
      "publish_state",
      "is_deleted",
    ]);
  });

  it("fails before replacing member_status when existing orphan status rows remain", async () => {
    const env = await setupD1();
    await env.db.exec("PRAGMA foreign_keys = OFF");
    await env.db.exec("DROP TABLE IF EXISTS member_status_new");
    await env.db.exec("DROP TABLE member_status");
    await createLegacyMemberStatusTable(env.db);
    await env.db.prepare("INSERT INTO member_status (member_id) VALUES ('m-orphan-status')").run();

    try {
      await expect(env.db.exec(migrationSql)).rejects.toThrow(/FOREIGN KEY constraint failed/i);
      const orphan = await getSingleStatusRow(env.db, "m-orphan-status");
      expect(orphan).toMatchObject({ member_id: "m-orphan-status" });
    } finally {
      await env.db.exec("PRAGMA foreign_keys = OFF");
      await env.db.exec("DROP TABLE IF EXISTS member_status_new");
      await env.db.exec("DROP TABLE IF EXISTS member_status");
      await createLegacyMemberStatusTable(env.db);
      await env.db.exec(migrationSql);
      await env.db.exec("PRAGMA foreign_keys = ON");
    }
  });

  it("keeps notification_opt_out in the rebuilt schema with the existing default", async () => {
    const env = await setupD1();

    const columns = await env.db.prepare("PRAGMA table_info(member_status)").all<{
      name: string;
      notnull: number;
      dflt_value: string | null;
    }>();
    const optOut = columns.results.find((column) => column.name === "notification_opt_out");

    expect(optOut).toMatchObject({
      name: "notification_opt_out",
      notnull: 1,
      dflt_value: "0",
    });
  });
});
