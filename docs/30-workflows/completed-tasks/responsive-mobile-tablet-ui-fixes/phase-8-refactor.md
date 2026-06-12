# Phase 8: リファクタ — メディアクエリ境界の集約・重複削減

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- 前提: [phase-5-implementation.md](phase-5-implementation.md)（CSS 差分）/ [phase-7-coverage.md](phase-7-coverage.md)/ [shared-context.md](shared-context.md)
- 注記: 本 Phase は重複削減の設計（仕様）。リファクタの実行は後続実装の責務。挙動・visual は不変を原則とする。

## 目的

RC-1 是正で標準境界（768/1024/1280）へ寄せた結果生じる「同一境界の重複メディアクエリ」を集約し、混在境界（767/720/900/768）の散在を解消する。挙動を変えずに保守性のみ改善する。

## 実行タスク

1. 境界統一後の重複メディアクエリを特定する。
2. `対象 / Before / After / 理由` テーブルで集約方針を確定する。
3. リファクタが visual baseline を破壊しないことの確認方針を示す。

## リファクタ対象（Before / After / 理由）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| globals.css mobile 表示切替群 | `@media (max-width: 767px)`（:759）・`@media (max-width: 768px)`（:1730 等）・`@media (max-width: 720px)`（:2345）が混在 | `@media (max-width: 767.98px)` に統一し、同境界のルールは隣接配置で 1 ブロックへ集約 | 境界値の散在を排除（RC-1）。同一意図「`md` 未満で隠す/縦積み」を 1 境界に集約し読解性向上 |
| グリッド単/多カラム切替群 | `@media (max-width: 900px)`（:1376）・`@media (max-width: 768px)`（タブレット詰まり）が個別境界 | `@media (max-width: 1023.98px)`（単カラム）+ `@media (min-width: 1024px)`（多カラム復元）の mobile-first ペアへ統一 | 非標準 900 を排除し `lg` 未満単カラムへ集約（RC-1/RC-2）。grid 系を同一パターン化 |
| breakpoint px 直書きの規約化 | 各所に 768/1024 を直接記述・根拠コメントなし | `tokens.css` の `--bp-md/lg/xl` をドキュメントアンカーとし、media query 冒頭に `/* md / lg / xl */` の意図コメントを付す | px 直書きは CSS の制約上不可避だが、根拠を 1 箇所（tokens.css）に集約し参照規約を固定 |
| テーブル可視性クラスの命名統一 | per-table に散発的な overflow ルール | `.admin-table-scroll`（共通ラッパ）+ `.admin-table--cards`（カード化 modifier）に集約 | 重複する `overflow-x:auto` を共通クラス化（DRY）。per-table 差分は modifier のみ |

## やらないこと（スコープ外・挙動変更回避）

- 色・spacing トークンの再設計（不変条件 #2）。
- クラス名の大規模リネーム（既存 testid/query 互換のため最小限に留める）。
- 新規 primitive 追加（不変条件 #3）。
- 768/1024 の境界値自体の変更（統一は意図変更でなく散在解消のみ）。

## リファクタ非破壊の確認方針

1. リファクタ前後で Playwright visual baseline（mobile/tablet/desktop）に差分が出ないこと（同一スナップショット）。
2. `pnpm verify:tokens` PASS（HEX 混入なし）。
3. 構造 spec（SidebarDrawer.spec.tsx）Green 維持。
4. 集約は「境界値の文字列統一」「隣接ブロックの結合」に限定し、セレクタ・プロパティ値は変えない。

## 参照資料

### システム仕様（aiworkflow-requirements）

- `architecture-*.md`（DRY・CSS 構造）, `ui-ux-*.md`（breakpoint 規約）。
- プロジェクト: `apps/web/src/styles/{globals,tokens}.css`。

## 成果物

- 本ファイル（リファクタ）。`対象/Before/After/理由` テーブル・スコープ外・非破壊確認方針。

## 統合テスト連携

- 上流: Phase 5 の境界統一・テーブル共通クラス化。
- 下流: Phase 9 QA が visual 非破壊と lint/tokens を最終確認。

## 完了条件

重複メディアクエリ集約・命名統一が `対象/Before/After/理由` で定義され、挙動・visual 不変の確認方針が示されていること。
