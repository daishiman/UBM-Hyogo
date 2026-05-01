import { describe, expect, it } from "vitest";

import { tagQueueResolveBodySchema } from "./tag-queue-resolve";

describe("tagQueueResolveBodySchema", () => {
  it("accepts confirmed bodies with at least one tag code", () => {
    const parsed = tagQueueResolveBodySchema.safeParse({
      action: "confirmed",
      tagCodes: ["tag-1"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects confirmed bodies without tag codes", () => {
    expect(
      tagQueueResolveBodySchema.safeParse({ action: "confirmed", tagCodes: [] }).success,
    ).toBe(false);
    expect(tagQueueResolveBodySchema.safeParse({ action: "confirmed" }).success).toBe(false);
  });

  it("accepts rejected bodies with a non-empty reason", () => {
    const parsed = tagQueueResolveBodySchema.safeParse({
      action: "rejected",
      reason: "duplicate",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects rejected bodies without a non-empty reason", () => {
    expect(tagQueueResolveBodySchema.safeParse({ action: "rejected", reason: "" }).success).toBe(
      false,
    );
    expect(tagQueueResolveBodySchema.safeParse({ action: "rejected" }).success).toBe(false);
  });

  it("rejects missing or unknown discriminators", () => {
    expect(tagQueueResolveBodySchema.safeParse({ tagCodes: ["tag-1"] }).success).toBe(false);
    expect(
      tagQueueResolveBodySchema.safeParse({ action: "unknown", tagCodes: ["tag-1"] }).success,
    ).toBe(false);
  });

  it("rejects mixed confirmed and rejected bodies", () => {
    expect(
      tagQueueResolveBodySchema.safeParse({
        action: "confirmed",
        tagCodes: ["tag-1"],
        reason: "duplicate",
      }).success,
    ).toBe(false);
    expect(
      tagQueueResolveBodySchema.safeParse({
        action: "rejected",
        reason: "duplicate",
        tagCodes: ["tag-1"],
      }).success,
    ).toBe(false);
  });
});
