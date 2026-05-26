# Phase 6 — テスト追加

## 6.1 AdminTopbarActions.spec.tsx 実装

`apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AdminTopbarActions } from "../AdminTopbarActions";

// next-auth/react の signOut を mock（client 実行時の副作用を抑制）
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("AdminTopbarActions", () => {
  it("MVP グローバル操作としてログアウト button が 1 つ存在する", () => {
    render(<AdminTopbarActions />);
    expect(screen.getByRole("button", { name: /ログアウト/ })).toBeInTheDocument();
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
    expect(screen.getByTestId("admin-topbar-actions-island")).toBeInTheDocument();
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
```

## 6.2 既存 spec 確認

実装後、以下が **無修正で pass** することを確認:

- `apps/web/app/(admin)/layout.spec.tsx`
- `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx`
- `apps/web/src/components/auth/__tests__/SignOutButton.spec.tsx`（存在する場合）

万一 fail する場合は、原因を切り分け:
- a) 注入により `aria-hidden` 属性消失で既存 assert が破綻 → 既存 spec を最小修正（属性条件を「actions 注入時は消える、未注入時は `true`」に更新）
- b) それ以外 → 設計レビューに戻る

## 6.3 検証コマンド

```bash
mise exec -- pnpm exec vitest run apps/web/src/features/admin/components/_layout/__tests__/AdminTopbarActions.spec.tsx
```
