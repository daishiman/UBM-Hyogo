import { describe, expect, it } from "vitest";

import { adminRequestResolveBodySchema } from "./admin-request-resolve";

describe("adminRequestResolveBodySchema", () => {
  it("accepts approve and reject bodies", () => {
    expect(adminRequestResolveBodySchema.safeParse({ resolution: "approve" }).success).toBe(true);
    expect(
      adminRequestResolveBodySchema.safeParse({
        resolution: "reject",
        resolutionNote: "handled manually",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown resolutions and oversized notes", () => {
    expect(adminRequestResolveBodySchema.safeParse({ resolution: "confirmed" }).success).toBe(
      false,
    );
    expect(
      adminRequestResolveBodySchema.safeParse({
        resolution: "reject",
        resolutionNote: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("rejects extra keys", () => {
    expect(
      adminRequestResolveBodySchema.safeParse({
        resolution: "approve",
        noteId: "note_1",
      }).success,
    ).toBe(false);
  });
});
