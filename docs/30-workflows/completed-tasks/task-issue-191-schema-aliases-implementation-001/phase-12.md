# Phase 12: ドキュメント同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | close-out documentation |

## 目的

実装完了後に aiworkflow-requirements 正本、workflow inventory、未タスク、skill feedback を同期する。

## 実行タスク

作成する必須成果物:

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリー |
| `outputs/phase-12/implementation-guide.md` | 中学生向け説明 + 技術者向け実装ガイド |
| `outputs/phase-12/system-spec-update-summary.md` | 正本仕様更新差分 |
| `outputs/phase-12/documentation-changelog.md` | docs 更新履歴 |
| `outputs/phase-12/unassigned-task-detection.md` | 残課題。0 件でも出力 |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback。改善なしでも出力 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Phase 12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | 必須成果物 |
| aiworkflow requirements | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | index 同期 |
| database implementation | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | `schema_aliases` 実装結果 |

## 実行手順

1. `database-implementation-core.md`、`api-endpoints.md`、`task-workflow-active.md`、indexes を更新対象として分類する。
2. 実装済みの facts だけを正本に反映する。
3. fallback retirement、本番 D1 apply、追加 hardening は未完了なら `unassigned-task-detection.md` に残す。
4. `artifacts.json` と必要なら `outputs/artifacts.json` の整合を取る。

## 統合テスト連携

| 判定項目 | 基準 |
| --- | --- |
| 7 files | all exist |
| current facts | evidence-backed only |
| unassigned | 0 件でも出力 |

## 多角的チェック観点（AIが判断）

- docs-only close-out 由来の予定事実を実装済み facts と混ぜていないか。
- Phase 13 承認前に PR 作成を実行していないか。

## サブタスク管理

| サブタスク | 完了条件 |
| --- | --- |
| spec update | 正本更新 |
| changelog | 更新履歴 |
| unassigned | 残課題分類 |
| skill feedback | 改善点記録 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| Phase 12 bundle | `outputs/phase-12/*` | close-out |

## 完了条件

- [x] Phase 12 必須 7 ファイルが揃っている
- [x] 正本仕様と実装 facts が一致している
- [x] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [x] Phase 13 の承認待ち状態へ進める

## 次Phase

Phase 13: PR作成
