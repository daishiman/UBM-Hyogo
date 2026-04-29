import { describe, expect, it } from "vitest";

import {
  MEMBERS_SEARCH_LIMITS,
  membersSearchSchema,
  parseSearchParams,
  toApiQuery,
} from "../members-search";

describe("membersSearchSchema (Phase 4 U-01〜U-06)", () => {
  it("U-01: q + zone を保持し、未指定 key は初期値で埋まる", () => {
    const result = parseSearchParams({ q: "hello", zone: "0_to_1" });
    expect(result).toEqual({
      q: "hello",
      zone: "0_to_1",
      status: "all",
      tag: [],
      sort: "recent",
      density: "comfy",
    });
  });

  it("U-02: 不明な zone は all にフォールバック", () => {
    const result = parseSearchParams({ zone: "invalid" });
    expect(result.zone).toBe("all");
  });

  it("U-03: density=compact は comfy にフォールバック (comfortable/compact 不採用)", () => {
    const result = parseSearchParams({ density: "compact" });
    expect(result.density).toBe("comfy");
  });

  it("U-04: tag は repeated query を配列で保持", () => {
    const result = parseSearchParams({ tag: ["ai", "dx"] });
    expect(result.tag).toEqual(["ai", "dx"]);
  });

  it("U-05: tag が 6 件以上は 5 件で truncate", () => {
    const result = parseSearchParams({
      tag: ["a", "b", "c", "d", "e", "f", "g"],
    });
    expect(result.tag).toHaveLength(MEMBERS_SEARCH_LIMITS.TAG_LIMIT);
    expect(result.tag).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("U-06: q は trim + 連続空白を 1 つに正規化", () => {
    const result = parseSearchParams({ q: "  hello   world  " });
    expect(result.q).toBe("hello world");
  });

  it("q 200 文字超は truncate", () => {
    const long = "a".repeat(250);
    const result = parseSearchParams({ q: long });
    expect(result.q).toHaveLength(MEMBERS_SEARCH_LIMITS.Q_LIMIT);
  });

  it("zod schema 直接呼び出しでも catch が機能する", () => {
    const parsed = membersSearchSchema.parse({
      q: "x",
      zone: "bogus",
      status: "wat",
      tag: ["x"],
      sort: "name",
      density: "list",
    });
    expect(parsed.zone).toBe("all");
    expect(parsed.status).toBe("all");
    expect(parsed.sort).toBe("name");
    expect(parsed.density).toBe("list");
  });
});

describe("toApiQuery", () => {
  it("初期値は省略する", () => {
    const params = toApiQuery({
      q: "",
      zone: "all",
      status: "all",
      tag: [],
      sort: "recent",
      density: "comfy",
    });
    expect(params.toString()).toBe("");
  });

  it("非初期値は全て出力、tag は repeated", () => {
    const params = toApiQuery({
      q: "x",
      zone: "0_to_1",
      status: "member",
      tag: ["ai", "dx"],
      sort: "name",
      density: "dense",
    });
    const str = params.toString();
    expect(str).toContain("q=x");
    expect(str).toContain("zone=0_to_1");
    expect(str).toContain("status=member");
    expect(str).toContain("tag=ai");
    expect(str).toContain("tag=dx");
    expect(str).toContain("sort=name");
    expect(str).toContain("density=dense");
  });
});
