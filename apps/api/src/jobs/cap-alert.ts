// 03b-followup-006: per-sync write cap (200) 連続到達検知 + Analytics Engine emit。
// `sync_jobs.metrics_json.writeCapHit` を直近 N=3 件分走査し、3 連続 hit かつ
// 直前 window が未達のときだけ `sync_write_cap_consecutive_hit` を emit する。
// detector / emitter は Cloudflare Workers の Analytics Engine binding に依存する。

import { RESPONSE_SYNC, type SyncJobKind } from "./_shared/sync-jobs-schema";

export interface CapAlertEnv {
  readonly DB: D1Database;
  readonly SYNC_ALERTS?: AnalyticsEngineDataset;
}

export interface ConsecutiveCapHitResult {
  readonly windowSize: number;
  readonly consecutiveHits: number;
  readonly previousWindowReached: boolean;
  readonly thresholdReached: boolean;
  readonly shouldEmit: boolean;
}

interface CapHitRow {
  job_id: string | null;
  started_at: string | null;
  writeCapHit: number | null;
}

const SELECT_RECENT_CAP_HITS = `
  SELECT job_id, started_at,
         COALESCE(json_extract(metrics_json, '$.writeCapHit'), 0) AS writeCapHit
  FROM sync_jobs
  WHERE job_type = ?1
  ORDER BY started_at DESC, job_id DESC
  LIMIT ?2
`;

export async function evaluateConsecutiveCapHits(
  env: CapAlertEnv,
  options: { window: number; jobKind: SyncJobKind },
): Promise<ConsecutiveCapHitResult> {
  const window = Math.max(1, options.window);
  const limit = window + 1;
  const result = await env.DB.prepare(SELECT_RECENT_CAP_HITS)
    .bind(options.jobKind, limit)
    .all<CapHitRow>();
  const rows = result.results ?? [];
  const flags = rows.map((row) => row.writeCapHit === 1);

  const recentWindow = flags.slice(0, window);
  const previousWindow = flags.slice(1, window + 1);

  const thresholdReached =
    recentWindow.length === window && recentWindow.every(Boolean);
  const previousWindowReached =
    previousWindow.length === window && previousWindow.every(Boolean);

  const consecutiveHits = thresholdReached ? window : 0;
  const shouldEmit = thresholdReached && !previousWindowReached;

  return {
    windowSize: window,
    consecutiveHits,
    previousWindowReached,
    thresholdReached,
    shouldEmit,
  };
}

export async function emitConsecutiveCapHitEvent(
  env: CapAlertEnv,
  args: {
    jobId: string;
    jobKind: SyncJobKind;
    consecutiveHits: number;
    windowSize: number;
  },
): Promise<void> {
  if (!env.SYNC_ALERTS) {
    console.warn(
      "[cap-alert] SYNC_ALERTS binding 未設定のため emit を skip",
    );
    return;
  }
  try {
    env.SYNC_ALERTS.writeDataPoint({
      blobs: ["sync_write_cap_consecutive_hit", args.jobKind],
      doubles: [args.consecutiveHits, args.windowSize],
      indexes: [args.jobId],
    });
  } catch (err) {
    console.warn(
      "[cap-alert] emit failed",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export const CAP_ALERT_DEFAULT_WINDOW = 3;
export const CAP_ALERT_DEFAULT_JOB_KIND = RESPONSE_SYNC;
