# Phase 12: ドキュメント更新・spec sync・未タスク検出

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 12 / 13 |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_runtime_pending |
| 前提 | Phase 11 手動テスト観点・撮影計画確定 |
| strict outputs | outputs/phase-12/ 7 ファイル |

## 目的

実装内容を中学生レベル概念説明 + 技術者向けガイドの 2 部構成でドキュメント化し、workflow-local spec sync・未タスク検出（OOS-1）・skill フィードバック・Phase 12 compliance チェックを strict outputs として確定する。implemented_local_runtime_pending の事実ベースで記述し、コード未実装表現を残さない。

## 実行タスク

### T12-1 実装ガイド作成（implementation-guide.md）

- Part 1: 中学生レベルの概念説明。日常の例え話で「検索ボックスの×が 2 つ出る理由」「並べ替えの選択肢を増やす仕組み」を専門用語なしで説明する。
- Part 2: 技術者向け。7 ファイルの TypeScript / CSS 変更、sort enum の 3 層同期（apps/web / apps/api / packages/shared）、ORDER BY 4 分岐、型定義を記述する。
- `## 視覚証跡` セクションで Phase 11 screenshot が captured_local_filter_ui である旨と staging が user-gated である旨を参照する。

### T12-2 system spec 更新サマリ（system-spec-update-summary.md）

- 新規インターフェース: sort enum に `oldest` / `name_desc` を追加（`SortZ` / `appliedQuery.sort` / `SORT_VALUES`）。
- Step 1-A / 1-B / 1-C / Step 2 の spec sync 判定を記録する。workflow-local spec sync と aiworkflow-requirements global sync を別ブロックに分離する。

### T12-3 documentation-changelog 作成（documentation-changelog.md）

- 全 Step（1-A / 1-B / 1-C / Step 2）の結果を個別明記する。「該当なし」も記録する。
- workflow-local と global を別ブロックで記述する。

### T12-4 未タスク検出（unassigned-task-detection.md）

- current: OOS-1（ふりがな設問追加による真の五十音順ソート）を 1 件として formalize する。status=unassigned_pending_issue。
- baseline: OOS-2（他画面の検索×重複検証範囲外）/ OOS-3（ソート a11y ライブリージョン）を分離記録する。
- 関連タスク差分確認で重複起票チェックを行う。

### T12-5 skill フィードバック（skill-feedback-report.md）

- テンプレート / ワークフロー / ドキュメントの改善観点を記録する。改善なしの場合も出力する。

### T12-6 Phase 12 compliance チェック（phase12-task-spec-compliance-check.md）

- Task 12-1..12-6 と canonical 成果物の充足チェック表を root evidence として作成する。implemented_local_runtime_pending 事実ベースで記述する。

## 参照資料

- [index.md](index.md)（AC / ソート値マッピング / OOS-1 / runtime_boundary）
- [phase-11-manual-test.md](phase-11-manual-test.md)（VISUAL 証跡計画）
- [phase-2-design.md](phase-2-design.md)（sort enum 3 層同期 / CSS 抑止戦略）
- `packages/shared/src/zod/viewmodel.ts`（appliedQuery.sort enum）
- `apps/api/src/_shared/search-query-parser.ts`（SortZ）
- `apps/web/src/lib/url/members-search.ts`（SORT_VALUES）
- `unassigned-task-guidelines`（OOS の current / baseline 分離方針）

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] implementation-guide.md が Part 1（中学生レベル）+ Part 2（技術者向け）+ 視覚証跡セクションを含む
- [ ] system-spec-update-summary.md が sort enum 拡張（oldest / name_desc）と Step 1-A/1-B/1-C/Step2 判定を記録している
- [ ] documentation-changelog.md が全 Step を個別明記し workflow-local と global を分離している
- [ ] unassigned-task-detection.md の current に OOS-1 が 1 件 formalize されている
- [ ] skill-feedback-report.md が出力されている
- [ ] phase12-task-spec-compliance-check.md が Task 12-1..12-6 充足チェック表を含む
