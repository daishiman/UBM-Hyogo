import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { AdminTopbarActions } from "../AdminTopbarActions";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

afterEach(() => cleanup());

describe("AdminTopbarActions", () => {
  it("MVP グローバル操作としてログアウト button が 1 つ存在する", () => {
    render(<AdminTopbarActions />);
    expect(screen.getByRole("button", { name: /ログアウト/ })).not.toBeNull();
  });

  it("ページ固有操作ラベル（責務境界違反）を含まない", () => {
    render(<AdminTopbarActions />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent ?? "");
    for (const forbidden of ["新規追加", "タグ作成", "保存", "削除"]) {
      expect(labels.some((l) => l.includes(forbidden))).toBe(false);
    }
  });

  it("root が data-testid=admin-topbar-actions-island を持つ", () => {
    render(<AdminTopbarActions />);
    expect(screen.getByTestId("admin-topbar-actions-island")).not.toBeNull();
  });

  it("wrapper className に HEX / arbitrary color が含まれない", () => {
    render(<AdminTopbarActions />);
    const root = screen.getByTestId("admin-topbar-actions-island");
    const cls = root.className;
    expect(cls).not.toMatch(/bg-\[#/);
    expect(cls).not.toMatch(/text-\[#/);
    expect(cls).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
