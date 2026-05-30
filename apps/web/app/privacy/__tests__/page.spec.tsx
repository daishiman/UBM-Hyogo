import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { AuthView } from "../../../src/lib/auth-view/types";

vi.mock("../../../src/lib/auth-view/getAuthView", () => ({
  getAuthView: vi.fn(async () => ({ kind: "guest" }) as AuthView),
}));

// PublicHeader は async server component のため、test 環境では同期 stub で
// 描画契約（data-component / data-role）を再現する。
vi.mock("../../../src/components/public/PublicHeader", () => ({
  PublicHeader: ({ authView }: { authView: AuthView }) => (
    <div data-component="public-header" data-auth-state={authView.kind}>
      {authView.kind === "guest" ? (
        <a href="/login" data-role="auth-cta">
          ログイン
        </a>
      ) : authView.kind === "member" ? (
        <a href={authView.profileHref} data-role="member-cta">
          マイページ
        </a>
      ) : (
        <>
          <a href={authView.profileHref} data-role="member-cta">
            マイページ
          </a>
          <a href={authView.adminHref} data-role="admin-cta">
            管理
          </a>
        </>
      )}
    </div>
  ),
}));

vi.mock("../../../src/components/public/PublicFooter", () => ({
  PublicFooter: () => <div data-component="public-footer" />,
}));

import PrivacyPage, { metadata } from "../page";
import { getAuthView } from "../../../src/lib/auth-view/getAuthView";

afterEach(() => cleanup());

beforeEach(() => {
  vi.mocked(getAuthView).mockResolvedValue({ kind: "guest" });
});

async function renderPage() {
  const ui = await PrivacyPage();
  return render(ui);
}

describe("PrivacyPage", () => {
  it("renders public shell for guest", async () => {
    const { container } = await renderPage();
    const shell = container.querySelector('[data-testid="public-shell"]');
    expect(shell).not.toBeNull();
    expect(shell?.getAttribute("data-route-group")).toBe("public");
    expect(shell?.getAttribute("data-theme")).toBe("warm");
    expect(shell?.getAttribute("data-auth-state")).toBe("guest");
    expect(shell?.className).toContain("grid");
    expect(shell?.className).toContain("min-h-screen");
    expect(shell?.className).toContain("bg-[var(--ubm-color-surface-bg)]");
    expect(container.querySelector('[data-component="public-header"]')).toBeTruthy();
  });

  it("renders member CTA when authView=member", async () => {
    vi.mocked(getAuthView).mockResolvedValue({
      kind: "member",
      profileHref: "/profile",
    });
    const { container } = await renderPage();
    expect(
      container.querySelector('[data-testid="public-shell"]')?.getAttribute("data-auth-state"),
    ).toBe("member");
    expect(container.querySelector('[data-role="member-cta"]')).toBeTruthy();
  });

  it("renders admin CTA when authView=admin", async () => {
    vi.mocked(getAuthView).mockResolvedValue({
      kind: "admin",
      profileHref: "/profile",
      adminHref: "/admin",
    });
    const { container } = await renderPage();
    expect(container.querySelector('[data-role="admin-cta"]')).toBeTruthy();
  });

  it("footer mounted", async () => {
    const { container } = await renderPage();
    expect(container.querySelector('[data-component="public-footer"]')).toBeTruthy();
  });

  it("h1 preserved", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "プライバシーポリシー" })).toBeTruthy();
  });

  it("data-page=privacy が main に付与", async () => {
    const { container } = await renderPage();
    expect(container.querySelector('main[data-page="privacy"]')).not.toBeNull();
  });

  it("metadata は変更されていない", () => {
    expect(metadata.title).toBe("プライバシーポリシー | UBM 兵庫支部会");
    expect(metadata.description).toBe("UBM 兵庫支部会のプライバシーポリシー");
  });
});
