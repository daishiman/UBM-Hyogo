# Phase 12 Implementation Guide

## Part 1: 中学生レベル

たくさんの行を少しずつ整理するとき、毎回いちばん最初から探すと時間がかかります。そこで「どこまで終わったか」をしおりのように記録する方法を試します。ただし、しおりを先に進めすぎると、途中で失敗した行を飛ばしてしまいます。このタスクでは、今の方法としおり方式を staging の本物に近いデータで比べ、速くて安全だと証明できた場合だけ採用します。

## Part 2: 技術者レベル

Canonical data flow:

`Queue trigger / initial apply` -> `BACKFILL_CURSOR_MODE` -> `schemaAliasBackfillBatch` -> `remaining-scan` or `cursor(backfill_cursor)` -> `schemaDiffQueue` repository -> completion or retry continuation.

Adoption rule:

- Phase 1 is the SSOT.
- Cursor adoption requires both E1 and E4 to pass.
- E2 and E3 are supplementary evidence.

Correctness invariants:

- `backfill.status` public API contract is unchanged.
- `backfill_cursor` is internal only during the shadow phase.
- Cursor commit is batch-scoped.
- Cursor never advances past an unrecorded failed row.
- Failed rows must remain retryable or move to an explicit retry/DLQ state before cursor commit.
- `0015_schema_diff_queue_cursor.sql` is created only when cursor adoption is selected.

SSOT reflection targets:

- `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- `.claude/skills/aiworkflow-requirements/references/database-operations.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
- `.claude/skills/aiworkflow-requirements/indexes/keywords.json`

## Part 3: Implementation actually applied (2026-05-07)

Shadow flag scaffolding をコードに反映済み。adoption 判断 (cursor 採用 / 不採用) は staging runtime evidence 取得後の別ゲート。

### コード変更

| ファイル | 変更 |
| --- | --- |
| `apps/api/src/env.ts` | `BACKFILL_CURSOR_MODE?: string` を `Env` に追加 |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | `BackfillCursorMode` 型 / `resolveBackfillCursorMode` (純関数) / `resolveBackfillCursorModeWithLog` (warn log 付) / `runBackfillBatch` の mode 分岐を追加。stale cursor 以下に remaining row が残る場合は cursor を null reset |
| `apps/api/src/workflows/schemaAliasAssign.ts` | `backfillResponseFieldsByCursor` と initial apply 用 mode helper を新設（`response_id > cursor` で sequential scan、batch 単位 cursor commit） |
| `apps/api/src/routes/admin/schema.ts` | initial apply path でも `BACKFILL_CURSOR_MODE` を解釈し、queue consumer と同じ mode を渡す |
| `apps/api/src/routes/admin/_shared.ts` | `BACKFILL_CURSOR_MODE` env binding 型を追加 |
| `apps/api/src/repository/schemaDiffQueue.ts` | `getBackfillCursor` / `updateBackfillCursor` を追加（既存 `backfill_cursor` TEXT 列を再利用、shadow 段階では migration 不要） |
| `apps/api/src/index.ts` | queue handler が `env.BACKFILL_CURSOR_MODE` を解釈し `runBackfillBatch` に `mode` を渡す |
| `apps/api/src/workflows/schemaAliasBackfillBatch.test.ts` | mode 分岐 / cursor 経路 / stale cursor row-skip 防止 / API contract 不変保証 / 純関数テストを追加 |

### 不変条件

- `BackfillBatchResult` の値域 (`running` / `exhausted` / `completed` / `failed`) 不変、cursor 概念は表に出ない（test で gate）。
- 既存 `backfillResponseFields` (remaining-scan) は無変更。default mode は引き続き remaining-scan。
- migration `0015_schema_diff_queue_cursor.sql` は **未作成**（shadow 段階では既存 `backfill_cursor` 列を再利用）。adoption 確定後に必要であれば追加。

### Adoption gate（runtime — 本タスク範囲外で実行）

1. staging に deploy し、`BACKFILL_CURSOR_MODE=remaining-scan` で 10,000 行 fixture を流し evidence (CPU 時間 / 残行数 / retry_count / `EXPLAIN QUERY PLAN`) を取得
2. 同 fixture を `BACKFILL_CURSOR_MODE=cursor` で再実行し evidence 取得
3. Phase 1 のしきい値表に従い採用判定
4. 採用時: 専用 cursor 列が必要なら `0015_schema_diff_queue_cursor.sql` を追加 / SSOT skill を反映
5. 不採用時: `BackfillCursorMode` / cursor 経路コード / test を撤去

### Local 検証ログ

- `mise exec -- pnpm typecheck` → 全 5 workspace clean
- `mise exec -- pnpm exec vitest run apps/api/src/workflows/schemaAliasBackfillBatch.test.ts` → focused PASS（review cycle で stale cursor regression 追加）
- `mise exec -- pnpm --filter @ubm-hyogo/api lint` → clean
