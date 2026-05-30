import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(async () => undefined),
}));

import { MemberHeader } from "../MemberHeader";

afterEach(() => cleanup());

describe("MemberHeader", () => {
  it("authView 未指定では member state として admin リンクを出さない", () => {
    render(<MemberHeader />);
    const header = screen.getByTestId("member-header");
    expect(header.getAttribute("data-auth-state")).toBe("member");
    expect(header.querySelector('[data-role="admin-cta"]')).toBeNull();
  });

  it("member session では admin リンクを出さない", () => {
    render(<MemberHeader authView={{ kind: "member", profileHref: "/profile" }} />);
    const header = screen.getByTestId("member-header");
    expect(header.getAttribute("data-auth-state")).toBe("member");
    expect(header.querySelector('[data-role="admin-cta"]')).toBeNull();
  });

  it("admin session だけ管理リンクを出す", () => {
    render(
      <MemberHeader
        authView={{
          kind: "admin",
          profileHref: "/profile",
          adminHref: "/admin",
        }}
      />,
    );
    const header = screen.getByTestId("member-header");
    const link = header.querySelector('[data-role="admin-cta"]');
    expect(header.getAttribute("data-auth-state")).toBe("admin");
    expect(link?.getAttribute("href")).toBe("/admin");
    expect(link?.getAttribute("aria-label")).toBe("管理ダッシュボードへ移動");
  });

  it("guest authView は fail-closed で member state として扱う", () => {
    render(<MemberHeader authView={{ kind: "guest" }} />);
    const header = screen.getByTestId("member-header");
    expect(header.getAttribute("data-auth-state")).toBe("member");
    expect(header.querySelector('[data-role="admin-cta"]')).toBeNull();
  });

  it("全ケースで SignOutButton / brand / nav links を維持する", () => {
    const cases = [
      undefined,
      { kind: "guest" } as const,
      { kind: "member", profileHref: "/profile" } as const,
      { kind: "admin", profileHref: "/profile", adminHref: "/admin" } as const,
    ];

    for (const authView of cases) {
      const props = authView === undefined ? {} : { authView };
      const { unmount } = render(<MemberHeader {...props} />);
      expect(screen.getByTestId("sign-out-button")).toBeTruthy();
      expect(screen.getByLabelText("UBM 兵庫")).toBeTruthy();
      expect(screen.getByRole("link", { name: "マイページ" }).getAttribute("href")).toBe(
        "/profile",
      );
      expect(screen.getByRole("link", { name: "公開ページ" }).getAttribute("href")).toBe(
        "/members",
      );
      unmount();
    }
  });
});
