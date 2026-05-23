# System Spec Update Summary

aiworkflow-requirements へ e2e-stage-2-2d-contract-stage-2 を同一 wave で反映した。新 endpoint / 新 D1 schema / 新 secret はないため、API 正本は追加せず、workflow inventory と実装状態を同期する。

| target | update | result |
|--------|--------|--------|
| `indexes/resource-map.md` | workflow resource entry | PASS |
| `indexes/quick-reference.md` | Stage 2 sub-task 2d quick lookup | PASS |
| `references/task-workflow-active.md` | active guide entry | PASS |
| `references/workflow-e2e-stage-2-2d-contract-artifact-inventory.md` | artifact inventory | PASS |
| `changelog/20260510-e2e-stage-2-2d-contract.md` | changelog entry | PASS |
| `docs/30-workflows/unassigned-task/e2e-stage-2-2d-contract-stage-2-001.md` | consumed trace | PASS |

正本境界:

- `apps/api/src/routes/admin/{member-delete,requests,audit}.ts` の route schema / response contract export 化。route runtime semantics は不変。
- `apps/web/src/lib/admin/server-fetch.ts` と `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` の identity conflict fixture id を API 実装 `parseConflictId()` と同じ `source__target` 形式へ補正。
- `packages/shared/src/schemas/identity-conflict.ts` は正本として参照のみで変更しない。
- D1 schema / `wrangler.toml` / migrations は変更しない。
- contract test 1 ファイル新規（251 行 / 23 tests）。
