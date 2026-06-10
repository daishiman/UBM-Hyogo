# Phase 12: ドキュメント更新

| 項目 | 値 |
|------|-----|
| Phase | Phase 12 — ドキュメント更新 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `implemented_local_runtime_pending`（strict 7 outputs + local implementation evidence を生成） |
| visualEvidence | `VISUAL`（local static screenshot captured、staging screenshot pending） |
| relatedIssue | `null` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) |

> 本 Phase 12 は **implemented_local_runtime_pending workflow の正本同期証跡**。実装・local static screenshot は取得済みであり、staging runtime screenshot は user-gated として残す。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 12 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 完了条件

- [x] 必須見出しを満たす
- [x] 4条件（矛盾なし・漏れなし・整合性あり・依存関係整合）に反しない
<!-- validator-facing required sections: end -->

## 0. 出力先

`outputs/phase-12/` 配下に以下 7 ファイルを生成する。

| # | ファイル | status | 導線 |
|---|---------|--------|------|
| 1 | [`outputs/phase-12/main.md`](./outputs/phase-12/main.md)（Phase 12 summary） | present | 本 Phase の総括・分類 |
| 2 | [`outputs/phase-12/implementation-guide.md`](./outputs/phase-12/implementation-guide.md)（Part 1 中学生 + Part 2 技術者） | present | 実装ガイド（Gate-B evidence） |
| 3 | [`outputs/phase-12/system-spec-update-summary.md`](./outputs/phase-12/system-spec-update-summary.md) | present | システム仕様反映（Step 2 = N/A 判定） |
| 4 | [`outputs/phase-12/documentation-changelog.md`](./outputs/phase-12/documentation-changelog.md) | present | ドキュメント更新履歴 |
| 5 | [`outputs/phase-12/unassigned-task-detection.md`](./outputs/phase-12/unassigned-task-detection.md) | present | 未タスク検出（0 件 + baseline 3 項目） |
| 6 | [`outputs/phase-12/skill-feedback-report.md`](./outputs/phase-12/skill-feedback-report.md) | present | スキルフィードバック（3 観点固定） |
| 7 | [`outputs/phase-12/phase12-task-spec-compliance-check.md`](./outputs/phase-12/phase12-task-spec-compliance-check.md) | present | canonical 9 見出し整合自己診断 |

注意: 本 Phase 12 は implemented_local_runtime_pending workflow の正本同期証跡。実装・focused verification・local static screenshot は取得済みであり、staging runtime screenshot は pending。strict 7 outputs は PR message / close-out の正本になる。

## 1. Task 1: implementation-guide.md

### Part 1（中学生レベル）

- 「タグが縦に1個ずつ並んでいて見にくい問題」を「掲示板に貼る付箋（タグ）を1枚ずつ縦に貼ったせいで縦長になり、見渡せない状態」に例える。
- 解決を「付箋を横に並べて、入りきらなければ次の行に折り返す（flex-wrap）」と説明。これは新しい機能を足すのではなく「並べ方（見た目のルール = CSS）」を直すだけ、と強調。
- 「検索・区画・ステータス・タグ」がバラバラに見える問題を「文房具を種類ごとの引き出しにまとめる」グルーピングに例える。

### Part 2（技術者レベル）

- 変更対象（CSS 正本 = `legacy-public.css`、選択強調 = `globals.css`、markup = `MemberFilters.client.tsx`）の行レベル指示。
- `[data-role="tag-picker-options"]` への `display:flex; flex-wrap:wrap; gap:var(--ubm-space-2);` 追加、`> li { display:inline-flex; }`。
- 選択強調の `aria-selected` → `aria-checked` 不一致是正（`globals.css` L1756 に `[aria-checked="true"]` 併記 + accent 化）。
- 制約: 新 API endpoint なし / D1 schema 変更なし / 新規 primitive なし / `role="switch"`・`aria-checked` 値・トグル挙動不変（INV-7）/ 色は OKLch トークン経由。
- Phase 11 screenshot references（5 件・`outputs/phase-11/screenshots/*.png`・local static visual は present、staging runtime visual は pending）。

## 2. Task 2: system-spec-update-summary.md

### Step 1: 完了タスク記録（implemented_local_runtime_pending 段階の同 wave 同期）

- aiworkflow-requirements の active workflow / quick-reference / resource-map / artifact-inventory / changelog / LOGS へ workflow 登録。
- task-specification-creator の LOGS / SKILL-changelog へ記録。

### Step 2: システム仕様（ドメイン正本）反映 → **N/A 判定**

本タスクは **公開 surface 不変・UI 表現層（CSS + 最小 markup）のみ**であり、API endpoint surface / D1 schema / Google Form 仕様 / データ shape（`PublicMemberListView` / `topTags`）を一切変更しない（INV-1 / INV-4）。新規 interface / 新規 props / 型変更はゼロ（`TagPickerProps` / `MemberFiltersProps` 不変）。

したがって `docs/00-getting-started-manual/specs/*.md`（ドメイン正本）への反映は **N/A（更新不要）**。根拠は summary 本文に記載する。

## 3. Task 3: documentation-changelog.md

本 implemented-local サイクルで生成した workflow ドキュメント（Phase 1-13 + outputs strict 7 + artifacts.json + metadata.json）と `apps/web` 実装差分・local static visual evidence の追加を記録する。

## 4. Task 4: unassigned-task-detection.md（0 件でも出力必須）

- 新規起票 **0 件・先送り 0 件**（CONST_007: 1 サイクル完結）。
- スコープ外 3 項目を **YAGNI・非起票 baseline** として理由付き記録:
  1. タグ category 別グルーピング表示（`topTags` flat 配列・category 軸は API/schema 拡張 = INV-4 違反）
  2. タグ検索ボックス（現 topTags 件数では過剰・flex-wrap で発見性十分）
  3. メンバーカード全面刷新（「整える」範囲を超える・余白/階層調整に限定）

## 5. Task 5: skill-feedback-report.md（改善点なしでも 3 観点固定）

- Template Improvements / Workflow Improvements / Documentation Improvements の 3 観点を固定出力。
- 本タスクで得た知見: 「UI が見にくい」報告を短絡的な API/機能追加に向けず、実コード Read で CSS 表現層の欠落（display 不在）を主因と確定するパターン。

## 6. Task 6: phase12-task-spec-compliance-check.md

canonical 9 見出し（`## Required Sections` 由来）を逐語維持した自己診断。workflow_state parity（index.md / artifacts.json root+outputs = `implemented_local_runtime_pending`）・Phase 11 local static screenshot が `present` であること・staging runtime visual が user-gated であること・strict 7 present を診断する。

## 7. same-wave skill sync（取得予定）

Phase 12 と同 wave で以下を同期する（実同期は close-out / skill 反映サイクルで実行）:

- `.claude/skills/aiworkflow-requirements/`: task-workflow-active / quick-reference / resource-map / artifact-inventory（新規）/ LOGS / SKILL-changelog / topic-map（rebuild）
- `.claude/skills/task-specification-creator/`: LOGS / SKILL-changelog / lessons-learned

## 8. 完了条件

- [x] strict 7 ファイル列挙 + 各 outputs への導線
- [x] Task 1-6 内容指針（Part1 中学生 / Part2 技術者 / Step 2 = N/A 判定 / 未タスク 0 件 + baseline 3 / 3 観点固定 / canonical 9 診断）
- [x] same-wave skill sync 一覧
- [x] implemented_local_runtime_pending・local static evidence present・staging visual pending を明記
