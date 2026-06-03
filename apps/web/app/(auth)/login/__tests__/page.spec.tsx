import { cleanup, render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AuthLayout from "../../layout";
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
  it("auth layout keeps the login route bare and warm themed", () => {
    const { container } = render(
      <AuthLayout>
        <p data-testid="child">child</p>
      </AuthLayout>,
    );

    const shell = screen.getByTestId("auth-shell");
    expect(shell.getAttribute("data-theme")).toBe("warm");
    expect(shell.getAttribute("data-route-group")).toBe("auth");
    expect(shell.getAttribute("data-shell-mode")).toBe("bare");
    expect(screen.getByTestId("child")).not.toBeNull();
    expect(container.querySelector('[data-testid="public-shell"]')).toBeNull();
    expect(container.querySelector("aside")).toBeNull();
  });

  it("renders the existing login card for anonymous users", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "会員ログイン" })).not.toBeNull();
    expect(document.querySelector('[data-testid="public-shell"]')).toBeNull();
    expect(document.querySelector("aside")).toBeNull();
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
