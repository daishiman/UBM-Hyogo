// task-13 Phase 6: LoginPanel 6 状態 + gate=admin_required の render テスト。

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../../../src/lib/auth/magic-link-client", () => ({
  sendMagicLink: vi.fn(async () => ({ state: "sent" as const })),
}));

vi.mock("../../../../src/lib/auth/oauth-client", () => ({
  signInWithGoogle: vi.fn(async () => undefined),
}));

vi.mock("../../../../src/lib/url/login-state", () => ({
  replaceLoginState: vi.fn(),
}));

import { LoginPanel } from "../LoginPanel.client";

afterEach(() => cleanup());

describe("LoginPanel / 6 状態", () => {
  it("input: form / Google ボタン / register リンクが出る", () => {
    render(<LoginPanel state="input" redirect="/profile" />);
    expect(screen.getByLabelText("メールアドレス")).toBeTruthy();
    expect(screen.getByRole("button", { name: /google/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: "こちら" }).getAttribute("href")).toBe(
      "/register",
    );
  });

  it("input + gate=admin_required: warn Banner が出る", () => {
    render(
      <LoginPanel state="input" redirect="/profile" gate="admin_required" />,
    );
    expect(screen.getByText(/管理者権限が必要/)).toBeTruthy();
  });

  it("sent: success Banner と再送リンクが出る", () => {
    render(<LoginPanel state="sent" redirect="/profile" />);
    expect(screen.getByText(/メールを送信しました/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "別のメールアドレスで再送する" }),
    ).toBeTruthy();
  });

  it("unregistered: warn Banner と /register リンク", () => {
    render(<LoginPanel state="unregistered" redirect="/profile" />);
    expect(screen.getByText(/会員情報が見つかりません/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "登録ページへ進む" }).getAttribute("href"),
    ).toBe("/register");
  });

  it("deleted: alert Banner と管理者問い合わせ", () => {
    render(<LoginPanel state="deleted" redirect="/profile" />);
    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
    expect(screen.getByText(/管理者にお問い合わせください/)).toBeTruthy();
  });

  it("rules_declined: warn Banner と Google Form リンク", () => {
    render(<LoginPanel state="rules_declined" redirect="/profile" />);
    expect(screen.getByText(/利用規約への同意/)).toBeTruthy();
    const link = screen.getByRole("link", {
      name: "Google Form で再回答する",
    });
    expect(link.getAttribute("href")).toMatch(/docs\.google\.com/);
  });

  it("error: alert Banner と再試行リンク", () => {
    render(
      <LoginPanel state="error" redirect="/profile" error="送信失敗しました" />,
    );
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(screen.getByText(/送信失敗しました/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "ログイン画面に戻る" }).getAttribute("href"),
    ).toContain("/login?state=input");
  });
});
