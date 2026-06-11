# Phase 8: リファクタリング

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 8 / 13
- 前提: Phase 6（テスト追加）/ Phase 7（カバレッジ）完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004） / visual_category: VISUAL

## 目的

実装した F1（属性追加）/ F2（CSS）に対し、リファクタリングの要否を判定し、変更内容を RT-03 準拠で `対象 / Before / After / 理由` テーブル形式で記録する。本タスクは属性追加 + CSS であり大規模リファクタは発生しない。重複・navigation drift（`data-label` 文字列の重複定義 / ヘッダーテキストと data-label 値の整合）を確認し、FB-UI-02-1（ファイル削除）の非該当を明記する。token 直書き（HEX / 任意値）混入の最終 grep 観点を Phase 9 へ引き継ぐ。

## 実行タスク

### Step 1: リファクタ要否の判定（大規模リファクタなしの記録）

- 本タスクの変更は (a) JSX への属性追加（F1）と (b) `@media` ブロックの CSS 追加（F2）に限定される。
- 新規関数・新規コンポーネント・state / hook の追加はなく（phase-2 Step 1）、抽出 / 分割 / 命名変更などの構造リファクタは発生しない。
- 結論: **大規模リファクタなし**。RT-03 テーブルに「大規模リファクタなし」を明示的に記録する（空振りで素通りしない）。

### Step 2: RT-03 変更記録テーブル（対象 / Before / After / 理由）

実装した変更を以下の形式で記録する。各行は実装後の `git diff` を正本に確定する（spec 段階は予定として記載）。

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| F1 ラッパー `<div>` | `class="ui-card overflow-hidden ..."`（`data-component` なし） | `data-component="admin-members-table"` 付与・`overflow-hidden`→`overflow-x-auto` 系 | カード化 CSS のセレクタ起点を与える / 横はみ出し fallback（I-5 / SSOT §3.2） |
| F1 `<thead>` | 属性なし | `data-role="table-head"` 付与 | カード時に CSS で視覚的に隠す（DOM 残置で a11y role / jsdom テスト保持） |
| F1 データ `<td>`（メール/区画ステータス/タグ/最終更新/公開） | `data-label` なし | `data-label="<項目名>"` 付与 | `::before { content: attr(data-label) }` でカード内ラベル表示（AC-2） |
| F1 ラベルなし `<td>`（チェック/メンバー/操作） | 属性なし | `data-cell="select/member/actions"` 付与 | カード時の flex 配置専用マーカー（ラベル `::before` を出さない） |
| F2 `globals.css` | カード化 `@media` ブロックなし | issue-276 ブロック直後・同一 `@layer` 内に `@media (max-width: 640px)` カード化ブロック追加 | レスポンシブ CSS 欠如の根治（真因 / AC-1） |
| 構造リファクタ | — | **なし** | 属性追加 + CSS のため抽出 / 分割不要（大規模リファクタなしの記録） |

> 機械可読id（`data-testid` / aria-label / `chip-dot` / `member-state-chip-row`）・行 / セルの DOM 順序と個数は After でも不変（I-2 / I-3）。リファクタによる id 改名・順序入れ替えは一切行わない。

### Step 3: 重複・navigation drift の確認

#### 3-1: `data-label` 文字列の重複定義チェック

- `data-label` の値（`メール` / `区画 / ステータス` / `タグ` / `最終更新` / `公開`）が F1 内で重複定義・矛盾定義されていないことを確認する。
- 確認 grep:
  ```bash
  grep -oE 'data-label="[^"]*"' apps/web/src/features/admin/components/_members/MembersTable.tsx | sort | uniq -c
  ```
  → 各 `data-label` 値が**1 回ずつ**（重複なし）であること。同じラベルが複数 `<td>` に付いていないこと。

#### 3-2: ヘッダーテキストと `data-label` 値の整合（navigation drift 防止）

- `<thead>` の各列見出しテキストと、対応する `<td data-label>` の値が意味的に整合していることを確認する（カード時のラベルとデスクトップのヘッダーが食い違わない）。

| 列 | `<thead>` 見出し（既存） | `<td data-label>` 値 | 整合 |
| -- | ----------------------- | -------------------- | ---- |
| メール | メール（既存見出し） | `メール` | 一致 |
| 区画 / ステータス | 区画 / ステータス（既存見出し） | `区画 / ステータス` | 一致 |
| タグ | タグ（既存見出し） | `タグ` | 一致 |
| 最終更新 | 最終更新（既存見出し） | `最終更新` | 一致 |
| 公開 | 公開（既存見出し） | `公開` | 一致 |

- ヘッダー見出しと data-label 値に drift（表記揺れ）があればモバイルとデスクトップでラベルが食い違うため、実装時に `<thead>` の実テキストを確認し data-label を揃える。SSOT §3.2 のマップを正本とする。

### Step 4: FB-UI-02-1（ファイル削除の非該当明記）

- 本タスクは F1〜F3 が編集・F4 が新規であり、**ファイル削除は一切ない**。
- したがって「削除に伴う import 孤児 / dead code 整理 / 削除 PASS 基準」は本タスクでは**非該当**である。リファクタ観点で削除整理を空振り PASS にせず、明示的に「非該当（削除なし）」と記録する。

### Step 5: token 直書き（HEX / 任意値）混入の最終 grep 観点（Phase 9 引き継ぎ）

- リファクタ確認の一環として、F2 追加 CSS に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` / 任意値カラーが混入していないことを最終 grep で確認する。本格的な合否判定（design token gate）は Phase 9 で行うため、本フェーズは**引き継ぎ観点の記録**に留める。
- 引き継ぎ grep（Phase 9 Step 1 / Step 6 と同一の検査）:
  ```bash
  # 追加 CSS 行に HEX / 任意値カラーが混入していないか（空であること）
  git diff dev...HEAD -- apps/web/src/styles/globals.css | grep -E '^\+' | grep -Ei '#[0-9a-f]{3,8}\b|\b(bg|text|border)-\[#'

  # 追加 CSS が参照する var(--ubm-*) 一覧（Phase 9 で実在確認へ引き継ぐ）
  git diff dev...HEAD -- apps/web/src/styles/globals.css | grep -oE 'var\(--ubm-[a-z0-9-]+\)' | sort -u
  ```
- 本フェーズで HEX / 任意値が見つかった場合は実装へ即時差し戻し（トークン経由へ置換）し、Phase 9 へ HEX 混入を残さない。MINOR TECH-M-01（実トークン名の実在確認）の最終判定は Phase 9 で行う。

## 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| SSOT | `outputs/shared-context.md` | 属性追加マップ（§3.2）・data-label 値（§3.2）・不変条件（§4 I-2/I-3/I-4） |
| 設計 | `phase-2-design.md` | 新規コンポーネント / state なし（Step 1）/ 構造不変 |
| 設計レビュー | `phase-3-design-review.md` | MINOR TECH-M-01（実トークン名実在は Phase 9 解決） |
| QA | `phase-9-qa.md` | design token gate（AC-6）/ FB-UI-02-1 / TECH-M-01 解決確認の引き継ぎ先 |

## 実行手順

1. Step 1（リファクタ要否 / 大規模リファクタなし）を判定・記録。
2. Step 2（RT-03 対象 / Before / After / 理由テーブル）を実 diff から確定。
3. Step 3-1（`data-label` 重複なし）/ 3-2（ヘッダーと data-label 整合）を grep / 目視確認。
4. Step 4（FB-UI-02-1 ファイル削除 非該当）を明記。
5. Step 5（HEX / 任意値混入の最終 grep）を実行し Phase 9 へ引き継ぐ。
6. 結果を `outputs/phase-8/refactoring-log.md` に記録。

## 統合テスト連携

- Step 5 の HEX / token grep は Phase 9（QA / CI gate）Step 1 / Step 6 の design token gate（AC-6）/ TECH-M-01 解決確認で最終判定される。
- リファクタなしのため新規テストは増やさない（Phase 6 の TC-MT-21〜24 で十分）。回帰は Phase 9 の targeted vitest で確認する。

## 多角的チェック観点（AIが判断）

- 品質系: 「リファクタなし」を空振りで素通りせず、RT-03 テーブルに明示記録することで判断の透明性を担保する。
- リスク系: 最大の drift リスクは「ヘッダー見出しと data-label 値の表記揺れ」→ Step 3-2 の整合表で抑止。`data-label` 重複は Step 3-1 で機械検出。
- 整合性系: HEX / 任意値混入を Phase 8（記録）→ Phase 9（合否）へ二段で引き継ぎ、token 正本（I-4）逸脱を取りこぼさない。

## サブタスク管理

| ID | 内容 | status（spec段階） |
| -- | ---- | ------------------ |
| R8-1 | リファクタ要否判定（大規模なし記録） | done（方針確定） |
| R8-2 | RT-03 対象/Before/After/理由テーブル | pending（実 diff で確定） |
| R8-3 | data-label 重複なし確認 | pending |
| R8-4 | ヘッダー / data-label 整合確認 | pending |
| R8-5 | FB-UI-02-1 ファイル削除 非該当明記 | done（非該当） |
| R8-6 | HEX / token 最終 grep（Phase 9 引き継ぎ） | pending |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| リファクタリングログ | `outputs/phase-8/refactoring-log.md` |

## 完了条件

- [ ] RT-03 形式（対象 / Before / After / 理由）で変更内容を記録（大規模リファクタなしの行を含む）。
- [ ] `data-label` 文字列の重複定義がないことを grep 確認。
- [ ] `<thead>` 見出しと `data-label` 値の整合（navigation drift なし）を確認。
- [ ] FB-UI-02-1（ファイル削除）を「非該当（削除なし）」と明記。
- [ ] HEX / 任意値カラー混入の最終 grep を実行し、Phase 9（design token gate）へ引き継ぎ。
- [ ] 機械可読id・DOM 順序が After でも不変（I-2 / I-3）であることを確認。

## タスク100%実行確認【必須】

- [x] RT-03 テーブル形式を定義（大規模リファクタなし記録を含む）
- [x] data-label 重複 / ヘッダー整合の確認観点を定義
- [x] FB-UI-02-1 ファイル削除 非該当を明記
- [x] HEX / token 最終 grep 観点を Phase 9 へ引き継ぎ
- [x] 機械可読id / DOM 不変の確認を明記

## 次Phase

[phase-9-qa.md](phase-9-qa.md) — QA / CI gate（design token / vitest / typecheck / lint / API 非接触）。
