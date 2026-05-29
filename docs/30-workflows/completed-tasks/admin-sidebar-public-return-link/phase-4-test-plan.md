# Phase 4: テスト計画

**[実装区分: 実装仕様書]**

## テスト対象ファイル

| Path | 種別 |
|------|------|
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | 既存編集 |

> 観測: `AdminSidebar.spec.tsx` と `AdminSidebar.component.spec.tsx` の 2 spec が既存（`apps/web/src/components/layout/__tests__/`）。`AdminSidebar.spec.tsx` を主編集対象とし、`AdminSidebar.component.spec.tsx` には regression 影響がないか Phase 6 で確認する。

## 追加 / 更新するテストケース

| # | ケース | 期待 |
|---|--------|------|
| T1 | `data-role="public-return"` を持つ anchor が **1 つだけ** 存在 | `getAllByTestId` 相当または `container.querySelectorAll('[data-role="public-return"]').length === 1` |
| T2 | T1 anchor の `href === "/"` | `getAttribute("href") === "/"` |
| T3 | T1 anchor の `aria-label === "公開サイトに戻る"` | `getAttribute("aria-label") === "公開サイトに戻る"` |
| T4 | T1 anchor の表示テキストに「公開サイトに戻る」を含む | `textContent` 部分一致 |
| T5 | 既存 admin nav 全 9 件のラベルが描画される（ダッシュボード / 出席分析 / 会員管理 / タグキュー / スキーマ / 開催日 / 依頼キュー / Identity重複 / 監査ログ） | `getByText` で 9 件存在 |
| T6 | 「会員ディレクトリ」「登録」「マイページ」が引き続き描画される | `getByText` 3 件 |
| T7 | `data-testid="sign-out-button"` が存在し描画される | `getByTestId` で取得可能 |
| T8 | `userDisplayName` props が描画される | `getByText(userDisplayName)` |
| T9 | `userEmail` props が描画される（または `userDisplayName` フォールバックロジック） | `getByText(userEmail)` |
| T10 | 旧「ホーム」ラベル (`label: "ホーム"`) が描画 **されない** | `queryByText("ホーム") === null` |
| T11 | `data-role="public-return"` anchor が footer（`data-component="admin-sidebar-footer"`）の **直前** に出現 | `link.nextElementSibling === footer` |

## テストデータ

```ts
const baseProps = {
  schemaDiffCount: 3,
  userDisplayName: "テスト管理者",
  userEmail: "admin@example.com",
} satisfies AdminSidebarProps;
```

## 1 行実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/AdminSidebar.spec.tsx
```

## un-skip 不変条件

- `test.skip` / `it.skip` / `test.todo` 使用禁止（既存も含め新規追加しない）
- T1〜T11 全件 active

## 完了条件

- T1〜T11 のケースが Phase 6 でそのままコード化できる粒度
- 既存 spec の grep で「ホーム」「Home」assertion を確認し、削除候補を Phase 6 に列挙
