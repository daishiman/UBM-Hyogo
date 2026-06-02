// @vitest-environment node
// issue-1036 / task-A: bulk member tag assign/unassign endpoint の contract spec。
//   POST /admin/members/tags/bulk と GET /admin/tags の shape / 部分失敗 / 冪等 / audit を検証する。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminMembersRoute } from "./members";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  SYNC_ADMIN_TOKEN: "t",
  AUTH_SECRET: TEST_AUTH_SECRET,
});

type BulkTagItemStatus =
  | "assigned"
  | "unassigned"
  | "noop"
  | "skipped_deleted"
  | "tag_not_found";

interface BulkResultItem {
  memberId: string;
  tagId: string;
  status: BulkTagItemStatus;
}
interface BulkResponse {
  batchId: string;
  results: BulkResultItem[];
}

const seed = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m1','m1@example.com','r1','r1','2026-04-01T00:00:00Z'),
              ('m2','m2@example.com','r2','r2','2026-04-01T00:00:00Z'),
              ('m_del','del@example.com','rd','rd','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted)
       VALUES ('m1','consented','consented','public',0),
              ('m2','consented','consented','public',0),
              ('m_del','consented','consented','hidden',1)`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_eng','engineer','エンジニア','occupation','[]',1),
              ('tag_mgr','manager','経営者','occupation','[]',1),
              ('tag_inact','inactive','非アクティブ','misc','[]',0)`,
    )
    .run();
};

const auditCount = async (
  env: InMemoryD1,
  action: string,
  targetId?: string,
): Promise<number> => {
  const sql = targetId
    ? "SELECT COUNT(*) AS n FROM audit_log WHERE target_type='member' AND action=?1 AND target_id=?2"
    : "SELECT COUNT(*) AS n FROM audit_log WHERE target_type='member' AND action=?1";
  const stmt = env.db.prepare(sql);
  const bound = targetId ? stmt.bind(action, targetId) : stmt.bind(action);
  const r = await bound.first<{ n: number }>();
  return r?.n ?? 0;
};

const bulk = async (
  env: InMemoryD1,
  body: { memberIds: string[]; tagIds: string[]; op: "assign" | "unassign" },
) =>
  createAdminMembersRoute().request(
    "/members/tags/bulk",
    {
      method: "POST",
      headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
      body: JSON.stringify(body),
    },
    makeEnv(env),
  );

describe("admin bulk member tags contract (issue-1036 task-A)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("B-T1: bulk assign（2 member × 2 tag）→ 200 + 全 assigned + member×tag 単位 audit", async () => {
    const res = await bulk(env, {
      memberIds: ["m1", "m2"],
      tagIds: ["tag_eng", "tag_mgr"],
      op: "assign",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as BulkResponse;
    expect(typeof body.batchId).toBe("string");
    expect(body.results).toHaveLength(4);
    expect(body.results.every((r) => r.status === "assigned")).toBe(true);
    // 実 mutation 4 件 → audit 4 件
    expect(await auditCount(env, "admin.member.tag_assigned")).toBe(4);
  });

  it("B-T2: 同一 bulk 再送 → 全 noop + audit 増えない（AC-5 冪等）", async () => {
    const payload = {
      memberIds: ["m1", "m2"],
      tagIds: ["tag_eng"],
      op: "assign" as const,
    };
    await bulk(env, payload);
    const res = await bulk(env, payload);
    expect(res.status).toBe(200);
    const body = (await res.json()) as BulkResponse;
    expect(body.results.every((r) => r.status === "noop")).toBe(true);
    // 初回 2 件のまま（再送で増えない）
    expect(await auditCount(env, "admin.member.tag_assigned")).toBe(2);
  });

  it("B-T3: 削除済み member は skipped_deleted で skip し他 member は継続（AC-4）", async () => {
    const res = await bulk(env, {
      memberIds: ["m1", "m_del"],
      tagIds: ["tag_eng"],
      op: "assign",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as BulkResponse;
    const byMember = Object.fromEntries(body.results.map((r) => [r.memberId, r.status]));
    expect(byMember.m1).toBe("assigned");
    expect(byMember.m_del).toBe("skipped_deleted");
    // m_del には audit を書かない
    expect(await auditCount(env, "admin.member.tag_assigned", "m_del")).toBe(0);
    expect(await auditCount(env, "admin.member.tag_assigned", "m1")).toBe(1);
  });

  it("B-T4: 未登録 / inactive tag は tag_not_found（AC-2・audit なし）", async () => {
    const res = await bulk(env, {
      memberIds: ["m1"],
      tagIds: ["tag_missing", "tag_inact"],
      op: "assign",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as BulkResponse;
    expect(body.results.every((r) => r.status === "tag_not_found")).toBe(true);
    expect(await auditCount(env, "admin.member.tag_assigned")).toBe(0);
  });

  it("B-T5: 不在 member + 未登録 tag 混在 → member skip を tag より先に判定", async () => {
    const res = await bulk(env, {
      memberIds: ["nope"],
      tagIds: ["tag_missing"],
      op: "assign",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as BulkResponse;
    // member 不在は skipped_deleted（tag を評価しない）
    expect(body.results).toEqual([
      { memberId: "nope", tagId: "tag_missing", status: "skipped_deleted" },
    ]);
  });

  it("B-T6: unassign → unassigned + audit、未付与への unassign は noop", async () => {
    await bulk(env, { memberIds: ["m1"], tagIds: ["tag_eng"], op: "assign" });
    const res = await bulk(env, {
      memberIds: ["m1"],
      tagIds: ["tag_eng", "tag_mgr"],
      op: "unassign",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as BulkResponse;
    const byTag = Object.fromEntries(body.results.map((r) => [r.tagId, r.status]));
    expect(byTag.tag_eng).toBe("unassigned"); // 付与済みを解除
    expect(byTag.tag_mgr).toBe("noop"); // 未付与の解除は noop
    expect(await auditCount(env, "admin.member.tag_unassigned")).toBe(1);
  });

  it("B-T7: body 不正（op 不正）→ 400", async () => {
    const res = await createAdminMembersRoute().request(
      "/members/tags/bulk",
      {
        method: "POST",
        headers: { ...(await adminAuthHeader()), "content-type": "application/json" },
        body: JSON.stringify({ memberIds: ["m1"], tagIds: ["tag_eng"], op: "delete" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("B-T8: memberIds 上限超過（201 件）→ 400（zod 上限）", async () => {
    const tooMany = Array.from({ length: 201 }, (_, i) => `m${i}`);
    const res = await bulk(env, { memberIds: tooMany, tagIds: ["tag_eng"], op: "assign" });
    expect(res.status).toBe(400);
  });

  it("B-T9: GET /admin/tags → { available }（active のみ）", async () => {
    const res = await createAdminMembersRoute().request(
      "/tags",
      { method: "GET", headers: { ...(await adminAuthHeader()) } },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { available: { code: string }[] };
    const codes = body.available.map((t) => t.code);
    expect(codes).toContain("engineer");
    expect(codes).toContain("manager");
    expect(codes).not.toContain("inactive");
  });

  it("B-T10: regression — 既存単一 endpoint POST /members/:id/tags が誤マッチしない", async () => {
    // "/members/tags/bulk" が `:memberId="tags"` 系に吸われていないことを確認
    const res = await bulk(env, { memberIds: ["m1"], tagIds: ["tag_eng"], op: "assign" });
    const body = (await res.json()) as BulkResponse;
    expect(body.results[0]?.status).toBe("assigned");
  });

  it("authz: 401（未認証）", async () => {
    const res = await createAdminMembersRoute().request(
      "/members/tags/bulk",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberIds: ["m1"], tagIds: ["tag_eng"], op: "assign" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });
});
