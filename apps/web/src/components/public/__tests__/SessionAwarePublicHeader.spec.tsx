import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const sessionMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  usePathname: vi.fn(() => "/profile"),
}));

vi.mock("../../../lib/session", () => ({
  getSession: sessionMocks.getSession,
}));

vi.mock("next/navigation", () => ({
  usePathname: sessionMocks.usePathname,
}));

import { SessionAwarePublicHeader } from "../SessionAwarePublicHeader";

afterEach(() => {
  cleanup();
  sessionMocks.getSession.mockReset();
  sessionMocks.usePathname.mockReset();
  sessionMocks.usePathname.mockReturnValue("/profile");
});

describe("SessionAwarePublicHeader", () => {
  it("session が無い場合は匿名ヘッダを描画する", async () => {
    sessionMocks.getSession.mockResolvedValue(null);

    const { container } = render(await SessionAwarePublicHeader());

    const cta = container.querySelector('[data-role="auth-cta"]');
    expect(cta?.getAttribute("href")).toBe("/login");
    expect(cta?.getAttribute("data-state")).toBe("anonymous");
    expect(container.querySelector('[data-role="auth-cta"]')).not.toBeNull();
  });

  it("session がある場合は currentUser と currentPath を PublicHeader に渡す", async () => {
    sessionMocks.getSession.mockResolvedValue({
      memberId: "mem-1",
      email: "member@example.com",
      name: "山田 太郎",
      isAdmin: false,
    });

    const { container } = render(await SessionAwarePublicHeader());

    const cta = container.querySelector('[data-role="auth-cta"]');
    expect(cta?.getAttribute("href")).toBe("/profile");
    expect(cta?.getAttribute("data-state")).toBe("authenticated");
    expect(cta?.getAttribute("aria-current")).toBe("page");
  });
});
