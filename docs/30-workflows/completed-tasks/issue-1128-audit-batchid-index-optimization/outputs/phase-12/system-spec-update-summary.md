# システム仕様更新サマリ — issue-1128 audit_log batchId index 最適化

workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `NON_VISUAL` / related issue: #1128（CLOSED 維持）

本タスクは `apps/api` 専用の D1 schema 最適化（`audit_log` への batchId 相関列 + index 追加）と、
`apps/api/src/repository/auditLog.ts` の `listFiltered` batchId 検索を index 列走査へ切り替える実装仕様書である。

> **本サマリは local implementation 完了後の実反映記録である。** 公開 API interface は不変だが、
> D1 schema は `audit_log.batch_id` generated column + index を追加したため database 系正本へ反映した。

## Step 1: ドキュメント反映

| Step | 内容 | 状況 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 / LOGS / topic-map: `issue-1128-audit-batchid-index-optimization` を local implementation 完了として記録し、`.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`、quick-reference、resource-map、task-workflow-active、artifact inventory に同期。topic-map / keywords は generator で再生成 | done |
| Step 1-B | 実装状況テーブル: `index.md` / `artifacts.json`（root + outputs 両方）の `workflow_state` / `phases` を `implemented_local_evidence_captured` へ更新 | done |
| Step 1-C | 関連タスクテーブル: 元 unassigned-task spec（`docs/30-workflows/unassigned-task/task-issue-1079-followup-001-audit-batchid-index-optimization.md`）の status を `consumed_by_issue_1128` へ更新し consumed pointer を維持。backlink は破壊しない | done |

> LOGS 実体は aiworkflow-requirements の `LOGS/_legacy.md` fragment に追記した。workflow-local の詳細は本 `documentation-changelog.md` が担う。

## Step 2: 新規インターフェース追加の有無判定

| 判定対象 | 結果 | 理由 |
| --- | --- | --- |
| `AuditLogListFilters.batchId` | **既存・変更なし → N/A** | #1079 で確定済みの公開 filter interface。本タスクは batchId 検索の **実装方式（内部 SQL）** を full scan → index 列走査へ変えるのみで、interface signature（TypeScript 型）は変えない。公開 API 変更なし |
| `GET /admin/audit` query surface | **変更なし → N/A** | query param（batchId 含む）は #1079 確定済で不変（index.md スコープ「含まない」） |
| `listFiltered` シグネチャ | **変更なし → N/A** | 引数・戻り値型は不変。内部 SQL のみ変更 |
| D1 schema 変更（`0026` migration の相関列 + index） | **反映済み** | `audit_log.batch_id` VIRTUAL generated column + `idx_audit_log_batch_id(batch_id, created_at DESC, audit_id DESC)` を `.claude/skills/aiworkflow-requirements/references/database-schema.md` に追記 |

> **要点（pitfall 回避）**: 公開 TypeScript interface（`AuditLogListFilters`）の signature 変更は無いため、Step 2 の
> public interface 追加は N/A。ただし D1 schema（DB 列 + index）追加は別軸のため database 系正本へ反映済み。

## artifacts parity

`docs/30-workflows/completed-tasks/issue-1128-audit-batchid-index-optimization/artifacts.json`（root）と
`.../outputs/artifacts.json` を同期し、`workflow_state` / `phases` / `gates` の status 二重化を防ぐ。
parity check は root / outputs の両方を対象に実施する（`cmp -s artifacts.json outputs/artifacts.json`）。
