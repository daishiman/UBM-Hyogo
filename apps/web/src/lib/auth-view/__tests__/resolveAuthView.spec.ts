import { describe, expect, it } from "vitest";

import { resolveAuthView } from "..";

describe("resolveAuthView", () => {
  it("null session is guest", () => {
    expect(resolveAuthView(null)).toEqual({ kind: "guest" });
  });

  it("non-admin session is member", () => {
    expect(
      resolveAuthView({
        memberId: "m_1",
        email: "member@example.com",
        isAdmin: false,
      }),
    ).toEqual({ kind: "member", profileHref: "/profile" });
  });

  it("admin session is admin", () => {
    expect(
      resolveAuthView({
        memberId: "m_1",
        email: "admin@example.com",
        isAdmin: true,
      }),
    ).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });
});
