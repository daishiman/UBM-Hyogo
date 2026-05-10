import { describe, expect, it } from "vitest";

import { buildPaginationMeta } from "../pagination";

describe("buildPaginationMeta", () => {
  it("computes meta for typical case", () => {
    expect(buildPaginationMeta(45, 2, 20)).toEqual({
      total: 45,
      page: 2,
      limit: 20,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  it("returns 0 totalPages and no next/prev for empty result", () => {
    expect(buildPaginationMeta(0, 1, 20)).toEqual({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  it("first page has no prev", () => {
    const m = buildPaginationMeta(10, 1, 5);
    expect(m.hasPrev).toBe(false);
    expect(m.hasNext).toBe(true);
  });

  it("last page has no next", () => {
    const m = buildPaginationMeta(10, 2, 5);
    expect(m.hasPrev).toBe(true);
    expect(m.hasNext).toBe(false);
  });

  it("clamps negative input safely", () => {
    const m = buildPaginationMeta(-5, -1, -10);
    expect(m.total).toBe(0);
    expect(m.page).toBe(1);
    expect(m.limit).toBe(1);
  });
});
