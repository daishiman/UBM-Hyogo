import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionLike } from "../types";

const authMock = vi.hoisted(() => vi.fn());
const getAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    getAuth: () => getAuthMock(),
  };
});

import { buildAuthConfig } from "@/lib/auth";
import { getAuthView } from "../getAuthView";
import { resolveAuthView } from "../resolveAuthView";

const providerFactories = {
  GoogleProvider: (options: unknown) => ({ id: "google", options }),
  CredentialsProvider: (options: unknown) => ({ id: "credentials", options }),
};

const sessionFromToken = async (
  token: Record<string, unknown>,
): Promise<SessionLike> => {
  const cfg = buildAuthConfig(
    {},
    vi.fn() as unknown as typeof fetch,
    providerFactories,
  );
  return (await cfg.callbacks.session({
    session: { user: { email: "session@example.com" } },
    token,
  })) as SessionLike;
};

const expectGetAuthViewFromSession = async (session: SessionLike) => {
  authMock.mockResolvedValue(session);
  getAuthMock.mockResolvedValue({ auth: authMock });
  return getAuthView();
};

describe("AuthView session contract integration", () => {
  beforeEach(() => {
    authMock.mockReset();
    getAuthMock.mockReset();
  });

  it("real session callback output resolves to member view", async () => {
    const session = await sessionFromToken({
      memberId: "m_member",
      isAdmin: false,
    });

    expect(session.user?.memberId).toBe("m_member");
    expect(session.user?.isAdmin).toBe(false);
    expect(resolveAuthView(session)).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
    expect(await expectGetAuthViewFromSession(session)).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("real session callback output resolves to admin view", async () => {
    const session = await sessionFromToken({
      memberId: "m_admin",
      isAdmin: true,
    });

    expect(session.user?.memberId).toBe("m_admin");
    expect(session.user?.isAdmin).toBe(true);
    expect(resolveAuthView(session)).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
    expect(await expectGetAuthViewFromSession(session)).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });

  it("missing memberId from real session callback fails closed to guest", async () => {
    const session = await sessionFromToken({ isAdmin: true });

    expect(session.user?.memberId).toBe("");
    expect(session.user?.isAdmin).toBe(true);
    expect(resolveAuthView(session)).toEqual({ kind: "guest" });
    expect(await expectGetAuthViewFromSession(session)).toEqual({
      kind: "guest",
    });
  });

  it("falsey admin flag remains a member view when memberId is present", async () => {
    const session = await sessionFromToken({ memberId: "m_member" });

    expect(session.user?.memberId).toBe("m_member");
    expect(session.user?.isAdmin).toBe(false);
    expect(resolveAuthView(session)).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
    expect(await expectGetAuthViewFromSession(session)).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("whitespace-only memberId from real session callback fails closed to guest", async () => {
    const session = await sessionFromToken({ memberId: "  " });

    expect(session.user?.memberId).toBe("  ");
    expect(session.user?.isAdmin).toBe(false);
    expect(resolveAuthView(session)).toEqual({ kind: "guest" });
    expect(await expectGetAuthViewFromSession(session)).toEqual({
      kind: "guest",
    });
  });

  it("null admin flag normalizes to member view when memberId is present", async () => {
    const session = await sessionFromToken({
      memberId: "m_member",
      isAdmin: null,
    });

    expect(session.user?.memberId).toBe("m_member");
    expect(session.user?.isAdmin).toBe(false);
    expect(resolveAuthView(session)).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
    expect(await expectGetAuthViewFromSession(session)).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("string admin flag is not treated as admin", async () => {
    const session = await sessionFromToken({
      memberId: "m_member",
      isAdmin: "true",
    });

    expect(session.user?.memberId).toBe("m_member");
    expect(session.user?.isAdmin).toBe(false);
    expect(resolveAuthView(session)).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
    expect(await expectGetAuthViewFromSession(session)).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("session callback field names match the AuthView resolver contract", async () => {
    const session = await sessionFromToken({
      memberId: "m_contract",
      isAdmin: true,
      ignoredRole: "admin",
    });

    expect(Object.keys(session.user ?? {}).sort()).toEqual([
      "email",
      "isAdmin",
      "memberId",
      "name",
    ]);
    expect(resolveAuthView(session)).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });
});
