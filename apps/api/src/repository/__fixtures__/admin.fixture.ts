// dev only — このファイルは prod build から exclude される（不変条件 #6 / AC-10）
// GAS prototype data.jsx 相当の最小 fixture seeder。
// admin_users 1 / admin_member_notes 2 / audit_log 5 件を seed する。
//
// 警告: このフィクスチャを **本番 admin 仕様に昇格させない**。
//       本番 admin_users の seed は別途 admin operator が wrangler 経由で投入する。
import type { D1Database } from "@cloudflare/workers-types";
import type { FixtureLoader } from "../__tests__/_setup";

export const seedAdminUsers: FixtureLoader = async (db: D1Database) => {
  await db
    .prepare(
      "INSERT INTO admin_users (admin_id, email, display_name, active, created_at) VALUES (?1, ?2, ?3, 1, ?4)",
    )
    .bind(
      "adm_owner",
      "owner@example.com",
      "Owner",
      "2026-04-01T00:00:00Z",
    )
    .run();
};

export const seedAdminNotes: FixtureLoader = async (db: D1Database) => {
  const rows: Array<[string, string, string, string, string, string, string]> = [
    [
      "note_001",
      "m_001",
      "初回コンタクト OK",
      "owner@example.com",
      "owner@example.com",
      "2026-04-10T00:00:00Z",
      "2026-04-10T00:00:00Z",
    ],
    [
      "note_002",
      "m_002",
      "要フォロー",
      "owner@example.com",
      "owner@example.com",
      "2026-04-11T00:00:00Z",
      "2026-04-11T00:00:00Z",
    ],
  ];
  for (const r of rows) {
    await db
      .prepare(
        "INSERT INTO admin_member_notes (note_id, member_id, body, created_by, updated_by, created_at, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7)",
      )
      .bind(...r)
      .run();
  }
};

export const seedAuditLog: FixtureLoader = async (db: D1Database) => {
  const rows: Array<[string, string, string, string, string, string | null, string, string]> = [
    [
      "audit_001",
      "owner@example.com",
      "member.publish_state_changed",
      "member",
      "m_001",
      JSON.stringify({ from: "hidden", to: "public" }),
      "2026-04-10T00:00:00Z",
      "adm_owner",
    ],
    [
      "audit_002",
      "owner@example.com",
      "tag.queue.resolved",
      "tag_queue",
      "tq_001",
      JSON.stringify({ resolution: "approved" }),
      "2026-04-11T00:00:00Z",
      "adm_owner",
    ],
    [
      "audit_003",
      "owner@example.com",
      "member.note.created",
      "member",
      "m_001",
      JSON.stringify({ noteId: "note_001" }),
      "2026-04-10T01:00:00Z",
      "adm_owner",
    ],
    [
      "audit_004",
      "owner@example.com",
      "schema.diff.alias_assigned",
      "schema_diff",
      "sd_001",
      JSON.stringify({ aliasFor: "q_007" }),
      "2026-04-12T00:00:00Z",
      "adm_owner",
    ],
    [
      "audit_005",
      "owner@example.com",
      "member.deleted",
      "member",
      "m_999",
      JSON.stringify({}),
      "2026-04-12T01:00:00Z",
      "adm_owner",
    ],
  ];
  for (const r of rows) {
    await db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, after_json, created_at, actor_id) VALUES (?1,?2,?3,?4,?5,?6,?7,?8)",
      )
      .bind(...r)
      .run();
  }
};

export const seedAll: FixtureLoader[] = [seedAdminUsers, seedAdminNotes, seedAuditLog];
