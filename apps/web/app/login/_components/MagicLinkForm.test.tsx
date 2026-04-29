// 06b U-03: MagicLinkForm の cooldown 60s カウントダウンテスト。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// next/navigation の useRouter を最小スタブ
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

// sendMagicLink を成功固定にモック
vi.mock("../../../src/lib/auth/magic-link-client", () => ({
  sendMagicLink: vi.fn(async () => ({ state: "sent" as const })),
}));

// replaceLoginState は副作用 (history) を避けるため no-op
vi.mock("../../../src/lib/url/login-state", () => ({
  replaceLoginState: vi.fn(),
}));

import { MagicLinkForm } from "./MagicLinkForm.client";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
});

describe("MagicLinkForm cooldown / U-03", () => {
  it("submit 後 60s cooldown でカウントダウンし 0 で再有効化", async () => {
    render(<MagicLinkForm redirect="/profile" />);

    const input = screen.getByLabelText("メールアドレス") as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: "user@example.com" } });
    });

    const button = screen.getByRole("button") as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    // submit を非同期解決させる
    await act(async () => {
      fireEvent.submit(button.closest("form")!);
      // sendMagicLink (async) の microtask を解放
      await Promise.resolve();
      await Promise.resolve();
    });

    // cooldown=60 でラベル表示・disabled
    expect(button.disabled).toBe(true);
    expect(button.textContent).toMatch(/60s 後に再送可能|59s 後に再送可能/);

    // 30s 進める
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(button.disabled).toBe(true);
    const after30 = button.textContent ?? "";
    const remaining30 = Number((after30.match(/(\d+)s/) ?? [, "0"])[1]);
    expect(remaining30).toBeLessThanOrEqual(30);
    expect(remaining30).toBeGreaterThan(0);

    // さらに 30s 進めて 0 へ
    await act(async () => {
      vi.advanceTimersByTime(31_000);
    });
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("メールリンクを送信");
  });
});
