import { describe, it, expect } from "vitest";
import { memberHue } from "./member-hue";

describe("memberHue", () => {
  it("returns deterministic 0..7 bucket for same input", () => {
    const a = memberHue("member-001");
    const b = memberHue("member-001");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(7);
  });

  it("handles empty string", () => {
    expect(memberHue("")).toBe(0);
  });

  it("distributes across multiple ids", () => {
    const buckets = new Set<number>();
    for (let i = 0; i < 100; i++) buckets.add(memberHue(`m-${i}`));
    expect(buckets.size).toBeGreaterThan(1);
  });
});
