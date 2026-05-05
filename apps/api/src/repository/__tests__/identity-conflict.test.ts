// @vitest-environment node
// issue-194-03b-followup-001-email-conflict-identity-merge
// listIdentityConflicts / dismissIdentityConflict integration test
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  listIdentityConflicts,
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
    await dismissIdentityConflict(env.ctx, ids.source, ids.target, "admin_1", "別人");
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
