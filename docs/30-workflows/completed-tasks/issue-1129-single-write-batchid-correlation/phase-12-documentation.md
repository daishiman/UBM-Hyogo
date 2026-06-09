# Phase 12: ドキュメント更新

## ステータス: completed

`implemented_local_evidence_captured / implementation / NON_VISUAL`

## Task 12-1 〜 12-6 チェックリスト

| # | タスク | 成果物 | 状態 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成 | `outputs/phase-12/implementation-guide.md` | [x] 完了 |
| 12-2 | システム仕様更新サマリ作成 | `outputs/phase-12/system-spec-update-summary.md` | [x] 完了 |
| 12-3 | ドキュメント変更履歴作成 | `outputs/phase-12/documentation-changelog.md` | [x] 完了 |
| 12-4 | 未タスク検出レポート作成 | `outputs/phase-12/unassigned-task-detection.md` | [x] 完了 |
| 12-5 | skill フィードバックレポート作成 | `outputs/phase-12/skill-feedback-report.md` | [x] 完了 |
| 12-6 | タスク仕様書コンプライアンスチェック | `outputs/phase-12/phase12-task-spec-compliance-check.md` | [x] 完了 |

## Step 1-A: 完了タスク記録

- `apps/api/src/routes/admin/members.ts` の単一 assign/unassign audit payload に request-scoped `batchId` を追加した。
- `apps/api/src/routes/admin/members.tags.contract.spec.ts` と `apps/api/src/routes/admin/audit.contract.spec.ts` に focused contract を追加・強化した。
- NON_VISUAL evidence として focused D1 Vitest 2 files / 31 tests PASS、API typecheck PASS を取得した。

## Step 1-B: 実装状況

| 項目 | 値 |
| --- | --- |
| 実装状況 | `implemented_local_evidence_captured` |
| 変更対象 | `apps/api/src/routes/admin/members.ts` |
| テスト | `apps/api/src/routes/admin/members.tags.contract.spec.ts`, `apps/api/src/routes/admin/audit.contract.spec.ts` |
| 非変更 | `apps/api/src/repository/memberTags.ts`, `apps/api/src/repository/auditLog.ts`, migration, `apps/web` |

## Step 1-C: 関連タスク

| 関連 Issue | 関係 | 重複有無 |
| --- | --- | --- |
| #1079 | read 側 `GET /admin/audit?batchId=` filter を提供済み。本タスクは write 側 payload 拡張 | なし |
| #1036 | bulk write の `batchId` 生成・payload 契約を提供済み。本タスクは単一 write への適用拡張 | なし |
| #1128 | audit_log batchId index 最適化。本タスクは payload 付与層 | なし |

## Step 2: aiworkflow-requirements 同期

| ファイル | 状態 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 更新済み |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 更新済み |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-1129-single-write-batchid-correlation-artifact-inventory.md` | 新規 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 更新済み |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 更新済み |
| `.claude/skills/aiworkflow-requirements/changelog/20260607-issue-1129-single-write-batchid-correlation.md` | 新規 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | 更新済み |

## 完了条件

- [x] Phase 12 strict 7 を物理配置した
- [x] 実コード・テスト・正本仕様を同一 wave で同期した
- [x] commit / push / PR / Issue mutation を user-gated として残した
