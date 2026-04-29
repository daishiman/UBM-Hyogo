import { describe, expect, it } from "vitest";

import {
  parsePublicMemberQuery,
  DEFAULT_PUBLIC_MEMBER_QUERY,
} from "../search-query-parser";

describe("search-query-parser", () => {
  it("returns defaults for empty input", () => {
    expect(parsePublicMemberQuery({})).toEqual(DEFAULT_PUBLIC_MEMBER_QUERY);
  });

  it("preserves valid input", () => {
    const r = parsePublicMemberQuery({
      q: "engineer",
      zone: "0_to_1",
      status: "member",
      tag: ["ai", "dx"],
      sort: "name",
      density: "dense",
      page: "2",
      limit: "30",
    });
    expect(r).toEqual({
      q: "engineer",
      zone: "0_to_1",
      status: "member",
      tags: ["ai", "dx"],
      sort: "name",
      density: "dense",
      page: 2,
      limit: 30,
    });
  });

  it("AC-6: invalid sort falls back to recent", () => {
    expect(parsePublicMemberQuery({ sort: "__proto__" }).sort).toBe("recent");
  });

  it("AC-6: invalid zone/status fall back to all", () => {
    const r = parsePublicMemberQuery({ zone: "invalid", status: "ghost" });
    expect(r.zone).toBe("all");
    expect(r.status).toBe("all");
  });

  it("AC-6: invalid density falls back to comfy", () => {
    expect(parsePublicMemberQuery({ density: "huge" }).density).toBe("comfy");
  });

  it("AC-11: limit clamps at 100", () => {
    expect(parsePublicMemberQuery({ limit: "200" }).limit).toBe(100);
    expect(parsePublicMemberQuery({ limit: "0" }).limit).toBe(1);
    expect(parsePublicMemberQuery({ limit: "-5" }).limit).toBe(1);
  });

  it("dedups repeated tags and accepts both tag/tags forms", () => {
    expect(parsePublicMemberQuery({ tag: ["ai", "dx", "ai"] }).tags).toEqual([
      "ai",
      "dx",
    ]);
  });

  it("truncates very long q", () => {
    const long = "a".repeat(500);
    expect(parsePublicMemberQuery({ q: long }).q.length).toBe(200);
  });

  it("invalid page falls back to 1", () => {
    expect(parsePublicMemberQuery({ page: "abc" }).page).toBe(1);
    expect(parsePublicMemberQuery({ page: "0" }).page).toBe(1);
  });
});
