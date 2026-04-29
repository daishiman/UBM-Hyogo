// 03b: cursor-store
// sync_jobs.metrics_json の中に { cursor, writes, processed, ... } を保存する。
// 直近の response_sync の最終 cursor を読み出すと、次回 sync の差分 base point になる。

import type { D1Db } from "../repository/_shared/db";

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
        WHERE job_type = 'response_sync'
          AND status = 'succeeded'
          AND json_extract(metrics_json, '$.skipped') IS NOT 1
        ORDER BY started_at DESC LIMIT 1`,
    )
    .bind()
    .first<{ metricsJson: string }>();
  if (!r) return null;
  try {
    const parsed = JSON.parse(r.metricsJson) as { cursor?: string | null };
    return typeof parsed.cursor === "string" && parsed.cursor.length > 0
      ? parsed.cursor
      : null;
  } catch {
    return null;
  }
}
