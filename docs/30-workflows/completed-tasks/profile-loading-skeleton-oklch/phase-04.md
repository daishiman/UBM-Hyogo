# Phase 4: テスト設計

## テストファイル

`apps/web/app/profile/loading.spec.tsx` (新規)

## ケース一覧

| ID | ケース | 検証内容 |
|----|--------|----------|
| TC-01 | role=status と aria-busy を持つ | `getByRole("status")` / `aria-busy="true"` / `aria-live="polite"` |
| TC-02 | sr-only テキストが存在 | `getByText("マイページを読み込み中")` |
| TC-03 | avatar skeleton 要素を持つ | `rounded-full` を含む要素が 1 件以上 |
| TC-04 | KV pair skeleton 4 行を持つ | `bg-surface-2` を含む `h-6` 要素が 4 件以上 |

## テストコード骨格

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfileLoading from "./loading";

describe("ProfileLoading", () => {
  it("TC-01: role=status と aria-busy を持つ", () => {
    render(<ProfileLoading />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("TC-02: sr-only テキストが存在", () => {
    render(<ProfileLoading />);
    expect(screen.getByText("マイページを読み込み中")).toBeInTheDocument();
  });

  it("TC-03: avatar skeleton 要素を持つ", () => {
    const { container } = render(<ProfileLoading />);
    expect(container.querySelectorAll(".rounded-full").length).toBeGreaterThanOrEqual(1);
  });

  it("TC-04: KV pair skeleton 4 行を持つ", () => {
    const { container } = render(<ProfileLoading />);
    const rows = container.querySelectorAll(".h-6.bg-surface-2");
    expect(rows.length).toBeGreaterThanOrEqual(4);
  });
});
```

## カバレッジ目標

- `apps/web/app/profile/loading.tsx` の全 JSX branch を render 1 回でカバー
- 条件分岐なしのため、line coverage 100% を期待
- 元 unassigned-task の最小 AC は role/aria と sr-only の 2 ケースだが、本 workflow では skeleton 形状 drift を防ぐため TC-03/TC-04 を追加し 4 ケースへ拡張する。

## E2E

本タスクは visualEvidence=VISUAL のため、Phase 11 で Playwright screenshot を取得する。E2E full regression は対象外で、dev-only visual harness による component screenshot を証跡にする。
streaming 動作確認は手動ローカル `pnpm -F @ubm-hyogo/web dev` で `/profile` 遷移時の placeholder 表示を確認する。

## 完了条件

- [ ] TC-01〜TC-04 のコード骨格確定
- [ ] vitest 環境（jsdom）で動作可能であることを確認
