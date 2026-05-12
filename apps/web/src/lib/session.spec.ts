// ut-web-cov-03 Phase 5: session.ts unit test。
// 観点: getSession の null / 不完全 user / 完全 user / name optional / isAdmin coercion。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("./auth", () => ({
  getAuth: async () => ({ auth: (...args: unknown[]) => authMock(...args) }),
}));

import { getSession } from "./session";

describe("getSession", () => {
  beforeEach(() => {
    authMock.mockReset();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("auth() が null の場合 null を返す", async () => {
    authMock.mockResolvedValueOnce(null);
    expect(await getSession()).toBeNull();
  });

  it("session.user が無い場合 null", async () => {
    authMock.mockResolvedValueOnce({});
    expect(await getSession()).toBeNull();
  });

  it("memberId 欠落時は null", async () => {
    authMock.mockResolvedValueOnce({ user: { email: "u@example.com" } });
    expect(await getSession()).toBeNull();
  });

  it("email 欠落時は null", async () => {
    authMock.mockResolvedValueOnce({ user: { memberId: "m_1" } });
    expect(await getSession()).toBeNull();
  });

  it("memberId/email 揃えば SessionUser を返す（name 未指定 / isAdmin=false）", async () => {
    authMock.mockResolvedValueOnce({
      user: { memberId: "m_1", email: "u@example.com" },
    });
    expect(await getSession()).toEqual({
      memberId: "m_1",
      email: "u@example.com",
      isAdmin: false,
    });
  });

  it("name 指定時は SessionUser に含める", async () => {
    authMock.mockResolvedValueOnce({
      user: {
        memberId: "m_1",
        email: "u@example.com",
        name: "Taro",
        isAdmin: true,
      },
    });
    expect(await getSession()).toEqual({
      memberId: "m_1",
      email: "u@example.com",
      name: "Taro",
      isAdmin: true,
    });
  });

  it("isAdmin が true 以外は false に正規化", async () => {
    authMock.mockResolvedValueOnce({
      user: {
        memberId: "m_1",
        email: "u@example.com",
        isAdmin: "yes" as unknown as boolean,
      },
    });
    const r = await getSession();
    expect(r?.isAdmin).toBe(false);
  });
});
