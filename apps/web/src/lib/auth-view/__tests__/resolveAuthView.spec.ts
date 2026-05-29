import { describe, expect, it } from "vitest";

import { resolveAuthView } from "../resolveAuthView";

describe("resolveAuthView", () => {
  it("null session は guest", () => {
    expect(resolveAuthView(null)).toEqual({ kind: "guest" });
  });

  it("undefined session は guest", () => {
    expect(resolveAuthView(undefined)).toEqual({ kind: "guest" });
  });

  it("user が null なら guest", () => {
    expect(resolveAuthView({ user: null })).toEqual({ kind: "guest" });
  });

  it("memberId が null なら guest", () => {
    expect(resolveAuthView({ user: { memberId: null } })).toEqual({
      kind: "guest",
    });
  });

  it("memberId が空なら guest", () => {
    expect(resolveAuthView({ user: { memberId: " " } })).toEqual({
      kind: "guest",
    });
  });

  it("memberId があれば member", () => {
    expect(resolveAuthView({ user: { memberId: "m_1" } })).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("isAdmin が false なら member", () => {
    expect(
      resolveAuthView({ user: { memberId: "m_1", isAdmin: false } }),
    ).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("isAdmin が null なら member", () => {
    expect(
      resolveAuthView({ user: { memberId: "m_1", isAdmin: null } }),
    ).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("admin session は admin", () => {
    expect(
      resolveAuthView({ user: { memberId: "m_1", isAdmin: true } }),
    ).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });
});
