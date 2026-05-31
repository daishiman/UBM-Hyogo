// @vitest-environment node
// issue-194-03b-followup-001-email-conflict-identity-merge
// listIdentityConflicts / dismissIdentityConflict integration test
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  listIdentityConflicts,
  DismissAtomicBatchUnavailable,
  DismissIdentityNotFound,
  dismissIdentityConflict,
  isConflictDismissed,
  parseConflictId,
} from "../identity-conflict";

const seedDuplicateIdentities = async (env: InMemoryD1) => {
  // 2 identity が name="山田太郎" affiliation="ACME" で完全一致するシード
  await env.db
    .prepare(
      `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, search_text, submitted_at, answers_json)
       VALUES ('r_old','f1','rev1','h1','old@example.com','','2026-01-01T00:00:00.000Z','{}')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, search_text, submitted_at, answers_json)
       VALUES ('r_new','f1','rev1','h1','newuser@example.com','','2026-02-01T00:00:00.000Z','{}')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m_target','old@example.com','r_old','r_old','2026-01-01T00:00:00.000Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_identities (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m_source','newuser@example.com','r_new','r_new','2026-02-01T00:00:00.000Z')`,
    )
    .run();
  for (const [rid, name, occ] of [
    ["r_old", "山田太郎", "ACME"],
    ["r_new", "山田太郎", "ACME"],
  ] as const) {
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json) VALUES (?1,'fullName', json_quote(?2))`,
      )
      .bind(rid, name)
      .run();
    await env.db
      .prepare(
        `INSERT INTO response_fields (response_id, stable_key, value_json) VALUES (?1,'occupation', json_quote(?2))`,
      )
      .bind(rid, occ)
      .run();
  }
};

describe("listIdentityConflicts", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seedDuplicateIdentities(env);
  }, 60000);

  it("name+affiliation 完全一致の候補を 1 件返す（source は新しい側）", async () => {
    const out = await listIdentityConflicts(env.ctx, null, 50);
    expect(out.items).toHaveLength(1);
    expect(out.items[0]!.sourceMemberId).toBe("m_source");
    expect(out.items[0]!.candidateTargetMemberId).toBe("m_target");
    expect(out.items[0]!.responseEmailMasked).toMatch(/\*\*\*@/);
    expect(out.items[0]!.matchedFields).toEqual(["name", "affiliation"]);
    expect(out.nextCursor).toBeNull();
  });

  it("dismiss 後は候補から除外される", async () => {
    const out1 = await listIdentityConflicts(env.ctx, null, 50);
    const id = out1.items[0]!.conflictId;
    const ids = parseConflictId(id)!;
    await dismissIdentityConflict(env.ctx, ids.source, ids.target, "admin_1", null, "別人");
    const dismissed = await isConflictDismissed(env.ctx, ids.source, ids.target);
    expect(dismissed).toBe(true);
    const out2 = await listIdentityConflicts(env.ctx, null, 50);
    expect(out2.items).toHaveLength(0);
  });

  it("dismiss reason 内のメール / 電話を [redacted] に置換する", async () => {
    const out1 = await listIdentityConflicts(env.ctx, null, 50);
    const ids = parseConflictId(out1.items[0]!.conflictId)!;
    await dismissIdentityConflict(
      env.ctx,
      ids.source,
      ids.target,
      "admin_1",
      null,
      "別人 user@example.com 090-1234-5678 で確認済み",
    );
    const row = await env.db
      .prepare(
        `SELECT reason FROM identity_conflict_dismissals
         WHERE source_member_id = ?1 AND candidate_target_member_id = ?2`,
      )
      .bind(ids.source, ids.target)
      .first<{ reason: string }>();
    expect(row?.reason).not.toContain("user@example.com");
    expect(row?.reason).toContain("[redacted]");
  });

  it("dismiss 成功時に identity.dismiss を audit_log へ append する", async () => {
    const out1 = await listIdentityConflicts(env.ctx, null, 50);
    const ids = parseConflictId(out1.items[0]!.conflictId)!;
    const out = await dismissIdentityConflict(
      env.ctx,
      ids.source,
      ids.target,
      "admin_1",
      "owner@example.com",
      "別人 user@example.com で確認済み",
    );
    const row = await env.db
      .prepare(
        `SELECT actor_id AS actorId, actor_email AS actorEmail, action, target_type AS targetType,
                target_id AS targetId, before_json AS beforeJson, after_json AS afterJson
         FROM audit_log
         WHERE action = 'identity.dismiss'`,
      )
      .first<{
        actorId: string;
        actorEmail: string;
        action: string;
        targetType: string;
        targetId: string;
        beforeJson: string;
        afterJson: string;
      }>();
    expect(row).toMatchObject({
      actorId: "admin_1",
      actorEmail: "owner@example.com",
      action: "identity.dismiss",
      targetType: "member",
      targetId: ids.target,
    });
    expect(JSON.parse(row!.beforeJson)).toEqual({
      sourceMemberId: ids.source,
      targetMemberId: ids.target,
    });
    expect(JSON.parse(row!.afterJson)).toMatchObject({ dismissedAt: out.dismissedAt });
    expect(row!.afterJson).not.toContain("user@example.com");
  });

  it("再 dismiss 時は dismissal_id と audit payload の dismissalId を同じ最新値へ更新する", async () => {
    const out1 = await listIdentityConflicts(env.ctx, null, 50);
    const ids = parseConflictId(out1.items[0]!.conflictId)!;
    await dismissIdentityConflict(env.ctx, ids.source, ids.target, "admin_1", null, "一回目");
    const second = await dismissIdentityConflict(
      env.ctx,
      ids.source,
      ids.target,
      "admin_2",
      "owner@example.com",
      "二回目",
    );
    const dismissal = await env.db
      .prepare(
        `SELECT dismissal_id AS dismissalId, dismissed_by AS dismissedBy, dismissed_at AS dismissedAt
         FROM identity_conflict_dismissals
         WHERE source_member_id = ?1 AND candidate_target_member_id = ?2`,
      )
      .bind(ids.source, ids.target)
      .first<{ dismissalId: string; dismissedBy: string; dismissedAt: string }>();
    const auditRows = await env.db
      .prepare(
        `SELECT after_json AS afterJson FROM audit_log
         WHERE action = 'identity.dismiss'
         ORDER BY created_at DESC, audit_id DESC`,
      )
      .all<{ afterJson: string }>();
    expect(auditRows.results).toHaveLength(2);
    const latestAfter = JSON.parse(auditRows.results![0]!.afterJson) as {
      dismissalId: string;
      dismissedAt: string;
    };
    expect(dismissal).toMatchObject({
      dismissalId: latestAfter.dismissalId,
      dismissedBy: "admin_2",
      dismissedAt: second.dismissedAt,
    });
    expect(latestAfter.dismissedAt).toBe(second.dismissedAt);
  });

  it("存在しない source/target は dismissal と audit_log を書かず DismissIdentityNotFound", async () => {
    await expect(
      dismissIdentityConflict(
        env.ctx,
        "missing_source",
        "m_target",
        "admin_1",
        "owner@example.com",
        "別人",
      ),
    ).rejects.toMatchObject({ memberId: "missing_source" });
    await expect(
      dismissIdentityConflict(
        env.ctx,
        "m_source",
        "missing_target",
        "admin_1",
        "owner@example.com",
        "別人",
      ),
    ).rejects.toBeInstanceOf(DismissIdentityNotFound);
    const dismissal = await env.db
      .prepare("SELECT COUNT(*) AS n FROM identity_conflict_dismissals")
      .first<{ n: number }>();
    const audit = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'identity.dismiss'")
      .first<{ n: number }>();
    expect(dismissal?.n).toBe(0);
    expect(audit?.n).toBe(0);
  });

  it("db.batch 非対応時は部分書き込みせず fail-fast する", async () => {
    const out1 = await listIdentityConflicts(env.ctx, null, 50);
    const ids = parseConflictId(out1.items[0]!.conflictId)!;
    const dbWithoutBatch = Object.create(env.ctx.db) as typeof env.ctx.db;
    Object.defineProperty(dbWithoutBatch, "batch", { value: undefined });
    const ctxWithoutBatch = { ...env.ctx, db: dbWithoutBatch } as typeof env.ctx;
    await expect(
      dismissIdentityConflict(
        ctxWithoutBatch,
        ids.source,
        ids.target,
        "admin_1",
        "owner@example.com",
        "別人",
      ),
    ).rejects.toBeInstanceOf(DismissAtomicBatchUnavailable);
    const audit = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'identity.dismiss'")
      .first<{ n: number }>();
    expect(audit?.n).toBe(0);
    await expect(isConflictDismissed(env.ctx, ids.source, ids.target)).resolves.toBe(false);
  });

  it("audit_log INSERT が失敗した場合は batch rollback で dismissal も残らない", async () => {
    const out1 = await listIdentityConflicts(env.ctx, null, 50);
    const ids = parseConflictId(out1.items[0]!.conflictId)!;
    const duplicateAuditId =
      "00000000-0000-4000-8000-000000000001" as ReturnType<typeof crypto.randomUUID>;
    await env.db
      .prepare(
        `INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, created_at)
         VALUES (?1, 'owner@example.com', 'identity.dismiss', 'member', 'm_target', '2026-01-01T00:00:00.000Z')`,
      )
      .bind(duplicateAuditId)
      .run();

    const uuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000002")
      .mockReturnValueOnce(duplicateAuditId);
    try {
      await expect(
        dismissIdentityConflict(
          env.ctx,
          ids.source,
          ids.target,
          "admin_1",
          "owner@example.com",
          "別人",
        ),
      ).rejects.toThrow();
    } finally {
      uuidSpy.mockRestore();
    }

    await expect(isConflictDismissed(env.ctx, ids.source, ids.target)).resolves.toBe(false);
    const audit = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'identity.dismiss'")
      .first<{ n: number }>();
    expect(audit?.n).toBe(1);
  });

  it("identity_aliases に登録済の source は候補から除外される", async () => {
    await env.db
      .prepare(
        `INSERT INTO identity_aliases (alias_id, source_member_id, target_member_id, created_by, created_at, reason_redacted)
         VALUES ('a1','m_source','m_target','admin_1','2026-02-02T00:00:00.000Z','ok')`,
      )
      .run();
    const out = await listIdentityConflicts(env.ctx, null, 50);
    expect(out.items).toHaveLength(0);
  });
});

describe("parseConflictId", () => {
  it("正規 conflictId をパース", () => {
    expect(parseConflictId("a__b")).toEqual({ source: "a", target: "b" });
  });
  it("不正フォーマットは null", () => {
    expect(parseConflictId("nodelim")).toBeNull();
    expect(parseConflictId("__b")).toBeNull();
    expect(parseConflictId("a__")).toBeNull();
  });
});
