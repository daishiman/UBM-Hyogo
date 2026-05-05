// @vitest-environment node
// issue-194-03b-followup-001-email-conflict-identity-merge
// merge transaction integration test
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  mergeIdentities,
  resolveCanonicalMemberId,
  MergeConflictAlreadyApplied,
  MergeIdentityNotFound,
  MergeSelfReference,
} from "../identity-merge";

const seedTwoIdentities = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, search_text, submitted_at, answers_json)
       VALUES ('r_old','f1','rev1','h1','old@example.com','', '2026-01-01T00:00:00.000Z','{}')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, search_text, submitted_at, answers_json)
       VALUES ('r_new','f1','rev1','h1','new@example.com','', '2026-02-01T00:00:00.000Z','{}')`,
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
       VALUES ('m_source','new@example.com','r_new','r_new','2026-02-01T00:00:00.000Z')`,
    )
    .run();
};

describe("mergeIdentities", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seedTwoIdentities(env);
  }, 60000);

  it("identity_aliases / identity_merge_audit / audit_log を atomic に書き込む", async () => {
    const out = await mergeIdentities(env.ctx, {
      sourceMemberId: "m_source",
      targetMemberId: "m_target",
      actorAdminId: "admin_1",
      actorAdminEmail: "admin@example.com",
      reason: "同一人物として merge",
    });
    expect(out.targetMemberId).toBe("m_target");
    expect(out.archivedSourceMemberId).toBe("m_source");

    const alias = await env.db
      .prepare("SELECT * FROM identity_aliases WHERE source_member_id = 'm_source'")
      .first<Record<string, unknown>>();
    expect(alias).not.toBeNull();
    expect(alias?.target_member_id).toBe("m_target");

    const audit = await env.db
      .prepare("SELECT * FROM identity_merge_audit WHERE source_member_id = 'm_source'")
      .first<Record<string, unknown>>();
    expect(audit?.target_member_id).toBe("m_target");
    expect(audit?.actor_admin_id).toBe("admin_1");

    const log = await env.db
      .prepare("SELECT * FROM audit_log WHERE action = 'identity.merge'")
      .first<Record<string, unknown>>();
    expect(log).not.toBeNull();
    expect(log?.target_id).toBe("m_target");
  });

  it("二重 merge は MergeConflictAlreadyApplied", async () => {
    await mergeIdentities(env.ctx, {
      sourceMemberId: "m_source",
      targetMemberId: "m_target",
      actorAdminId: "admin_1",
      actorAdminEmail: null,
      reason: "first",
    });
    await expect(
      mergeIdentities(env.ctx, {
        sourceMemberId: "m_source",
        targetMemberId: "m_target",
        actorAdminId: "admin_1",
        actorAdminEmail: null,
        reason: "second",
      }),
    ).rejects.toBeInstanceOf(MergeConflictAlreadyApplied);
  });

  it("source 不在は MergeIdentityNotFound", async () => {
    await expect(
      mergeIdentities(env.ctx, {
        sourceMemberId: "m_missing",
        targetMemberId: "m_target",
        actorAdminId: "admin_1",
        actorAdminEmail: null,
        reason: "x",
      }),
    ).rejects.toBeInstanceOf(MergeIdentityNotFound);
  });

  it("source == target は MergeSelfReference", async () => {
    await expect(
      mergeIdentities(env.ctx, {
        sourceMemberId: "m_target",
        targetMemberId: "m_target",
        actorAdminId: "admin_1",
        actorAdminEmail: null,
        reason: "x",
      }),
    ).rejects.toBeInstanceOf(MergeSelfReference);
  });

  it("PII redaction: reason 内のメール / 電話を [redacted] に置換する", async () => {
    await mergeIdentities(env.ctx, {
      sourceMemberId: "m_source",
      targetMemberId: "m_target",
      actorAdminId: "admin_1",
      actorAdminEmail: null,
      reason: "本人連絡 user@example.com 090-1234-5678 で確認済み",
    });
    const audit = await env.db
      .prepare("SELECT reason FROM identity_merge_audit WHERE source_member_id = 'm_source'")
      .first<{ reason: string }>();
    expect(audit?.reason).not.toContain("user@example.com");
    expect(audit?.reason).toContain("[redacted]");
  });

  it("resolveCanonicalMemberId で merge 後 target が引ける", async () => {
    await mergeIdentities(env.ctx, {
      sourceMemberId: "m_source",
      targetMemberId: "m_target",
      actorAdminId: "admin_1",
      actorAdminEmail: null,
      reason: "ok",
    });
    const target = await resolveCanonicalMemberId(env.ctx, "m_source");
    expect(target).toBe("m_target");
    const passthrough = await resolveCanonicalMemberId(env.ctx, "m_target");
    expect(passthrough).toBe("m_target");
  });
});
