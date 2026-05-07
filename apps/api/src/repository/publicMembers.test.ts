// @vitest-environment node
// issue-194-03b-followup-001-email-conflict-identity-merge
// public member repository canonical alias exclusion tests
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, type InMemoryD1 } from "./__tests__/_setup";
import {
  countAllMembers,
  countAllPublicMembers,
  existsPublicMember,
  listPublicMembers,
} from "./publicMembers";

const seedPublicMember = async (
  env: InMemoryD1,
  memberId: string,
  responseId: string,
  submittedAt: string,
  fullName = memberId,
) => {
  await env.db
    .prepare(
      `INSERT INTO member_responses
        (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json, search_text)
       VALUES (?1, 'f1', 'rev1', 'h1', ?2, ?3, ?4, ?5)`,
    )
    .bind(
      responseId,
      `${memberId}@example.com`,
      submittedAt,
      JSON.stringify({ fullName }),
      `${memberId} ${fullName}`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES (?1, ?2, ?3, ?3, ?4)`,
    )
    .bind(memberId, `${memberId}@example.com`, responseId, submittedAt)
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status
        (member_id, public_consent, rules_consent, publish_state, is_deleted)
       VALUES (?1, 'consented', 'consented', 'public', 0)`,
    )
    .bind(memberId)
    .run();
};

const seedField = async (
  env: InMemoryD1,
  responseId: string,
  stableKey: string,
  value: string,
) => {
  await env.db
    .prepare(
      `INSERT INTO response_fields (response_id, stable_key, value_json)
       VALUES (?1, ?2, ?3)`,
    )
    .bind(responseId, stableKey, JSON.stringify(value))
    .run();
};

const seedTag = async (
  env: InMemoryD1,
  memberId: string,
  tagId: string,
  code: string,
) => {
  await env.db
    .prepare(
      `INSERT OR IGNORE INTO tag_definitions
        (tag_id, code, label, category, active)
       VALUES (?1, ?2, ?2, 'test', 1)`,
    )
    .bind(tagId, code)
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_tags
        (member_id, tag_id, source, confidence, assigned_by)
       VALUES (?1, ?2, 'test', 1, 'test')`,
    )
    .bind(memberId, tagId)
    .run();
};

describe("publicMembers canonical alias exclusion", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
    await seedPublicMember(env, "m_source", "r_source", "2026-02-01T00:00:00.000Z");
    await seedPublicMember(env, "m_target", "r_target", "2026-01-01T00:00:00.000Z");
    await env.db
      .prepare(
        `INSERT INTO identity_aliases
          (alias_id, source_member_id, target_member_id, created_by, created_at, reason_redacted)
         VALUES ('a1', 'm_source', 'm_target', 'admin_1', '2026-02-02T00:00:00.000Z', 'same person')`,
      )
      .run();
  }, 60000);

  it("excludes archived alias source from public list and counts", async () => {
    const rows = await listPublicMembers(env.ctx, {
      q: "",
      zone: "all",
      status: "all",
      tagCodes: [],
      sort: "recent",
      page: 1,
      limit: 10,
    });

    expect(rows.map((r) => r.member_id)).toEqual(["m_target"]);
    await expect(existsPublicMember(env.ctx, "m_source")).resolves.toBe(false);
    await expect(existsPublicMember(env.ctx, "m_target")).resolves.toBe(true);
    await expect(countAllPublicMembers(env.ctx)).resolves.toBe(1);
    await expect(countAllMembers(env.ctx)).resolves.toBe(1);
  });

  it("sorts by fullName for public sort=name", async () => {
    await seedPublicMember(
      env,
      "m_beta",
      "r_beta",
      "2026-03-01T00:00:00.000Z",
      "Beta User",
    );
    await seedPublicMember(
      env,
      "m_alpha",
      "r_alpha",
      "2026-04-01T00:00:00.000Z",
      "Alpha User",
    );

    const rows = await listPublicMembers(env.ctx, {
      q: "",
      zone: "all",
      status: "all",
      tagCodes: [],
      sort: "name",
      page: 1,
      limit: 10,
    });

    expect(rows.map((r) => r.member_id)).toEqual([
      "m_alpha",
      "m_beta",
      "m_target",
    ]);
  });

  it("keeps q, zone, status, and tag binds aligned for compound filters", async () => {
    await seedPublicMember(
      env,
      "m_compound_hit",
      "r_compound_hit",
      "2026-03-01T00:00:00.000Z",
      "Compound Hit",
    );
    await seedPublicMember(
      env,
      "m_compound_miss",
      "r_compound_miss",
      "2026-03-02T00:00:00.000Z",
      "Compound Hit",
    );
    await seedField(env, "r_compound_hit", "ubmZone", "1_to_10");
    await seedField(env, "r_compound_hit", "ubmMembershipType", "member");
    await seedField(env, "r_compound_miss", "ubmZone", "1_to_10");
    await seedField(env, "r_compound_miss", "ubmMembershipType", "member");
    await seedTag(env, "m_compound_hit", "tag_compound_ai", "ai");

    const rows = await listPublicMembers(env.ctx, {
      q: "Compound",
      zone: "1_to_10",
      status: "member",
      tagCodes: ["ai"],
      sort: "recent",
      page: 1,
      limit: 10,
    });

    expect(rows.map((r) => r.member_id)).toEqual(["m_compound_hit"]);
  });

  it("uses fullName as the tie-breaker for public sort=recent", async () => {
    await seedPublicMember(
      env,
      "m_recent_beta",
      "r_recent_beta",
      "2026-05-01T00:00:00.000Z",
      "Beta User",
    );
    await seedPublicMember(
      env,
      "m_recent_alpha",
      "r_recent_alpha",
      "2026-05-01T00:00:00.000Z",
      "Alpha User",
    );

    const rows = await listPublicMembers(env.ctx, {
      q: "",
      zone: "all",
      status: "all",
      tagCodes: [],
      sort: "recent",
      page: 1,
      limit: 10,
    });

    expect(rows.map((r) => r.member_id).slice(0, 2)).toEqual([
      "m_recent_alpha",
      "m_recent_beta",
    ]);
  });

});
