import { describe, expect, it } from "vitest";

import {
  buildVisibilityIndex,
  isPublicVisibility,
  keepPublicFields,
  type VisibilityIndexEntry,
} from "../visibility-filter";

const entry = (
  stableKey: string,
  visibility: string,
): VisibilityIndexEntry => ({
  stableKey,
  visibility,
  sectionKey: "s1",
  sectionTitle: "S1",
  label: stableKey,
  kind: "short_text",
  position: 0,
});

describe("visibility-filter", () => {
  it("isPublicVisibility returns true only for public", () => {
    const idx = buildVisibilityIndex([
      entry("a", "public"),
      entry("b", "member_only"),
      entry("c", "internal"),
    ]);
    expect(isPublicVisibility("a", idx)).toBe(true);
    expect(isPublicVisibility("b", idx)).toBe(false);
    expect(isPublicVisibility("c", idx)).toBe(false);
    expect(isPublicVisibility("missing", idx)).toBe(false);
  });

  it("keepPublicFields filters by visibility", () => {
    const idx = buildVisibilityIndex([
      entry("fullName", "public"),
      entry("responseEmail", "internal"),
      entry("location", "public"),
    ]);
    const result = keepPublicFields(
      [
        { stableKey: "fullName", value: "x" },
        { stableKey: "responseEmail", value: "y@z" },
        { stableKey: "location", value: "Kobe" },
        { stableKey: "unknown", value: "?" },
      ],
      idx,
    );
    expect(result.map((r) => r.stableKey)).toEqual(["fullName", "location"]);
  });
});
