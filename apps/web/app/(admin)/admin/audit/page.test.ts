import { describe, expect, it } from "vitest";
import { jstLocalToUtcIso } from "./page";

describe("admin audit page helpers", () => {
  it("converts JST datetime-local values to UTC ISO query values", () => {
    expect(jstLocalToUtcIso("2026-05-01T00:00")).toBe("2026-04-30T15:00:00.000Z");
    expect(jstLocalToUtcIso("2026-05-01T23:59")).toBe("2026-05-01T14:59:00.000Z");
  });

  it("ignores invalid datetime-local values", () => {
    expect(jstLocalToUtcIso("2026-05-01")).toBeUndefined();
    expect(jstLocalToUtcIso(undefined)).toBeUndefined();
  });
});
