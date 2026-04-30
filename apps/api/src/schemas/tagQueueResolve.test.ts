// 07a: TagQueueResolveBody zod schema test
import { describe, it, expect } from "vitest";
import { TagQueueResolveBody } from "./tagQueueResolve";

describe("TagQueueResolveBody", () => {
  it("confirmed + tagCodes は通る", () => {
    const r = TagQueueResolveBody.safeParse({
      action: "confirmed",
      tagCodes: ["a"],
    });
    expect(r.success).toBe(true);
  });

  it("confirmed + tagCodes 空配列は失敗", () => {
    const r = TagQueueResolveBody.safeParse({ action: "confirmed", tagCodes: [] });
    expect(r.success).toBe(false);
  });

  it("rejected + reason 必須", () => {
    const r = TagQueueResolveBody.safeParse({ action: "rejected", reason: "x" });
    expect(r.success).toBe(true);
  });

  it("rejected + 空 reason は失敗 (AC-2)", () => {
    const r = TagQueueResolveBody.safeParse({ action: "rejected", reason: "" });
    expect(r.success).toBe(false);
  });

  it("不正 action は失敗", () => {
    const r = TagQueueResolveBody.safeParse({ action: "other", tagCodes: ["a"] });
    expect(r.success).toBe(false);
  });

  it("confirmed に reason だけ送ると失敗", () => {
    const r = TagQueueResolveBody.safeParse({ action: "confirmed", reason: "x" });
    expect(r.success).toBe(false);
  });
});
