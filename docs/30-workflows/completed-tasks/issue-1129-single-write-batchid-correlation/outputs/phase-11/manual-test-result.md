# Phase 11 手動テスト結果

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1129-single-write-batchid-correlation` |
| workflow_state | `implemented_local_evidence_captured` |
| visualEvidence | `NON_VISUAL` |
| 評価層 | Semantic（API contract） |
| スクリーンショット | N/A。UI / browser-visible surface 変更なし |

## 実測証跡

| Command | Exit | Result |
| --- | --- | --- |
| `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | 0 | PASS: 2 files / 31 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | 0 | PASS |

## テスト内訳

| ファイル | 追加/強化した検証 | 対応 AC |
| --- | --- | --- |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | assign `after_json.batchId` UUID、unassign `before_json.batchId` UUID、noop 非退化 | AC-2 / AC-3 / AC-5 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | single write route 実行後の `GET /admin/audit?batchId=` filter hit、assign/unassign 別 UUID | AC-2 / AC-3 / AC-4 / AC-6 |

## 完了条件

- [x] 実行コマンド・exit code・件数を記録した
- [x] NON_VISUAL 代替証跡として focused API contract を記録した
- [x] runtime visual pending を PASS と誤記していない
