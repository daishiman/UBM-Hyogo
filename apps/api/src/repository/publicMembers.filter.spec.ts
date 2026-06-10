// @vitest-environment node
// members-search-filter-ux-and-api-fix / Phase 4 RED → Phase 5 GREEN
// zone/status フィルタのヒット・0件・ページネーション境界（重複ゼロ）回帰ガード。
// 格納値は enum 前提（sync 正規化後の世界）。
import { beforeEach, describe, expect, it } from "vitest";

import { setupD1, type InMemoryD1 } from "./__tests__/_setup";
import {
  countPublicMembers,
  listPublicMembers,
  type ListPublicMembersInput,
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

const baseInput = (
  patch: Partial<ListPublicMembersInput> = {},
): ListPublicMembersInput => ({
  q: "",
  zone: "all",
  status: "all",
  tagCodes: [],
  sort: "recent",
  page: 1,
  limit: 10,
  ...patch,
});

describe("publicMembers zone/status filter (enum 格納前提)", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
  }, 60000);

  it("TC-FQ-01: zone で絞り込み、該当のみ取得（非該当は除外）", async () => {
    await seedPublicMember(env, "m1", "r1", "2026-02-01T00:00:00.000Z");
    await seedPublicMember(env, "m2", "r2", "2026-01-01T00:00:00.000Z");
    await seedField(env, "r1", "ubmZone", "1_to_10");
    await seedField(env, "r2", "ubmZone", "0_to_1");

    const rows = await listPublicMembers(env.ctx, baseInput({ zone: "1_to_10" }));
    expect(rows.map((r) => r.member_id)).toEqual(["m1"]);
  });

  it("TC-FQ-02: status で絞り込み、該当のみ取得", async () => {
    await seedPublicMember(env, "m1", "r1", "2026-02-01T00:00:00.000Z");
    await seedPublicMember(env, "m2", "r2", "2026-01-01T00:00:00.000Z");
    await seedField(env, "r1", "ubmMembershipType", "member");
    await seedField(env, "r2", "ubmMembershipType", "academy");

    const rows = await listPublicMembers(env.ctx, baseInput({ status: "member" }));
    expect(rows.map((r) => r.member_id)).toEqual(["m1"]);
  });

  it("TC-FQ-03: 一致しない zone は 0 件", async () => {
    await seedPublicMember(env, "m1", "r1", "2026-02-01T00:00:00.000Z");
    await seedField(env, "r1", "ubmZone", "1_to_10");

    const rows = await listPublicMembers(env.ctx, baseInput({ zone: "10_to_100" }));
    expect(rows).toHaveLength(0);
  });

  it("TC-FQ-04: zone & status の AND 合成", async () => {
    await seedPublicMember(env, "m1", "r1", "2026-02-01T00:00:00.000Z");
    await seedField(env, "r1", "ubmZone", "1_to_10");
    await seedField(env, "r1", "ubmMembershipType", "member");

    const rows = await listPublicMembers(
      env.ctx,
      baseInput({ zone: "1_to_10", status: "member" }),
    );
    expect(rows.map((r) => r.member_id)).toEqual(["m1"]);
  });

  it("TC-FQ-05..08: ページネーション境界で重複・欠落ゼロ・件数一致", async () => {
    const ids = ["mp1", "mp2", "mp3", "mp4", "mp5"];
    // 同一 submittedAt → fullName tie-break が効くよう fullName を昇順に振る
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      await seedPublicMember(
        env,
        id,
        `r_${id}`,
        "2026-03-01T00:00:00.000Z",
        `User ${i}`,
      );
      await seedField(env, `r_${id}`, "ubmZone", "1_to_10");
    }

    const input = baseInput({ zone: "1_to_10", limit: 2 });
    const count = await countPublicMembers(env.ctx, input);
    expect(count).toBe(5); // TC-FQ-05 count

    const page1 = await listPublicMembers(env.ctx, { ...input, page: 1 });
    const page2 = await listPublicMembers(env.ctx, { ...input, page: 2 });
    const page3 = await listPublicMembers(env.ctx, { ...input, page: 3 });
    const page4 = await listPublicMembers(env.ctx, { ...input, page: 4 });

    expect(page1).toHaveLength(2); // TC-FQ-05
    expect(page2).toHaveLength(2); // TC-FQ-06
    expect(page3).toHaveLength(1); // TC-FQ-07
    expect(page4).toHaveLength(0); // TC-FQ-08 範囲外

    const all = [...page1, ...page2, ...page3].map((r) => r.member_id);
    const unique = new Set(all);
    expect(unique.size).toBe(5); // 重複ゼロ
    expect(unique.size).toBe(count); // 件数一致
  });

  it("TC-FQ-09: zone=all は zone 条件を無効化（全件）", async () => {
    await seedPublicMember(env, "m1", "r1", "2026-02-01T00:00:00.000Z");
    await seedField(env, "r1", "ubmZone", "1_to_10");
    await seedPublicMember(env, "m2", "r2", "2026-01-01T00:00:00.000Z");
    // m2 は zone field なし

    const rows = await listPublicMembers(env.ctx, baseInput({ zone: "all" }));
    expect(rows.map((r) => r.member_id).sort()).toEqual(["m1", "m2"]);
  });
});
