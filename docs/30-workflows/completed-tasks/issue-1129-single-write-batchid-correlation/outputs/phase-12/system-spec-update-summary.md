# システム仕様更新サマリ — issue-1129 単一 tag write batchId 相関キー付与

## Step 1-A: 完了タスク記録

単一 admin manual tag assign/unassign の audit payload に `batchId` を追加した。相関単位は request-scoped（群サイズ 1）で、bulk #1036 と同じ `$.batchId` path を使う。

## Step 1-B: 実装状況

| 項目 | 値 |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| 実装 | `apps/api/src/routes/admin/members.ts` |
| assign payload | `after: { tagId, source: "manual", batchId }` |
| unassign payload | `before: { tagId, batchId }` |
| read 側 | `auditLog.listFiltered` 非変更。既存 `GET /admin/audit?batchId=` が after/before JSON OR 検索 |
| 非変更 | endpoint / response shape / D1 schema / migration / apps/web |

## Step 1-C: 関連タスク

| Issue | 関係 |
| --- | --- |
| #1079 | batchId read filter |
| #1036 | bulk write batchId payload contract |
| #1128 | index/performance layer（本タスク非変更） |

## Step 2: aiworkflow-requirements 同期結果

| ファイル | 反映内容 |
| --- | --- |
| `references/api-endpoints.md` | single assign/unassign audit payload の `batchId` 契約を追記 |
| `references/task-workflow-active.md` | issue-1129 workflow row を追加 |
| `references/workflow-issue-1129-single-write-batchid-correlation-artifact-inventory.md` | artifact inventory を新規作成 |
| `indexes/quick-reference.md` / `indexes/resource-map.md` | quick lookup を追加 |
| `changelog/20260607-issue-1129-single-write-batchid-correlation.md` / `SKILL-changelog.md` | dated changelog を追加 |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | PASS: 2 files / 31 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
