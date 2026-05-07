// UT-07B-FU-01: Cloudflare Queue / Cron 切替を吸収する enqueue helper。
//
// 設計根拠: docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/phase-02.md
//   判断 1（Queue vs Cron）/ 判断 4（dedupe_key）
//
// 不変条件 #5: D1 アクセスは apps/api 内のみ。Queue binding 経由 producer も apps/api に閉じる。

import type { DbCtx } from "../repository/_shared/db";
import { clearDedupeKey, tryReserveDedupeKey } from "../repository/schemaDiffQueue";
import { computeDedupeKey } from "./schemaAliasBackfillBatch";

export interface BackfillJob {
  diffId: string;
  questionId: string;
  newStableKey: string;
  retryCount?: number;
}

export interface BackfillQueueProducer {
  send(message: BackfillJob): Promise<void>;
}

/**
 * back-fill job を enqueue する。
 *
 * - Queue binding が利用可能なら producer.send で enqueue
 * - 不在時（local dev / Free plan / migration 中）は dedupe_key を予約せず `sent=false` を返す
 * - dedupe_key 衝突時は `alreadyEnqueued: true` で送信スキップ
 */
export const enqueueBackfill = async (
  c: DbCtx,
  producer: BackfillQueueProducer | null | undefined,
  input: BackfillJob,
): Promise<{ dedupeKey: string; alreadyEnqueued: boolean; sent: boolean }> => {
  const dedupeKey = await computeDedupeKey(
    input.diffId,
    input.questionId,
    input.newStableKey,
  );
  if (!producer) {
    return { dedupeKey, alreadyEnqueued: false, sent: false };
  }
  const reserve = await tryReserveDedupeKey(c, input.diffId, dedupeKey);
  if (reserve.alreadyEnqueued) {
    return { dedupeKey, alreadyEnqueued: true, sent: false };
  }
  try {
    await producer.send({
      diffId: input.diffId,
      questionId: input.questionId,
      newStableKey: input.newStableKey,
      ...(input.retryCount !== undefined ? { retryCount: input.retryCount } : {}),
    });
  } catch (e) {
    await clearDedupeKey(c, input.diffId);
    throw e;
  }
  return { dedupeKey, alreadyEnqueued: false, sent: true };
};
