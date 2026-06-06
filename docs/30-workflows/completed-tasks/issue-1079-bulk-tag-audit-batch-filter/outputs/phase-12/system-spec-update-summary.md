# System spec update summary — issue-1079-bulk-tag-audit-batch-filter

> automation-30 改善で `spec_created` close-out を撤回し、実コード実装後の aiworkflow-requirements 同期結果を記録する。

## Step 1-A: 完了タスク記録

| 項目 | 内容 |
| --- | --- |
| 対象 | `/admin/audit` への bulk tag batchId 検索（API filter + json_extract）・row 表示・copy 導線追加 |
| 実装区分 | `implementation / VISUAL_ON_EXECUTION` |
| workflow_state | `implemented_local_evidence_captured` |
| 実装（API） | `apps/api/src/routes/admin/audit.ts`, `apps/api/src/repository/auditLog.ts` |
| 実装（Web） | `apps/web/src/components/admin/AuditLogPanel.tsx`, `apps/web/src/components/admin/BatchIdCopyButton.tsx`, `apps/web/app/(admin)/admin/audit/page.tsx`, `apps/web/src/lib/admin/types.ts` |
| tests | API contract/repository、Web component/page tests |

## Step 1-B: 実装状況

| 項目 | 値 |
| --- | --- |
| Gate-A | passed（spec authoring） |
| Gate-B | passed（local implementation tests） |
| Gate-C | pending_user_gate（authenticated runtime visual screenshot） |
| Phase 13 | pending_user_approval（commit / push / PR 未実行） |

検証済み:

- API D1 targeted Vitest: 2 files / 26 tests PASS（`audit.contract.spec.ts` と `auditLog.repository.spec.ts`）。壊れた JSON row 混在時の `?batchId=` 500 を `json_valid` guard で回帰固定。
- Web targeted Vitest: `BatchIdCopyButton`, `AuditLogPanel`, admin audit page の 3 files / 54 tests PASS。
- Web package-script run は対象 tests PASS。ただし wrapper が全体を拾い、既存 unrelated `MemberDrawer.tags.spec.tsx` 2 failures と初回 fake-timer test 1 failure を含んだため exit 1。fake-timer test は修正後 targeted PASS。

## Step 1-C: 関連タスク

| 関連 | 関係 | 状態 |
| --- | --- | --- |
| `issue-1036-bulk-member-tag-assign` | batchId 生成・audit before/after への埋め込み元 | 完了済み・landed |
| `task-issue-1036-followup-001`（#1077） | bulk tag UI staging visual baseline | 別関心 |
| `task-issue-1036-followup-002`（#1078） | bulk action bar large tag catalog UX | 別関心 |
| `issue-1079-bulk-tag-audit-batch-filter` | read 側 batchId 検索・表示・copy | 本 workflow |

## Step 2: 新規インターフェースの正本反映

| 新規/拡張 | 正本反映先 | 結果 |
| --- | --- | --- |
| `GET /admin/audit?batchId=<id>` | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 反映済み |
| `appliedFilters.batchId` | API contract / Web types | 反映済み |
| `BatchIdCopyButton` | artifact inventory / quick-reference | 反映済み |
| `extractBatchId` | 内部 helper | 公開 interface ではないため artifact inventory にのみ記録 |

schema 変更・新 endpoint・write 側変更は無し。親 #1036 の `correlation_id` 列なし方針を維持する。
