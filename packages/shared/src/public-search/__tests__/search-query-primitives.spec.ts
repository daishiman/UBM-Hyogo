import { describe, expect, it } from "vitest";

import {
  PUBLIC_MEMBER_DENSITY_VALUES,
  PUBLIC_MEMBER_SEARCH_LIMITS,
  PUBLIC_MEMBER_SORT_VALUES,
  PUBLIC_MEMBER_STATUS_VALUES,
  PUBLIC_MEMBER_ZONE_VALUES,
  PublicMemberSortZ,
  clampPublicMemberLimit,
  normalizePublicMemberQ,
  normalizePublicMemberStatus,
  normalizePublicMemberTags,
  normalizePublicMemberZone,
} from "../search-query-primitives";

describe("public member search query primitives", () => {
  it("SP-01: trims q and collapses whitespace", () => {
    expect(normalizePublicMemberQ("  hello   world  ")).toBe("hello world");
  });

  it("SP-02: truncates q to the public search limit", () => {
    expect(normalizePublicMemberQ("x".repeat(250))).toHaveLength(
      PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT,
    );
  });

  it("SP-03: removes empty tags and deduplicates", () => {
    expect(normalizePublicMemberTags(["ai", "ai", "dx", ""])).toEqual([
      "ai",
      "dx",
    ]);
  });

  it("SP-04: truncates tags to the public tag limit", () => {
    expect(
      normalizePublicMemberTags(["a", "b", "c", "d", "e", "f", "g"]),
    ).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("SP-05: clamps oversized limits to max", () => {
    expect(clampPublicMemberLimit(999)).toBe(100);
  });

  it("SP-06: clamps undersized limits to min", () => {
    expect(clampPublicMemberLimit(0)).toBe(1);
  });

  it("SP-07: truncates fractional limits", () => {
    expect(clampPublicMemberLimit(30.9)).toBe(30);
  });

  it("SP-08: falls back invalid zones to all", () => {
    expect(normalizePublicMemberZone("invalid")).toBe("all");
  });

  it("SP-09: preserves valid zone values", () => {
    expect(normalizePublicMemberZone("0_to_1")).toBe("0_to_1");
  });

  it("SP-10: preserves valid status values and falls back invalid values", () => {
    expect(normalizePublicMemberStatus("non_member")).toBe("non_member");
    expect(normalizePublicMemberStatus("ghost")).toBe("all");
  });

  it("SP-11: keeps zod sort fallback behavior available to app parsers", () => {
    expect(PublicMemberSortZ.catch("recent").parse("bad")).toBe("recent");
  });

  it("SP-12: guards the shared tuple values against drift", () => {
    expect(PUBLIC_MEMBER_ZONE_VALUES).toEqual([
      "all",
      "0_to_1",
      "1_to_10",
      "10_to_100",
    ]);
    expect(PUBLIC_MEMBER_STATUS_VALUES).toEqual([
      "all",
      "member",
      "non_member",
      "academy",
    ]);
    expect(PUBLIC_MEMBER_SORT_VALUES).toEqual(["recent", "name"]);
    expect(PUBLIC_MEMBER_DENSITY_VALUES).toEqual(["comfy", "dense", "list"]);
  });
});
