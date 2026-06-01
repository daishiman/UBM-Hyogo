// issue-1029 lane B: listMemberPhotosByIds（public list の N+1 防止 batch helper）の単体検証。
// DbCtx は prepare/bind/all をスタブした fake で注入する。
import { describe, expect, it, vi } from "vitest";

import type { DbCtx } from "../_shared/db";
import { listMemberPhotosByIds } from "../memberPhotos";

interface AllResult {
  results: Array<{ member_id: string; object_key: string }> | undefined;
}

/** prepare/bind/all を記録する fake DbCtx を作る。 */
function createFakeCtx(allResult: AllResult) {
  const calls: { sql: string; binds: unknown[] } = { sql: "", binds: [] };
  const prepare = vi.fn((sql: string) => {
    calls.sql = sql;
    return {
      bind: (...values: unknown[]) => {
        calls.binds = values;
        return {
          all: async () => allResult,
        };
      },
    };
  });
  const ctx = { db: { prepare } } as unknown as DbCtx;
  return { ctx, prepare, calls };
}

describe("listMemberPhotosByIds (issue-1029 lane B)", () => {
  it("B-1: 空配列は空 Map（SQL 非発行）", async () => {
    const { ctx, prepare } = createFakeCtx({ results: [] });
    const result = await listMemberPhotosByIds(ctx, []);
    expect(result.size).toBe(0);
    expect(prepare).not.toHaveBeenCalled();
  });

  it("B-2: 複数 id を Map で返す", async () => {
    const { ctx } = createFakeCtx({
      results: [
        { member_id: "m1", object_key: "members/m1/avatar" },
        { member_id: "m2", object_key: "members/m2/avatar" },
      ],
    });
    const result = await listMemberPhotosByIds(ctx, ["m1", "m2"]);
    expect(result.size).toBe(2);
    expect(result.get("m1")).toBe("members/m1/avatar");
    expect(result.get("m2")).toBe("members/m2/avatar");
  });

  it("B-3: 未登録 id は Map に含めない", async () => {
    const { ctx } = createFakeCtx({
      results: [
        { member_id: "m1", object_key: "members/m1/avatar" },
        { member_id: "m2", object_key: "members/m2/avatar" },
      ],
    });
    const result = await listMemberPhotosByIds(ctx, ["m1", "m2", "m3"]);
    expect(result.has("m3")).toBe(false);
    expect(result.size).toBe(2);
  });

  it("B-4: プレースホルダ数が id 数と一致し bind 引数が id 群", async () => {
    const { ctx, calls } = createFakeCtx({ results: [] });
    await listMemberPhotosByIds(ctx, ["m1", "m2", "m3"]);
    expect((calls.sql.match(/\?/g) ?? []).length).toBe(3);
    expect(calls.binds).toEqual(["m1", "m2", "m3"]);
  });

  it("B-5: results が undefined でも空 Map（throw しない）", async () => {
    const { ctx } = createFakeCtx({ results: undefined });
    const result = await listMemberPhotosByIds(ctx, ["m1"]);
    expect(result.size).toBe(0);
  });
});
