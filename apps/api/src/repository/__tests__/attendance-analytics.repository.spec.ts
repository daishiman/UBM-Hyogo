// @vitest-environment node
// ut-02a-followup-002 attendance analytics aggregate tests
// AC-1: GROUP BY 単発クエリで完結（chunk pattern 非流用）
// AC-3: EXPLAIN QUERY PLAN で対象表 full scan なし
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  computeAttendanceOverview,
  listSessionAttendanceStats,
  listMemberAttendanceRanking,
} from "../attendance";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Plan {
  detail: string;
}

const seedBase = async (env: InMemoryD1) => {
  // 3 sessions (1 deleted), 3 members (1 deleted)
  await env.db.exec(
    "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1', 'S1', '2026-01-10', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s2', 'S2', '2026-02-10', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO meeting_sessions (session_id, title, held_on, created_by, deleted_at) VALUES ('s3', 'S3-deleted', '2026-03-10', 'admin', '2026-03-15T00:00:00Z')",
  );

  // member_identities (member_responses への FK は無いので不要)
  // current_response_id / first_response_id は NOT NULL だが FK 制約は無い
  await env.db.exec(
    "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m1', 'm1@example.com', 'r1', 'r1', '2026-01-01T00:00:00Z')",
  );
  await env.db.exec(
    "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m2', 'm2@example.com', 'r2', 'r2', '2026-01-01T00:00:00Z')",
  );
  await env.db.exec(
    "INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at) VALUES ('m3', 'm3@example.com', 'r3', 'r3', '2026-01-01T00:00:00Z')",
  );

  await env.db.exec(
    "INSERT INTO member_status (member_id, is_deleted) VALUES ('m1', 0)",
  );
  await env.db.exec(
    "INSERT INTO member_status (member_id, is_deleted) VALUES ('m2', 0)",
  );
  await env.db.exec(
    "INSERT INTO member_status (member_id, is_deleted) VALUES ('m3', 1)",
  );

  // attendance: m1 attends s1, s2; m2 attends s1; m2 also has a deleted session row;
  // m3 attends s2 but is a deleted member.
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1', 's1', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m1', 's2', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m2', 's1', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m2', 's3', 'admin')",
  );
  await env.db.exec(
    "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m3', 's2', 'admin')",
  );
};

describe("attendance analytics aggregates", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  describe("computeAttendanceOverview", () => {
    it("空テーブル時は 0 を返す", async () => {
      const r = await computeAttendanceOverview(env.ctx);
      expect(r.totalSessions).toBe(0);
      expect(r.totalMembers).toBe(0);
      expect(r.overallRate).toBe(0);
    });

    it("削除済 session / member を除外する", async () => {
      await seedBase(env);
      const r = await computeAttendanceOverview(env.ctx);
      expect(r.totalSessions).toBe(2);
      expect(r.totalMembers).toBe(2);
      // active attendance rows = 3 (m1->s1, m1->s2, m2->s1)
      expect(r.overallRate).toBe(0.75);
    });
  });

  describe("listSessionAttendanceStats", () => {
    it("空テーブル時は空配列を返す", async () => {
      const r = await listSessionAttendanceStats(env.ctx);
      expect(r).toEqual([]);
    });

    it("削除済 session を除外し、held_on DESC で並ぶ", async () => {
      await seedBase(env);
      const r = await listSessionAttendanceStats(env.ctx);
      expect(r).toHaveLength(2);
      expect(r[0].sessionId).toBe("s2");
      expect(r[1].sessionId).toBe("s1");
      const s1 = r.find((x) => x.sessionId === "s1")!;
      expect(s1.attendeeCount).toBe(2);
      const s2 = r.find((x) => x.sessionId === "s2")!;
      expect(s2.attendeeCount).toBe(1);
    });

    it("limit が effective", async () => {
      await seedBase(env);
      const r = await listSessionAttendanceStats(env.ctx, { limit: 1 });
      expect(r).toHaveLength(1);
    });
  });

  describe("listMemberAttendanceRanking", () => {
    it("空テーブル時は空配列を返す", async () => {
      const r = await listMemberAttendanceRanking(env.ctx);
      expect(r).toEqual([]);
    });

    it("削除済 member を除外し attendedCount DESC", async () => {
      await seedBase(env);
      const r = await listMemberAttendanceRanking(env.ctx);
      expect(r.map((x) => x.memberId as string)).toEqual(["m1", "m2"]);
      expect(r[0].attendedCount).toBe(2);
      expect(r[1].attendedCount).toBe(1);
    });

    it("limit が effective", async () => {
      await seedBase(env);
      const r = await listMemberAttendanceRanking(env.ctx, { limit: 1 });
      expect(r).toHaveLength(1);
      expect(r[0].memberId as string).toBe("m1");
    });
  });

  describe("AC-1: chunk pattern 非流用", () => {
    it("attendance.ts は ATTENDANCE_BIND_CHUNK_SIZE を analytics 関数内で使用しない", () => {
      const src = readFileSync(
        join(__dirname, "..", "attendance.ts"),
        "utf8",
      );
      // analytics セクション以降を抽出
      const marker = "ut-02a-followup-002 attendance analytics aggregates";
      const idx = src.indexOf(marker);
      expect(idx).toBeGreaterThan(0);
      const analyticsSection = src.slice(idx);
      // コメント行（先頭が // のもの）を除外してから検査する
      const codeOnly = analyticsSection
        .split("\n")
        .filter((line) => !/^\s*\/\//.test(line))
        .join("\n");
      expect(codeOnly).not.toMatch(/ATTENDANCE_BIND_CHUNK_SIZE/);
      expect(codeOnly).not.toMatch(/chunkBy\s*\(/);
    });
  });

  describe("AC-3: EXPLAIN QUERY PLAN", () => {
    it("by-session SQL は meeting_sessions / member_attendance の full scan を含まない", async () => {
      await seedBase(env);
      const sql = `EXPLAIN QUERY PLAN
        SELECT s.session_id, COUNT(ma.member_id) AS c
        FROM meeting_sessions s
        LEFT JOIN member_attendance ma ON ma.session_id = s.session_id
        LEFT JOIN member_identities mi ON mi.member_id = ma.member_id
        LEFT JOIN member_status ms ON ms.member_id = mi.member_id
        WHERE s.deleted_at IS NULL
        GROUP BY s.session_id`;
      const plan = await env.db.prepare(sql).all<Plan>();
      const text = (plan.results ?? []).map((r) => r.detail).join("\n");
      // SQLite は全件返却を SCAN と表記する。INDEX 使用なら SEARCH ... USING INDEX。
      // meeting_sessions の active filter は idx_meeting_sessions_active_held_on (0013) を使う想定。
      // member_attendance への参照は session_id index 経由の SEARCH を想定。
      expect(text).not.toMatch(/SCAN member_attendance\b/);
    });

    it("ranking SQL は member_attendance の full scan を含まない", async () => {
      await seedBase(env);
      const sql = `EXPLAIN QUERY PLAN
        SELECT mi.member_id, COUNT(s.session_id)
        FROM member_identities mi
        LEFT JOIN member_status ms ON ms.member_id = mi.member_id
        LEFT JOIN member_attendance ma ON ma.member_id = mi.member_id
        LEFT JOIN meeting_sessions s ON s.session_id = ma.session_id AND s.deleted_at IS NULL
        GROUP BY mi.member_id`;
      const plan = await env.db.prepare(sql).all<Plan>();
      const text = (plan.results ?? []).map((r) => r.detail).join("\n");
      expect(text).not.toMatch(/SCAN member_attendance\b/);
    });
  });
});
