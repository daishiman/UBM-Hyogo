# Phase 6: テスト追加実装

**[実装区分: 実装仕様書]**

## 編集対象

`apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx`

## 編集手順

1. 既存 spec を `Read` で全文確認し、以下を grep:
   - `"ホーム"` → 該当 assertion を削除または「公開サイトに戻る」へリラベル
   - `href="/"` を期待しているケース → `data-role="public-return"` を伴う anchor 限定 assertion に置換
2. Phase 4 の T1〜T11 を追加 `it()` ブロックとして実装

## 実装スニペット（追加コード雛形）

```tsx
import { render } from "@testing-library/react";
import { AdminSidebar } from "../AdminSidebar";

const baseProps = {
  schemaDiffCount: 3,
  userDisplayName: "テスト管理者",
  userEmail: "admin@example.com",
};

describe("AdminSidebar - 公開サイトに戻る (public-return)", () => {
  it("T1: data-role=public-return anchor が 1 つ存在する", () => {
    const { container } = render(<AdminSidebar {...baseProps} />);
    const anchors = container.querySelectorAll('a[data-role="public-return"]');
    expect(anchors).toHaveLength(1);
  });

  it("T2-T4: href / aria-label / 表示テキストが正しい", () => {
    const { container, getByText } = render(<AdminSidebar {...baseProps} />);
    const anchor = container.querySelector('a[data-role="public-return"]')!;
    expect(anchor.getAttribute("href")).toBe("/");
    expect(anchor.getAttribute("aria-label")).toBe("公開サイトに戻る");
    expect(getByText("公開サイトに戻る")).toBeInTheDocument();
  });

  it("T5: 既存 admin nav 9 項目が描画される", () => {
    const { getByText } = render(<AdminSidebar {...baseProps} />);
    for (const label of [
      "ダッシュボード",
      "出席分析",
      "会員管理",
      "タグキュー",
      "スキーマ",
      "開催日",
      "依頼キュー",
      "Identity重複",
      "監査ログ",
    ]) {
      expect(getByText(label)).toBeInTheDocument();
    }
  });

  it("T6: 公開・会員ナビが引き続き描画される", () => {
    const { getByText } = render(<AdminSidebar {...baseProps} />);
    expect(getByText("会員ディレクトリ")).toBeInTheDocument();
    expect(getByText("登録")).toBeInTheDocument();
    expect(getByText("マイページ")).toBeInTheDocument();
  });

  it("T7-T9: SignOutButton と user props が反映される", () => {
    const { getByTestId, getByText } = render(<AdminSidebar {...baseProps} />);
    expect(getByTestId("sign-out-button")).toBeInTheDocument();
    expect(getByText("テスト管理者")).toBeInTheDocument();
    expect(getByText("admin@example.com")).toBeInTheDocument();
  });

  it("T10: 旧「ホーム」ラベルは描画されない", () => {
    const { queryByText } = render(<AdminSidebar {...baseProps} />);
    expect(queryByText("ホーム")).toBeNull();
  });

  it("T11: public-return anchor が footer の直前に配置される", () => {
    const { container } = render(<AdminSidebar {...baseProps} />);
    const anchor = container.querySelector('a[data-role="public-return"]')!;
    const footer = container.querySelector('[data-component="admin-sidebar-footer"]')!;
    expect(anchor.nextElementSibling).toBe(footer);
  });
});
```

## 関連 spec の regression 確認

- `AdminSidebar.component.spec.tsx` を Read し、「ホーム」「Public」セクション数等の assertion があれば同 wave で更新
- `AdminSidebarNavItem.spec.tsx` は今回触らない。公開復帰リンクは `AdminSidebar` 直書き anchor として検証する。

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/AdminSidebar.spec.tsx \
  src/components/layout/__tests__/AdminSidebar.component.spec.tsx
```

## DoD（Phase 6 単独）

- [ ] T1〜T11 が `it()` ブロックとして実装され、`describe` でグルーピング
- [ ] `*.test.*` への新規追加 0 件（`*.spec.tsx` のみ）
- [ ] vitest 上記 2 spec が green
- [ ] `test.skip` / `it.skip` / `test.todo` の追加 0 件
