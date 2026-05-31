import { cleanup, render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "../page";
import { getSession } from "../../../../src/lib/session";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../../../src/lib/session", () => ({
  getSession: vi.fn(),
}));

afterEach(() => cleanup());

beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(redirect).mockClear();
});

describe("LoginPage authenticated redirect", () => {
  it("renders the existing login card for anonymous users", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "会員ログイン" })).not.toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects authenticated users to /profile by default", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "member@example.com",
      isAdmin: false,
    });

    await expect(LoginPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/profile",
    );

    expect(redirect).toHaveBeenCalledWith("/profile");
  });

  it("redirects authenticated users to a safe next path", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "member@example.com",
      isAdmin: false,
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({ next: "/admin/members" }) }),
    ).rejects.toThrow("REDIRECT:/admin/members");

    expect(redirect).toHaveBeenCalledWith("/admin/members");
  });

  it("uses the first next value when searchParams provides an array", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "member@example.com",
      isAdmin: false,
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({ next: ["/profile", "/admin"] }) }),
    ).rejects.toThrow("REDIRECT:/profile");

    expect(redirect).toHaveBeenCalledWith("/profile");
  });

  it("falls back to /profile for unsafe next values", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "member@example.com",
      isAdmin: false,
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({ next: "//evil.example.com" }) }),
    ).rejects.toThrow("REDIRECT:/profile");

    expect(redirect).toHaveBeenCalledWith("/profile");
  });

  it("prevents /login redirect loops", async () => {
    vi.mocked(getSession).mockResolvedValue({
      memberId: "m1",
      email: "member@example.com",
      isAdmin: false,
    });

    await expect(
      LoginPage({ searchParams: Promise.resolve({ next: "/login?state=sent" }) }),
    ).rejects.toThrow("REDIRECT:/profile");

    expect(redirect).toHaveBeenCalledWith("/profile");
  });
});
