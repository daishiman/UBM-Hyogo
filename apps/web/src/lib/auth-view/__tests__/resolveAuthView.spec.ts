import { describe, expect, it } from "vitest";

import { resolveAuthView } from "../resolveAuthView";

describe("resolveAuthView", () => {
  it("null session is guest", () => {
    expect(resolveAuthView(null)).toEqual({ kind: "guest" });
  });

  it("empty memberId is guest", () => {
    expect(resolveAuthView({ user: { memberId: "" } })).toEqual({
      kind: "guest",
    });
  });

  it("memberId without admin flag is member", () => {
    expect(resolveAuthView({ user: { memberId: "m_1" } })).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("admin session exposes profile and admin hrefs", () => {
    expect(
      resolveAuthView({ user: { memberId: "m_1", isAdmin: true } }),
    ).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });
});

