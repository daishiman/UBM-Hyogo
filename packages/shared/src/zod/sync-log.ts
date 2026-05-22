// issue-266: sync_job_logs 契約の shared 正本。
// 物理 source: apps/api/migrations/0002_sync_logs_locks.sql
// canonical 決定根拠: docs/30-workflows/issue-266-shared-sync-zod-contract/phase-2-design.md §6
//
// 型は z.infer 経由でのみ export する。独立 literal union 宣言は禁止
// (Phase 1 不変条件 #4 / Phase 3 §3)。

import { z } from "zod";

import { Iso8601Z, NonEmptyStringZ } from "./primitives";

/**
 * sync_job_logs.status の canonical 値 (物理 DDL 一致)。
 * - running : 実行中
 * - success : 正常終了
 * - failed  : 異常終了
 * - skipped : 別 run が lock 取得中だったためスキップ
 */
export const SyncLogStatusZ = z.enum([
  "running",
  "success",
  "failed",
  "skipped",
]);
export type SyncLogStatus = z.infer<typeof SyncLogStatusZ>;

/**
 * sync_job_logs.trigger_type / sync_locks.trigger_type の canonical 値 (物理一致)。
 * - cron     : Cloudflare Workers cron triggered (旧 TS 値 "scheduled" を物理に揃えた)
 * - admin    : admin route 経由の手動実行 (旧 TS 値 "manual" を物理に揃えた)
 * - backfill : backfill route 経由の truncate-and-reload
 */
export const SyncTriggerTypeZ = z.enum(["cron", "admin", "backfill"]);
export type SyncTriggerType = z.infer<typeof SyncTriggerTypeZ>;

/**
 * sync_job_logs row schema (snake_case = 物理層に合わせる)。
 * D1 read 直後の row を直接 safeParse 可能にする。
 * camelCase 変換は consumer 側 mapper (apps/api/src/sync/audit.ts:listRecent) の責務。
 */
export const SyncLogRecordZ = z.object({
  id: z.number().int().positive(),
  run_id: NonEmptyStringZ,
  trigger_type: SyncTriggerTypeZ,
  status: SyncLogStatusZ,
  started_at: Iso8601Z,
  finished_at: Iso8601Z.nullable(),
  fetched_count: z.number().int().nonnegative(),
  upserted_count: z.number().int().nonnegative(),
  failed_count: z.number().int().nonnegative(),
  retry_count: z.number().int().nonnegative(),
  duration_ms: z.number().int().nonnegative().nullable(),
  error_reason: z.string().nullable(),
});
export type SyncLogRecord = z.infer<typeof SyncLogRecordZ>;
