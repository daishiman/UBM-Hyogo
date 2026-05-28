import { describe, expect, it } from "vitest";

import { resolveAuthView } from "../resolveAuthView";

describe("resolveAuthView", () => {
  it("null は guest", () => {
    expect(resolveAuthView(null)).toEqual({ kind: "guest" });
  });

  it("memberId が空文字なら guest", () => {
    expect(resolveAuthView({ user: { memberId: "" } })).toEqual({ kind: "guest" });
  });

  it("memberId ありで isAdmin 未指定は member", () => {
    expect(resolveAuthView({ user: { memberId: "m1" } })).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("memberId + isAdmin=true は admin", () => {
    expect(resolveAuthView({ user: { memberId: "m1", isAdmin: true } })).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });
});
