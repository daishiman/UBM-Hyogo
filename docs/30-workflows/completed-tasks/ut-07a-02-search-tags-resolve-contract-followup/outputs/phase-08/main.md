# Phase 8: DRY 化

## DRY Decisions

| Topic | Decision |
| --- | --- |
| body schema | `packages/shared/src/schemas/admin/tag-queue-resolve.ts` を SSOT 化 |
| apps/api local schema | re-export alias のみ残し移行コストを抑制 |
| apps/web type | local duplicate union を削除し shared type import |
| tests | shared schema unit + API route contract に責務分離 |

## Non-goals

- OpenAPI generator 導入は scope 外。
- workflow input type の大改修は既存 unit tests への影響が大きいため、本タスクでは route boundary で shared schema を保証する。

判定: PASS。

