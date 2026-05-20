# Phase 4: テスト計画

## 1. テスト方針

- フレームワーク: Vitest + `@testing-library/react`（`apps/web` の既存 setup を利用）
- 対象: `apps/web/app/profile/loading.tsx`
- 配置: `apps/web/app/profile/loading.spec.tsx`（`.spec.tsx` 命名強制 / 不変条件 #8）
- 範囲: render 結果の a11y 属性・補助テキスト・data 属性のみ。pulse animation の visual 検証は手動（Phase 11）。

## 2. テストケース (TC)

| ID | 観点 | 期待値 |
|---|---|---|
| TC-1 | root `role="status"` | `screen.getByRole("status")` が取得できる |
| TC-2 | `aria-busy` | `"true"` |
| TC-3 | `aria-live` | `"polite"` |
| TC-4 | sr-only テキスト | 「マイページを読み込み中」が DOM に存在 |
| TC-5 | `data-page` | root に `data-page="profile-loading"` が付与されている |
| TC-6 | skeleton block 個数 | `bg-surface-2` を持つ要素が 6 個（avatar 1 + heading 1 + KV 4） |

## 3. テスト本体（snippet）

```tsx
// apps/web/app/profile/loading.spec.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfileLoading from "./loading";

describe("ProfileLoading", () => {
  it("renders an accessible loading status", () => {
    render(<ProfileLoading />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("data-page", "profile-loading");
  });

  it("announces the profile loading state to screen readers", () => {
    render(<ProfileLoading />);
    expect(screen.getByText("マイページを読み込み中")).toBeInTheDocument();
  });

  it("renders the avatar, heading, and four key-value skeleton blocks", () => {
    const { container } = render(<ProfileLoading />);
    const blocks = container.querySelectorAll(".bg-surface-2");
    expect(blocks).toHaveLength(6);
    expect(container.querySelectorAll(".motion-safe\\:animate-pulse")).toHaveLength(
      6,
    );
  });
});
```

> `toHaveAttribute` / `toBeInTheDocument` は `@testing-library/jest-dom` matchers。`apps/web/vitest.setup.ts` で `import "@testing-library/jest-dom/vitest";` 済みであることを Phase 5 §0 で確認する。

## 4. テスト実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- app/profile/loading.spec.tsx
```

3 focused tests で TC-1〜TC-6 をすべてカバーすることが DoD 条件。

## 5. 既存テストへの影響

- `apps/web/app/profile/page.tsx` 用のテストが存在しても本タスクでは触らない。
- `pnpm --filter @ubm-hyogo/web test` 全体実行で profile 配下が壊れていないことを Phase 7 で確認する。
