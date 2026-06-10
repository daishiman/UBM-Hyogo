// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./__tests__/_setup";
import { asMemberId, asStableKey } from "@ubm-hyogo/shared";
import {
  listFieldOverridesByMemberId,
  listFieldOverridesByMemberIds,
  upsertMemberFieldOverride,
} from "./memberFieldOverrides";

describe("memberFieldOverrides repository", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("upsert → list で 1 件取得できる", async () => {
    await upsertMemberFieldOverride(env.ctx, {
      memberId: asMemberId("m1"),
      stableKey: asStableKey("fullName"),
      valueJson: JSON.stringify("Admin Name"),
      updatedBy: "admin@example.com",
    });
    const rows = await listFieldOverridesByMemberId(env.ctx, asMemberId("m1"));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      member_id: "m1",
      stable_key: "fullName",
      value_json: '"Admin Name"',
      updated_by: "admin@example.com",
    });
  });

  it("同一 (member_id, stable_key) は上書き（ON CONFLICT）", async () => {
    const input = {
      memberId: asMemberId("m1"),
      stableKey: asStableKey("fullName"),
      updatedBy: "admin@example.com",
    };
    await upsertMemberFieldOverride(env.ctx, { ...input, valueJson: '"v1"' });
    await upsertMemberFieldOverride(env.ctx, { ...input, valueJson: '"v2"' });
    const rows = await listFieldOverridesByMemberId(env.ctx, asMemberId("m1"));
    expect(rows).toHaveLength(1);
    expect(rows[0].value_json).toBe('"v2"');
  });

  it("value_json=null（明示クリア）も保存できる", async () => {
    await upsertMemberFieldOverride(env.ctx, {
      memberId: asMemberId("m1"),
      stableKey: asStableKey("occupation"),
      valueJson: null,
      updatedBy: "admin@example.com",
    });
    const rows = await listFieldOverridesByMemberId(env.ctx, asMemberId("m1"));
    expect(rows[0].value_json).toBeNull();
  });

  it("listByMemberIds は複数 member を 1 query で取得・空配列は空", async () => {
    await upsertMemberFieldOverride(env.ctx, {
      memberId: asMemberId("m1"),
      stableKey: asStableKey("fullName"),
      valueJson: '"A"',
      updatedBy: "x",
    });
    await upsertMemberFieldOverride(env.ctx, {
      memberId: asMemberId("m2"),
      stableKey: asStableKey("fullName"),
      valueJson: '"B"',
      updatedBy: "x",
    });
    const rows = await listFieldOverridesByMemberIds(env.ctx, [
      asMemberId("m1"),
      asMemberId("m2"),
    ]);
    expect(rows).toHaveLength(2);
    expect(await listFieldOverridesByMemberIds(env.ctx, [])).toEqual([]);
  });
});
