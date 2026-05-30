# Phase 12: ドキュメント同期

## ステータス

`completed`（strict 7 を `outputs/phase-12/` に揃えた）

## 概要

本 Phase は Task C（公開 / 会員 layout を SidebarShell へ統合）の Phase 12 成果物を
`outputs/phase-12/` 配下の **strict 7** に揃える実行ガイドである。
Task C は **配線タスク**（layout async 化 + shell mount + route group 集約 + 旧 header 削除）であり、
新規 public interface を持たないため、system spec 同期の Step 2（interface 追加）は **N/A** となる。

## strict 7 索引

| 成果物 | Path | 役割 |
| --- | --- | --- |
| main | `outputs/phase-12/main.md` | Phase 12 全体サマリ・6 成果物索引 |
| implementation-guide | `outputs/phase-12/implementation-guide.md` | Part 1（例え話）/ Part 2（技術）|
| system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow 側更新要否判定 |
| documentation-changelog | `outputs/phase-12/documentation-changelog.md` | 全 Step 結果（該当なしも記録）|
| unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件でも出力）|
| skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` | skill / template 改善（なしでも出力）|
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 見出し準拠確認 |

## Step 1-A 〜 1-C（system spec 同期の前段）

| Step | 内容 | 本タスクでの結果 |
| --- | --- | --- |
| 1-A | 完了記録（仕様書 / LOGS / 必要な skill 更新を同一ターンで反映） | `implemented_local_evidence_captured` として記録。実コード・focused tests・typecheck・lint は local complete。pixel screenshot は Gate-C |
| 1-B | 実装状況テーブル（`completed` / `spec_created` 判断） | `workflow_state: implemented_local_evidence_captured`。runtime visual pending を明記 |
| 1-C | 関連タスクテーブル（参照 grep + 関連台帳再同期） | 親 `unified-sidebar-shell-public-and-admin` の Task A/B/E は本サイクル内実装済みとして記録 |

## Task 12-1 〜 12-6（各成果物作成タスク）

| Task | 成果物 | 説明 |
| --- | --- | --- |
| 12-1 | implementation-guide.md | Part 1（中学生レベル例え話）+ Part 2（技術: layout async 化 / SidebarShellServer mount / route group 集約 / 削除 component / 型・シグネチャ / x-pathname fallback / エラーハンドリング）。識別子は phase-2 スケッチから引用 |
| 12-2 | system-spec-update-summary.md | aiworkflow-requirements 側更新要否判定。Step 2 は N/A（新規 public interface なし）。ui-ux-navigation.md の shell 統合 route 記載候補のみ記す |
| 12-3 | documentation-changelog.md | 全 Step（1-A/1-B/1-C/Step2）結果を個別明記。workflow-local 同期と global skill sync を別ブロック |
| 12-4 | unassigned-task-detection.md | 0 件でも出力。current/baseline 分離。M-1/M-2 を候補記録 + 関連タスク差分確認 |
| 12-5 | skill-feedback-report.md | テンプレ改善 / ワークフロー改善 / ドキュメント改善の 3 観点。なしでも出力 |
| 12-6 | phase12-task-spec-compliance-check.md | canonical 9 見出し。Phase 1-13 と strict 7 を root evidence として確認。`hasCompletedTasksAncestor=false` |

## 完了条件

strict 7 が `outputs/phase-12/` に実体化し、各成果物が Phase 1-3 / artifacts.json と整合している。
