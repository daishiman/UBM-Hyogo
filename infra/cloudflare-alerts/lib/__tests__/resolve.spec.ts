/**
 * Phase 7 §7-4 R1〜R6: resolve テスト
 */
import { describe, it, expect } from "vitest";
import { resolveWebhookId, computeThreshold } from "../resolve.ts";

describe("resolveWebhookId", () => {
  it("R1: name 一致で id を返す", () => {
    expect(
      resolveWebhookId("ut-17-relay", [{ id: "abc", name: "ut-17-relay" }]),
    ).toBe("abc");
  });

  it("R2: 一致しない name で例外", () => {
    expect(() => resolveWebhookId("ut-17-relay", [])).toThrow(/ut-17-relay/);
  });

  it("R3: 同名 webhook が複数の場合は例外 (曖昧性)", () => {
    expect(() =>
      resolveWebhookId("x", [
        { id: "a", name: "x" },
        { id: "b", name: "x" },
      ]),
    ).toThrow(/ambiguous/);
  });
});

describe("computeThreshold", () => {
  it("R4: 整数を返す (小数切り捨て)", () => {
    expect(computeThreshold(0.8, 100000)).toBe(80000);
  });

  it("R5: base が 0 で例外", () => {
    expect(() => computeThreshold(0.8, 0)).toThrow();
  });

  it("R6: percentage が 0..1 範囲外で例外", () => {
    expect(() => computeThreshold(1.5, 100)).toThrow();
    expect(() => computeThreshold(0, 100)).toThrow();
    expect(() => computeThreshold(-0.1, 100)).toThrow();
  });
});
