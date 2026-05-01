# Phase 3: 設計レビューゲート

## Alternatives

| 案 | 内容 | 契約整合 | drift 検出 | 保守コスト | 判定 |
| --- | --- | --- | --- | --- | --- |
| A | shared zod schema を API / web / test で共有 | PASS | PASS | PASS | GO |
| B | apps/web に TS union を手書き複製 | MINOR | MAJOR | MINOR | 不採用 |
| C | OpenAPI 生成へ拡張 | PASS | PASS | MAJOR | scope 超過 |
| D | API schema だけ shared へ re-export | MINOR | MINOR | PASS | 案 A の互換補助 |

## Decision

条件付き GO。案 A を採用し、既存 `apps/api/src/schemas/tagQueueResolve.ts` は backward-compatible alias として残す。

## Blockers

| Blocker | 解消 |
| --- | --- |
| B-1 shared admin schema 配置慣習なし | `packages/shared/src/schemas/admin/` を新設 |
| B-2 07a upstream contract 未完了 | implementation-guide / 正本 docs が union 済み |
| B-3 contract test 配置未確定 | 既存 `apps/api/src/routes/admin/tags-queue.test.ts` を route contract home として拡張 |

最終判定は Phase 10 で再確認する。

