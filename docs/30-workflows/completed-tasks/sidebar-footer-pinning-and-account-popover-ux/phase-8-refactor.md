# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 8 / 13 |
| 名称 | リファクタリング |
| 前提 | Phase 4-7 完了（テスト計画 / 実装手順 / テスト追加 / カバレッジ）|
| spec_classification | implementation_spec |
| visual_category | VISUAL |
| implementation_mode | new |
| 状態 | implemented_local_evidence_captured（各 Before/After は確定済み。設計上の方針は確定済み）|

## 目的

Phase 5 実装で生じる構造変更（aside 2 段化 / `<main>` flex-column 化 / collapsed `justify-center` の出し分け）に伴う **duplicate と navigation drift を最小限のリファクタで削る**。挙動は不変（CSS / DOM 観測契約 / public props / hook 戻り値を変えない）。MINOR を超える設計変更は行わず、増やすべきでない重複は未タスク化候補として記録する（[unassigned ルール]）。

> 本タスクの「リファクタ」は新規ロジック抽出ではなく、**既存重複の整合**と**collapse 出し分けロジックの分散の記録**に絞る。汎用 hook 抽出（TECH-M-02）は本サイクル scope 外。

## 実行タスク

### Task 8-1: globals.css `[data-shell="sidebar"]` 重複ブロックの整合（[Feedback RT-03] テーブル）

`grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css` で確認した通り、`[data-shell="sidebar"]` の定義は **行 1417 付近 / 行 1547 付近の 2 ブロックに重複**して存在する（加えて 行 2010 付近に `[data-route-group="admin"] [data-shell="sidebar"]` のスコープ付き派生があるが、これは別 selector のため統合対象外）。C1 で `height: 100dvh` + `overflow: hidden` を追加する際、**2 ブロック双方を同一値へ整合**させ、片方だけ更新する drift を防ぐ。

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `globals.css` 行 1417 付近 `[data-shell="sidebar"]` | `min-height: 100vh;`（`overflow` 宣言なし）| `height: 100vh;` + `height: 100dvh;` + `overflow: hidden;`（確定）| C1: 下限のみ高さ→固定高さ + 内部スクロール委譲。fallback 併記で `100dvh` 非対応ブラウザ対応（TECH-M-03）|
| `globals.css` 行 1547 付近 `[data-shell="sidebar"]`（重複ブロック）| `min-height: 100vh;`（同上）| 行 1417 と**同一値**へ整合（確定）| 重複ブロックの片側更新による drift 防止。両ブロックが同じ高さ/overflow 規則を持つことを保証 |

> **重複ブロックの統合そのものは別タスク候補**: `[data-shell="sidebar"]` が 2 箇所に定義されている構造的重複（おそらく responsive/theme 分岐の歴史的経緯）は、本タスクでは「両方を同一値に整合」までに留める。1 ブロックへの統合（DRY 化）は scope を超えるため **Phase 12 で未タスク化候補**として引き継ぐ（[unassigned ルール]）。本タスクで両ブロックを統合すると、意図しない responsive/theme 文脈の挙動変化リスクがある。

### Task 8-2: collapse `justify-center` 出し分けの分散を「共通方針」として記録

collapsed 時の中央寄せ（`justify-center`）は本タスクで **3 コンポーネントに分散**して適用される（`SidebarNavItem` の行 / `SidebarUserMenu` の summary / `SidebarShell` 内 `AdminPublicReturn` の Link、加えて collapse-toggle 行）。各コンポーネントが独自に `collapsed ? "justify-center" : ""` を持つ形になる。

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `SidebarNavItem.tsx` 行クラス | `flex items-center gap-3 ... px-3 py-2`（左寄せ固定）| 上記 + `${collapsed ? "justify-center" : ""}`（確定）| C2: collapsed でアイコン中央寄せ・はみ出し抑止 |
| `SidebarUserMenu.tsx` summary クラス | `flex ... items-center gap-2 ... px-3 py-2`（左寄せ固定）| 上記 + `${collapsed ? "justify-center" : ""}`（確定）| C2: collapsed でアバター中央寄せ |
| `SidebarShell.tsx` `AdminPublicReturn` Link クラス | `flex items-center gap-3 ... px-3 py-2`（左寄せ固定）| 上記 + `${collapsed ? "justify-center" : ""}`（確定）| C2: collapsed で home アイコン中央寄せ |

> **共通方針の記録**: collapsed 出し分けロジックが 3 コンポーネントに散る点は、現状では各 component が `collapsed` prop を external に受け取る単一供給源（[VSCPKR-03] / Phase 2 props テーブル）で統一されているため、**ロジックの正本は分散していても供給源は 1 系**。共通ユーティリティ（例: `collapsedRowClass(collapsed)`）への抽出は本タスク scope 外（重複が 3 箇所・各 1 行で過剰抽象化リスクが上回る）。再利用需要が増えた場合に抽出を検討する旨を記録する（DRY rule of three 未到達と判断）。

### Task 8-3: collapse-toggle 行の footer 移設に伴う navigation drift 除去

Phase 5 で C1 のフッター固定領域（`data-shell-block="sidebar-footer"`）を新設する際、従来 aside 末尾の `<div className="mt-auto flex justify-end pt-2"><SidebarCollapseToggle /></div>`（`SidebarShell.tsx` 行 98-100）を footer ブロック内へ移設する。`mt-auto` は footer ブロックが nav の `flex-1` で押し下げられるため不要になる。

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `SidebarShell.tsx` collapse-toggle wrapper | `<div className="mt-auto flex justify-end pt-2">`（aside 直下・`sidebarContent` 外）| `data-shell-block="sidebar-footer"` ブロック内へ移設し `mt-auto` 撤去（確定）| C1: footer 領域に下部 3 要素を集約。`mt-auto` の二重発火（nav flex-1 と競合）を除去 = navigation drift 解消。expanded は `justify-end` / collapsed は `justify-center` |

### Task 8-4: リファクタ後の挙動不変確認

- 上記 8-1〜8-3 はいずれも **DOM 観測契約属性を削除しない**（I-7）。`data-shell-block="sidebar-footer"` / `nav-badge-dot` は additive。
- public props（`SidebarShellProps`）/ hook 戻り値（`useSidebarState`）は不変（I-1）。
- リファクタ完了後、Phase 9 の targeted vitest で回帰ゼロを確認する。

## 参照資料

- Phase 2 設計（C1-C4 Before/After 構造）/ Phase 3 レビュー（MINOR 追跡）
- `apps/web/src/styles/globals.css`（`[data-shell="sidebar"]` 行 1417 / 1547）
- `apps/web/src/components/shell/SidebarShell.tsx`（行 98-100 collapse-toggle / 行 74-81 sidebarContent）
- `apps/web/src/components/shell/SidebarNavItem.tsx` / `SidebarUserMenu.tsx`
- task-specification-creator: 実行フロー Phase 8（[Feedback RT-03] テーブル形式）

## 実行手順

1. `grep -n 'data-shell="sidebar"' apps/web/src/styles/globals.css` で重複ブロック行番号を再確認する。
2. Task 8-1: 2 ブロック双方の `min-height:100vh` → `height:100vh`+`height:100dvh`+`overflow:hidden` を同一値で適用する（実装は Phase 5、本 Phase は整合確認）。
3. Task 8-3: collapse-toggle を footer ブロックへ移設し `mt-auto` を撤去する。
4. Task 8-2: 3 コンポーネントの collapsed 出し分けが external prop 単一供給源に従うことを確認し、共通抽出は未到達として記録する。
5. リファクタ後に targeted vitest を実行し挙動不変を確認する（Phase 9 へ証跡を渡す）。

## 統合テスト連携

- リファクタ後も `SidebarShell.spec`（nav-item 3/4/14）・`(public)/layout.spec` P-5 が回帰なくパスすること（Phase 9 で実証）。
- collapse-toggle 移設後も `data-shell-block="sidebar-footer"` 内に collapse-toggle / user-menu / public-return が存在する DOM 契約を Phase 6 追加テストで保護。

## 多角的チェック観点（AIが判断）

- **システム系（責務境界）**: 高さ固定は CSS、collapse 出し分けは component の prop 駆動、state 所有は `useSidebarState`。リファクタで境界を混在させない。
- **問題解決系（DRY 判断）**: `justify-center` 3 箇所重複は rule of three 境界。過剰抽象化を避け、抽出は需要顕在化まで保留（未タスク候補ではなく「現状維持が最適」と判断）。globals.css 重複ブロックの統合のみ未タスク化候補とする。
- **戦略・価値系**: リファクタコストを最小化し、drift 防止（2 ブロック整合 + mt-auto 除去）という確実な価値に絞る。

## サブタスク管理

| ID | 内容 | 対象 | 種別 |
|----|------|------|------|
| 8-1 | globals.css 重複 2 ブロック整合 | globals.css | drift 防止 |
| 8-2 | collapse 出し分け分散の方針記録 | NavItem/UserMenu/Shell | 記録のみ（抽出せず）|
| 8-3 | collapse-toggle footer 移設 + mt-auto 除去 | SidebarShell.tsx | navigation drift 除去 |
| 8-4 | 挙動不変確認 | 全変更ファイル | 回帰ガード |

## 成果物

- `outputs/phase-8/refactor.md`（本 Phase を正本とする Before/After テーブルサマリ。実装済みとして After 列を確定値で埋める）
- 未タスク化候補: globals.css `[data-shell="sidebar"]` 2 ブロックの 1 本化（Phase 12 引き継ぎ）

## 完了条件

- [ ] Task 8-1: globals.css 2 ブロックを同一値で整合した（確定）
- [ ] Task 8-2: collapse 出し分けの分散を共通方針として記録し、抽出非実施の判断を残した
- [ ] Task 8-3: collapse-toggle を footer ブロックへ移設し `mt-auto` を除去した（確定）
- [ ] Task 8-4: DOM 観測契約・public props・hook 戻り値の不変を確認した
- [ ] 未タスク化候補（globals.css 重複統合）を Phase 12 へ引き継ぐ旨を記録した
- [x] Before/After を `対象/Before/After/理由` テーブル形式で記録した（[Feedback RT-03]）

## タスク100%実行確認【必須】

- [x] 全実行タスク（8-1〜8-4）を仕様として記述した
- [x] 必須成果物（Before/After テーブル）を本ファイルに記載した
- [x] Phase 9 開始条件（リファクタ方針確定）を満たす設計を記述した

## 次Phase

[Phase 9: QA / CI gate](phase-9-qa.md)
