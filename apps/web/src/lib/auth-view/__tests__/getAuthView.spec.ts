import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getAuthMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getAuth: () => getAuthMock(),
}));

import { getAuthView } from "../getAuthView";

describe("getAuthView", () => {
  beforeEach(() => {
    authMock.mockReset();
    getAuthMock.mockReset();
    getAuthMock.mockResolvedValue({ auth: authMock });
  });

  it("auth() の session を AuthView に解決する", async () => {
    authMock.mockResolvedValue({ user: { memberId: "m_1" } });
    expect(await getAuthView()).toEqual({
      kind: "member",
      profileHref: "/profile",
    });
  });

  it("admin session を admin view に解決する", async () => {
    authMock.mockResolvedValue({ user: { memberId: "m_1", isAdmin: true } });
    expect(await getAuthView()).toEqual({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
  });

  it("auth() が null を返した場合は guest", async () => {
    authMock.mockResolvedValue(null);
    expect(await getAuthView()).toEqual({ kind: "guest" });
  });

  it("auth 取得失敗時は guest に fail-closed する", async () => {
    getAuthMock.mockRejectedValue(new Error("auth unavailable"));
    expect(await getAuthView()).toEqual({ kind: "guest" });
  });
});
