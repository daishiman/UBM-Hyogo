# Phase 6: テスト拡充（fail path / 回帰 guard）

**[実装区分: 実装仕様書]**

## 実行タスク

1. collapsed ↔ expanded 切替で icon-box 高さクラスが正しく切り替わることを 1 テスト内で検証する。
2. 両対象ファイル（`SidebarNavItem.tsx` / `SidebarShell.tsx`）の collapsed icon-box に `h-10 w-10` が残っていないことを grep guard で回帰条件化する。

## 参照資料

- Phase 4（基本テストケース TC-1〜TC-4）
- Phase 5（変更ファイル一覧・確定値）

## 1. 追加テスト（切替回帰）

| ID | ケース名 | 検証内容 |
|----|---------|---------|
| TC-5 | collapsed↔expanded で icon-box 高さが切り替わる | 同一 item を `collapsed={true}` で render → icon-box が `h-[18px]` を含み `h-10` を含まない。再 render（cleanup 後）`collapsed={false}` → `h-[18px] w-[18px]` を含む。両状態で高さは `h-[18px]` 系に収束し、`h-10` がどちらにも出ないことを assert |
| TC-6 | 公開サイトに戻るリンクの icon-box 統一（任意） | `SidebarShell` 描画 or `SidebarShell.spec` 既存があれば collapsed 時に `data-component="admin-sidebar-public-return"` 配下 icon span が `h-10` を含まないことを確認。spec 不在なら下記 grep guard で代替 |

> TC-6 は SidebarShell 単体 spec が無い場合、テスト追加コストを避け **grep guard（§2）を一次回帰条件**とする（EMB-005-FB: 最小実装）。

## 2. grep guard（回帰条件 = 必須）

実装後、以下が **0 件**であることを確認する。

```bash
grep -rn "h-10 w-10" \
  apps/web/src/components/shell/SidebarNavItem.tsx \
  apps/web/src/components/shell/SidebarShell.tsx
```

- 期待結果: マッチ 0 件（exit 1）。
- 対象は上記 2 ファイルに限定する。OOS の Brand ロゴ / Avatar が別ファイルで `h-10 w-10` を持っていても本タスク対象外（grep パスに含めない）。

## 3. fail path 観点

- icon-box の高さクラスは collapsed/expanded の二値分岐のみ。中間状態・null prop は型（`collapsed: boolean`）で排除済み → 異常系テストは不要。
- 既存テスト（external anchor / active / sr-only label / badge dot）は icon-box 高さに非依存のため、本変更で fail しないことを `vitest run` 全 PASS で担保する（AC-7）。
