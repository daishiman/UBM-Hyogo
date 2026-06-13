import { describe, expect, it } from "vitest";

import { AdminMemberSearchZ, toAdminApiQuery } from "./search";

describe("AdminMemberSearchZ (06c-B / 12-search-tags)", () => {
  it("applies all defaults for an empty object", () => {
    const parsed = AdminMemberSearchZ.parse({});
    expect(parsed).toEqual({
      filter: "",
      q: "",
      zone: "all",
      tag: [],
      sort: "recent",
      density: "comfy",
      page: 1,
    });
  });

  it("normalizes q by trimming and collapsing whitespace", () => {
    const parsed = AdminMemberSearchZ.parse({ q: "  foo   bar baz  " });
    expect(parsed.q).toBe("foo bar baz");
  });

  it("accepts non-default enum / array / page values", () => {
    const parsed = AdminMemberSearchZ.parse({
      filter: "published",
      zone: "1_to_10",
      tag: ["a", "b"],
      sort: "name",
      density: "list",
      page: 3,
    });
    expect(parsed.filter).toBe("published");
    expect(parsed.zone).toBe("1_to_10");
    expect(parsed.tag).toEqual(["a", "b"]);
    expect(parsed.sort).toBe("name");
    expect(parsed.density).toBe("list");
    expect(parsed.page).toBe(3);
  });

  it("rejects invalid enum / out-of-range values", () => {
    expect(() => AdminMemberSearchZ.parse({ zone: "bogus" })).toThrow();
    expect(() => AdminMemberSearchZ.parse({ sort: "bogus" })).toThrow();
    expect(() => AdminMemberSearchZ.parse({ page: 0 })).toThrow();
    expect(() => AdminMemberSearchZ.parse({ tag: ["", "x"] })).toThrow();
    expect(() =>
      AdminMemberSearchZ.parse({ tag: ["a", "b", "c", "d", "e", "f"] }),
    ).toThrow();
  });
});

describe("toAdminApiQuery", () => {
  it("omits every default value", () => {
    const params = toAdminApiQuery({
      filter: "",
      q: "",
      zone: "all",
      tag: [],
      sort: "recent",
      density: "comfy",
      page: 1,
    });
    expect(params.toString()).toBe("");
  });

  it("emits only non-default values", () => {
    const params = toAdminApiQuery({
      filter: "hidden",
      q: "alice",
      zone: "10_to_100",
      tag: ["x", "y"],
      sort: "name",
      density: "dense",
      page: 2,
    });
    expect(params.get("filter")).toBe("hidden");
    expect(params.get("q")).toBe("alice");
    expect(params.get("zone")).toBe("10_to_100");
    expect(params.getAll("tag")).toEqual(["x", "y"]);
    expect(params.get("sort")).toBe("name");
    expect(params.get("density")).toBe("dense");
    expect(params.get("page")).toBe("2");
  });

  it("treats empty q, all-zone, recent-sort, comfy-density, page<=1 as omitted", () => {
    const params = toAdminApiQuery({
      q: "",
      zone: "all",
      sort: "recent",
      density: "comfy",
      page: 1,
    });
    expect(params.has("q")).toBe(false);
    expect(params.has("zone")).toBe(false);
    expect(params.has("sort")).toBe(false);
    expect(params.has("density")).toBe(false);
    expect(params.has("page")).toBe(false);
  });

  it("handles a fully empty partial (all branches falsy)", () => {
    expect(toAdminApiQuery({}).toString()).toBe("");
  });

  it("appends repeated tags including an empty tag array (no append)", () => {
    expect(toAdminApiQuery({ tag: [] }).getAll("tag")).toEqual([]);
    expect(toAdminApiQuery({ tag: ["solo"] }).getAll("tag")).toEqual(["solo"]);
  });
});
