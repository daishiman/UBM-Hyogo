# Phase 11: 手動テスト / スクリーンショット計画

## 目的

本タスクは VISUAL（視覚証跡を伴う）かつ現状 `implemented_local_evidence_captured` である。
よって本 Phase は **local visual PNG + staging screenshot 計画 + 3 層評価（Semantic / Visual / AI UX）の手順書**として記述する。
local PNG は本サイクルで取得済み。staging 実 PNG は deploy 後に user-gated で撮影する。

- 入力: Phase 1（AC-1..AC-9）、Phase 2（設計）、Phase 4-10（テスト計画〜最終レビュー）。
- 出力: 本ファイル（screenshot 計画 + 視覚検証手順）、`outputs/phase-11/manual-test-result.md`、`screenshot-plan.json`、`phase11-capture-metadata.json`。

## [Feedback BEFORE-QUIT-001] staging 実地操作が未実施の理由

- 本サイクルで Lane A/B のコード実装、focused vitest、local visual PNG は完了済み。
- staging capture は次の前提が揃って初めて可能になる:
  1. 本差分が user 承認後に commit / push / deploy される。
  2. staging（`https://ubm-hyogo-web-staging.daishimanju.workers.dev/`）へ deploy 済み（commit / push / deploy は user-gated）。
  3. staging に curated タグ + businessOverview を持つメンバー seed が存在。
- したがって capture metadata は local PNG を `captured` に記録し、staging PNG 候補を user-gated queue として `planned` に残す。

## 3 層評価の手順

### 層 1: Semantic（DOM / markup 意味検証）

実装後の DOM が Phase 2 設計どおりかを検証する。

- `MemberCard`（comfy/dense）に `p[data-role="biz-summary"]`（businessSummary がある時のみ）と `ul[data-role="tag-row"] > li[data-role="tag-chip"]` が存在する（AC-4 / AC-5）。
- 事業フェーズ chip は `li[data-role="tag-chip"][data-phase="true"]` で出力され、`data-tone` が `phaseTone(code)` の戻り値（cool/warm/amber）と一致する（AC-4）。
- `region` / `role` / `status` カテゴリのタグが `tag-row` に**出ていない**こと（AC-2 / AC-6）。
- list density のカードは phase chip のみ（最大 1 件）で、business summary 行が出ていないこと（AC-4）。
- TagPicker の topTags chip の表示文字列が正規化後（`0→1` 等）であること（AC-7）。

### 層 2: Visual（screenshot 比較）

下記 canonical screenshot を local component harness で撮影済み。staging では同名または `staging-` prefix の PNG を追加撮影し、プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`）の意図に整合するかを目視確認する。
HEX 直書きが無いこと（OKLch トークン経由）は `verify:tokens` gate で機械検証済み前提（AC-8）。

### 層 3: AI UX（ユーザー報告の解消確認）

- 「カードを見ても何をやっているか分からない」→ 事業フェーズ + 業種/スキル + 事業概要 1 行で一目把握できるか（AC-4 / AC-5 / AC-6）。
- 「0 to 1 と表示される」→ 全箇所で `0→1`（矢印）表記か（AC-1 / AC-7）。
- 「阪神」「神戸」「西宮」「姫路」のような地域タグはカードから消えているか（AC-2 / AC-6）。
- 情報過多になっていないか（density 別の件数制限・120 字 cap が効いているか）。

## screenshot 計画（local captured + staging user-gated・semantic 命名 `<component>-<state>.png`）

| canonical 名 | 撮影状態 | 検証 AC | 対応 TC（Phase 4） |
| --- | --- | --- | --- |
| `member-card-home-comfy-with-tags.png` | local component harness・comfy 密度・curated タグ + 業種概要表示 | AC-4 / AC-5 / AC-6 | TC-MC-COMFY |
| `member-card-tag-phase-emphasis.png` | 事業フェーズ chip 強調・地域タグ非表示の状態 | AC-1 / AC-2 / AC-4 | TC-MC-PHASE |
| `member-card-dense.png` | dense 密度（タグ最大 2 件 + summary） | AC-4 / AC-5 | TC-MC-DENSE |
| `member-card-list.png` | list 密度（phase chip のみ・summary 非表示） | AC-4 | TC-MC-LIST |
| `tag-picker-arrow-normalized.png` | TagPicker topTags が `0→1` 表記 | AC-1 / AC-7 | TC-TP-NORM |

> local PNG は `outputs/phase-11/screenshots/` に semantic 命名で保存済み。staging capture は staging deploy 後・user-gated。

## 完了条件（Phase 11）

- [x] 本計画書と metadata/plan/coverage ファイルが揃い、capture metadata の `status` が `local_captured_staging_pending` で local PNG 1 件以上を記録する。
- [x] staging screenshot は deploy 後・user-gated で追加取得する境界を明記する。

## Canonical Compliance Addendum

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_evidence_captured`

## 目的

本 Phase の上部本文を正本とし、AC-1..AC-9 を実コード・テスト・証跡へ接続する。

## 実行タスク

- [x] Phase 本文の該当タスクを完了
- [x] 実装対象・検証対象を AC trace に接続
- [x] Phase 12 / artifacts の状態語彙と整合

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 成果物/実行手順

本ファイル本文の手順と `artifacts.json.metadata.verify_commands` を正本とする。実装済み成果物は `apps/web` / `apps/api` / `packages/shared` と Phase 11 / 12 outputs に反映済み。

## 完了条件

- [x] AC trace が維持されている
- [x] focused tests が PASS している
- [x] Phase 11 local visual evidence が存在する
- [x] Phase 12 strict 7 が存在する

## 統合テスト連携

focused Vitest 6 files / 50 tests PASS を主証跡とし、typecheck / lint / verify:tokens / verify:phase12-compliance / gate-metadata を全体 gate とする。
