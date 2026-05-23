import { describe, expect, it } from "vitest";

import {
  buildPublicWhereParams,
  isPublicStatus,
} from "../public-filter";

describe("public-filter", () => {
  it("buildPublicWhereParams returns the canonical public filter", () => {
    expect(buildPublicWhereParams()).toEqual({
      publicConsent: "consented",
      publishState: "public",
      isDeleted: 0,
    });
  });

  it("isPublicStatus accepts the canonical case", () => {
    expect(
      isPublicStatus({
        publicConsent: "consented",
        publishState: "public",
        isDeleted: false,
      }),
    ).toBe(true);
  });

  it.each([
    ["declined consent", { publicConsent: "declined", publishState: "public", isDeleted: false }],
    ["unknown consent", { publicConsent: "unknown", publishState: "public", isDeleted: false }],
    ["member-only publish", { publicConsent: "consented", publishState: "member_only", isDeleted: false }],
    ["hidden publish", { publicConsent: "consented", publishState: "hidden", isDeleted: false }],
    ["deleted", { publicConsent: "consented", publishState: "public", isDeleted: true }],
  ])("isPublicStatus rejects %s", (_label, input) => {
    expect(isPublicStatus(input)).toBe(false);
  });
});
