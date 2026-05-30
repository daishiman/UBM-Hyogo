<!-- workflow: members-list-ux-clarity / task: B / phase: 12 -->

[実装区分: 実装仕様書]

# Phase 12 — ドキュメント同期 (Task B)

> 前提: Phase 11 完了
> outputs 配置: 親root `../../outputs/phase-12/` (canonical 9 headings / strict 7集約)

## 1. 概要

Task B (member-filters-live-affordance) の実装結果をシステム仕様 / skill 系ドキュメント / 親 workflow に同期する。
canonical 9 headings の出力テンプレートに従い、親root `../../outputs/phase-12/` 配下にstrict 7を集約する。sub task配下には複製しない。

## 2. 実装ガイド (Part 1 / Part 2)

`outputs/phase-12/implementation-guide.md` に Part 1 (中学生レベル概念説明) + Part 2 (技術詳細) を記述する。

### Part 1 (概念説明) の必須要素

- 「絞り込み中の条件が見えて、× で 1 つずつ消せる」UI を、日常の買い物カゴでの「カゴの中身一覧 + 個別削除」に例える
- 「入力すると自動で絞り込まれる」ことを画面上に小さく案内した理由
- 結果件数の通知 (`aria-live`) がスクリーンリーダー利用者にどう役立つか

### Part 2 (技術詳細) の必須要素

- `SelectedFiltersBar` の props / 型定義 (Phase 2 § 3.2)
- `MemberFiltersProps` の `totalCount` / `displayedCount` 追加
- `onClearOne` の URL 反映ロジック (Phase 5 § 4)
- chip ラベル写像表 (Phase 2 § 3.4)
- `data-*` selector 一覧 (Phase 2 § 7)
- 視覚証跡セクション: VISUAL カテゴリ。screenshot は Task C で撮影し、本 task の Phase 11 は任意 1〜2 枚 `outputs/phase-11/screenshots/` に閉じる

## 3. システム仕様更新サマリ (`outputs/phase-12/system-spec-update-summary.md`)

| Step | 対象 | 内容 |
| ---- | ---- | ---- |
| 1-A | 親 workflow `index.md` | Task B を `completed` 表示に更新 / 関連ドキュメントリンク追加 / 親 LOGS.md と `.claude/skills/aiworkflow-requirements/LOGS.md` を same-wave 更新 |
| 1-B | 親 `artifacts.json` | Task B 完了に伴う implementation_status 更新 (親側 `implemented_local_evidence_captured` 化判断は Task A/B/C 揃いで実施) |
| 1-C | 親 phase 表の関連タスク | Task B `status=completed` / Task C 依存解消 |
| Step 2 | システム仕様 (`docs/00-getting-started-manual/specs/`) | 新規インターフェース `SelectedFiltersBar` の追加は public 仕様には載せない (内部 component)。Step 2 = N/A |

## 4. ドキュメント更新履歴 (`outputs/phase-12/documentation-changelog.md`)

- Step 1-A / 1-B / 1-C / Step 2 の各結果を個別に明記 (該当なしも記録)
- workflow-local sync と global skill sync を別ブロックで記録

## 5. 未タスク検出 (`outputs/phase-12/unassigned-task-detection.md`)

検出ソース (0 件でも出力必須):

- 本 task のスコープ外宣言 (`tag` chip の label 解決 / focus 戻し / mobile あふれ制御 / debounce)
- Phase 10 MINOR 指摘 (上記 4 件のうち実装中に再評価)
- `describe.skip` 内の旧 `[data-role="clear"]` 参照残存チェック (Phase 9 で確認)
- TODO/FIXME grep 結果 (`apps/web/src/components/public/`)

検出形式:

```
状態: candidate / current / baseline
ID: FU-MEMFILT-B-001 ...
依存タスク: 既存 OPEN Issue との重複確認
```

検出 0 件でも空テンプレートを残す。

## 6. スキルフィードバック (`outputs/phase-12/skill-feedback-report.md`)

| 観点 | 候補 |
| ---- | ---- |
| テンプレート改善 | wrapper による後方互換維持パターン (旧名 → 新名汎化) の汎化候補 |
| ワークフロー改善 | Task 分割で 1 タスクが他タスク (`page.tsx`) に最小差分パッチを当てる際の責務境界 |
| ドキュメント改善 | chip ラベル写像表のような static lookup を component 内 const と公開仕様の両方で持つときの SSOT 整理 |

改善点なしでも空ファイル出力必須。

## 7. compliance check (`outputs/phase-12/phase12-task-spec-compliance-check.md`)

- 親rootのPhase 12 strict 7成果物が揃っているか自己点検
- canonical 9 headings 遵守: 概要 / 実装ガイド / システム仕様更新サマリ / ドキュメント更新履歴 / 未タスク検出 / スキルフィードバック / compliance check / 視覚証跡 / 関連リンク

## 8. 視覚証跡

- Phase 11 § 2 で撮影した任意 1〜2 枚への参照
- baseline 4 viewport × 3 density × 2 state は Task C 担当のため、本 task では参照のみ
- NON_VISUAL ではないため `screenshots/.gitkeep` は削除しない (空でも `outputs/phase-11/screenshots/` ディレクトリは存在)

## 9. 関連リンク

- 親 workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
- 親 Phase 2 § 3: `../../phase-2-design.md`
- 親 Phase 3 § 2.3 / § 2.4: `../../phase-3-design-review.md`
- Task A: `../task-a-density-toggle-ux-clarity/` (該当時)
- Task C: `../task-c-page-integration-and-visual-baseline/` (該当時)
- CLAUDE.md UI alignment 不変条件 #1..#4

## DoD

- [ ] 親root `../../outputs/phase-12/` に strict 7 成果物が揃っている
- [ ] canonical 9 headings に整合
- [ ] system-spec-update-summary に Step 1-A/1-B/1-C/Step 2 の判定が記録
- [ ] documentation-changelog が Step ごとに記録
- [ ] unassigned-task-detection が 0 件でも出力
- [ ] skill-feedback-report が改善点なしでも出力
- [ ] compliance-check が root evidence として残る
