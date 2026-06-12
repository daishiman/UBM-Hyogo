# Phase 8: リファクタリング

**[実装区分: 実装仕様書]**

## 0. メタ

| key | value |
|-----|-------|
| workflow_id | admin-sidebar-collapsed-icon-spacing-parity |
| phase | 8（リファクタリング） |
| scale | small（className 高さ値の変更のみ） |
| 影響層 | `apps/web` 表現層のみ。`apps/api` / D1 / Google Form 非接触 |
| navigation drift | なし（route 追加・変更・削除ゼロ） |

## 実行タスク

1. nav アイコンコンテナの折りたたみ時高さを 40px(`h-10`) から 18px(`h-[18px]`) へ縮小し、展開時の行ピッチに一致させる。
2. 「公開サイトに戻る」フッターリンクのアイコンコンテナにも同一補正を適用し縦リズムを統一する。
3. 同パターン（collapsed `h-10 w-10`）の重複を棚卸しし、本タスクで触る2箇所と OOS の2箇所を区別して記録する。

## 参照資料

- `outputs/phase-1/phase-1.md`（受入条件 AC-1〜AC-7・対象ファイル inventory）
- `apps/web/src/components/shell/SidebarNavItem.tsx`（真因コンテナ L35）
- `apps/web/src/components/shell/SidebarShell.tsx`（公開サイトに戻る L36）
- `docs/00-getting-started-manual/specs/design-tokens.md`（HEX 直書き禁止・色非接触の確認）

## 1. 変更内容（Feedback RT-03: 対象/Before/After/理由 テーブル）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `SidebarNavItem.tsx:35` collapsed アイコンコンテナ | `h-10 w-10`（高さ40px） | `h-[18px] w-10` | `ShellIcon` グリフは固定18×18px。`h-10` は上下11pxずつの余白を生み、collapsed 行ピッチを ≈56px に膨らませる。高さを 18px に揃えると展開時 ≈36px と一致する。`w-10` は水平クリック面/中央寄せのため維持 |
| `SidebarShell.tsx:36` 「公開サイトに戻る」アイコンコンテナ | `h-10 w-10`（高さ40px） | `h-[18px] w-10` | nav 項目と同一のアイコン箱パターン。フッターリンクだけ縦リズムが残ると AC-5 を満たさないため同時補正 |

> 変更は**高さ class の値のみ**。`w-10`・`justify-center`・`gap-0.5`・`aria-*`・`data-*` は不変。色・余白 token・トグル挙動には一切触れない。

## 2. duplicate 棚卸し（collapsed `h-10 w-10` パターン）

同一パターンは shell コンポーネント群に **4箇所** 存在する:

| # | 箇所 | 本タスクの扱い | 区分 |
|---|------|----------------|------|
| 1 | `SidebarNavItem.tsx:35` | **修正** | nav 行ピッチの真因 |
| 2 | `SidebarShell.tsx:36`（公開サイトに戻る） | **修正** | nav と同列の縦リズム |
| 3 | `SidebarBrand.tsx:20`（ブランド "U" ロゴ箱） | 変更しない | OOS-1 |
| 4 | `SidebarUserMenu.tsx:56`（アバター箱） | 変更しない | OOS-2 |

### 将来統一のリファクタ候補（本タスクでは触らない）

4箇所の `h-10 w-10` を共通プリミティブ（例: `SidebarIconBox`）へ抽出する余地はあるが、本タスクでは実施しない。理由:

- **別関心**: #3 ブランドロゴ箱・#4 アバター箱は nav 行ではなく border 区切りで分離された独立プリミティブであり、nav の行間隔に寄与しない。
- **視覚意図が異なる**: ブランド "U" ロゴとアバターは「40px の見せる箱」を**意図して**持つ要素であり、18px へ縮小すると視覚デザインが変わる。本タスクの「nav アイコン縦間隔を展開時に揃える」目的とは別の判断を要する。
- よって #3/#4 は本タスクの先送りではなく**スコープ対象外（OOS）**。共通化は将来の独立リファクタとして候補記載に留める。

## 3. navigation / 構造ドリフト確認

- route の追加・変更・削除なし。`SidebarNavItem` が受け取る nav 定義・リンク先は不変。
- DOM 構造（要素の入れ子・`data-shell-block` / `sr-only` ラベル / tooltip）不変。className 値のみ差し替え。
- 新規 import / 新規型 / 新規 API なし。
