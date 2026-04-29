# Phase 12 main — ドキュメント更新トップ index

## スコープ

Phase 1〜11 の確定事項（設計 / 実装ランブック / staging smoke 記録テンプレート / MINOR 解決方針）を、UT-26 引き渡し・aiworkflow-requirements 正本反映・派生タスク検出・skill 改善の 4 経路でドキュメント化する。

## 7 ファイル（main.md + 6 補助成果物）の読み順

| 順序 | ファイル | 主読者 | 用途 |
| --- | --- | --- | --- |
| 1 | `implementation-guide.md` | UT-26 担当 | 中学生レベル概念説明 + コマンド系列 + 引き渡しチェックリスト |
| 2 | `system-spec-update-summary.md` | aiworkflow-requirements 反映担当 | 正本ファイルへの反映結果（before / after + 反映先） |
| 3 | `unassigned-task-detection.md` | プロダクトマネジメント | 派生未アサインタスク登録元 |
| 4 | `skill-feedback-report.md` | skill 保守担当 | task-specification-creator skill への気付き |
| 5 | `phase12-task-spec-compliance-check.md` | レビュアー | 本ワークフロー全体の skill 適合性 |
| 6 | `documentation-changelog.md` | 全員 | 本ワークフローで更新したファイル一覧 |

## トレーサビリティ

| 入力 | 出力 |
| --- | --- |
| Phase 02 設計 | implementation-guide.md Part 1 概念 / Part 2 コマンド |
| Phase 03 レビュー（PASS/MINOR/MAJOR） | phase12-task-spec-compliance-check.md §設計レビュー観点 |
| Phase 05 実装ランブック | implementation-guide.md Part 2 コマンド系列 |
| Phase 09 QA 結果 | phase12-task-spec-compliance-check.md §QA 観点 |
| Phase 11 staging smoke ログ | implementation-guide.md Part 2 確定形 / unassigned-task-detection.md 派生候補 |

## セキュリティ最優先

- secret 値・JSON 内容・OAuth トークンを文書に転記しない（全 7 ファイル共通）
- 1Password 参照は `op://Vault/Item/Field` のテンプレ表記
- aiworkflow-requirements 正本は本 Phase review で最小反映済み（secret 値は転記しない）

## 完了状況

- [x] 7 ファイル（main.md + 6 補助成果物）すべて作成済
- [x] 中学生レベル概念説明 4 用語が implementation-guide.md に存在
- [x] aiworkflow-requirements 正本 3 ファイルへの反映結果が system-spec-update-summary.md に存在
- [x] 派生未アサインタスク 3 件以上が unassigned-task-detection.md に存在
- [x] skill 改善提案 2 件以上が skill-feedback-report.md に存在
- [x] secret 値転記 0 件（実値なし。危険マーカーは検証 grep の文字列としてのみ登場）
