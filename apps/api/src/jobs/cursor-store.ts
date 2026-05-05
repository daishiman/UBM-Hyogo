// 03b: cursor-store
// sync_jobs.metrics_json の中に { cursor, writes, processed, ... } を保存する。
// 直近の response_sync の最終 cursor を読み出すと、次回 sync の差分 base point になる。

import type { D1Db } from "../repository/_shared/db";
import {
  parseMetricsJson,
  RESPONSE_SYNC,
  responseSyncMetricsSchema,
} from "./_shared/sync-jobs-schema";

export interface CursorRecord {
  readonly cursor: string | null;
  readonly writes: number;
  readonly processed: number;
}

export async function readLastCursor(
  db: D1Db,
): Promise<string | null> {
  const r = await db
    .prepare(
      `SELECT metrics_json AS metricsJson FROM sync_jobs
        WHERE job_type = ?1
          AND status = 'succeeded'
          AND json_extract(metrics_json, '$.skipped') IS NOT 1
        ORDER BY started_at DESC LIMIT 1`,
    )
    .bind(RESPONSE_SYNC)
    .first<{ metricsJson: string }>();
  if (!r) return null;
  const parsed = parseMetricsJson(r.metricsJson, responseSyncMetricsSchema, {});
  return typeof parsed.cursor === "string" && parsed.cursor.length > 0
    ? parsed.cursor
    : null;
}
