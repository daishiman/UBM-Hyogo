// u-04: sync layer 共通型。SyncTrigger / AuditStatus は @ubm-hyogo/shared canonical を参照。
// 物理は sync_job_logs (apps/api/migrations/0002_sync_logs_locks.sql)。
// canonical 値: trigger_type = cron|admin|backfill / status = running|success|failed|skipped
// canonical 決定根拠: docs/30-workflows/issue-266-shared-sync-zod-contract/phase-2-design.md §6

import type {
  SyncLogStatus,
  SyncTriggerType,
} from "@ubm-hyogo/shared";

// re-export: 既存 import 経路 (`apps/api/src/sync/types`) を破壊しない
export type SyncTrigger = SyncTriggerType;
export type AuditStatus = SyncLogStatus;

export interface DiffSummary {
  fetched: number;
  upserted: number;
  failed: number;
  retryCount: number;
  durationMs: number;
}

export interface SyncResult extends DiffSummary {
  status: Exclude<SyncLogStatus, "running">;
  auditId: string;
  errorReason?: string;
}

export interface AuditDeps {
  db: D1Database;
  now: () => Date;
  newId: () => string;
}

export interface SyncEnvBase {
  readonly DB: D1Database;
  readonly GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  readonly GOOGLE_SHEETS_SA_JSON?: string;
  readonly SHEETS_SPREADSHEET_ID?: string;
  readonly SYNC_BATCH_SIZE?: string;
  readonly SYNC_MAX_RETRIES?: string;
  readonly SYNC_RANGE?: string;
  readonly SYNC_ADMIN_TOKEN?: string;
}
