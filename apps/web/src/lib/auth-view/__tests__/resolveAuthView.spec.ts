import { describe, expect, it } from "vitest";

import { resolveAuthView } from "../resolveAuthView";

describe("resolveAuthView", () => {
  it("null session is guest", () => {
    expect(resolveAuthView(null)).toEqual({ kind: "guest" });
  });

  it("missing member id is guest", () => {
    expect(resolveAuthView({ user: { memberId: "" } })).toEqual({ kind: "guest" });
  });

  it("member session is member auth view", () => {
    expect(resolveAuthView({ user: { memberId: "m-1" } })).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("admin session is admin auth view", () => {
    expect(resolveAuthView({ user: { memberId: "admin-1", isAdmin: true } })).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });
});

