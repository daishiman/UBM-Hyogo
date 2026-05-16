# Phase 2 — Validation Matrix（コマンド・gate）

| ID | コマンド | 期待 exit | 期待出力 / 補足 | 失敗時 |
| --- | --- | --- | --- | --- |
| V-1 | `mise exec -- pnpm typecheck` | 0 | type error 0 件（JSDoc は型に影響しない） | JSDoc 内 `@link` 誤記の可能性 → 修正 |
| V-2 | `mise exec -- pnpm lint` | 0 | lint error 0 件 | JSDoc 形式 / unused import → 修正 |
| V-3 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- tagQueue` | 0 | tagQueueResolve contract test PASS | 既存挙動に変化なし。FAIL なら JSDoc 以外の混入を疑う |
| V-4 | `mise exec -- pnpm --filter @ubm-hyogo/api test -- memberTags.readonly` | 0 | type-level test PASS（allow list 維持 + `assign*` 派生禁止） | allow list の `assignTagsToMember` 表記が削除されていないか確認 |
| V-5 | `rg "assignTagsToMember" apps/api/src packages/shared/src` | 0 | 固定 hit 数ではなく分類判定。production caller は `apps/api/src/workflows/tagQueueResolve.ts` の 1 箇所のみ | 新規 production caller 混入 → 即停止し設計見直し |
| V-6 | `rg "tagQueueResolve workflow" apps/api/src/repository/memberTags.ts` | 0 | 3 hit 以上（冒頭 + 関数 + interface） | JSDoc 追加漏れ |

## CI gate との整合

本タスクで CI workflow 新規追加は行わない。既存の `verify-test-suffix` / `pnpm typecheck` / `pnpm lint` / `pnpm test` で十分。

## Phase 11 evidence canonical paths

```
outputs/phase-11/evidence/typecheck.txt
outputs/phase-11/evidence/lint.txt
outputs/phase-11/evidence/test-tagQueue.txt
outputs/phase-11/evidence/test-memberTags-readonly.txt
outputs/phase-11/grep-assignTagsToMember.txt
outputs/phase-11/grep-jsdoc-marker.txt
```
