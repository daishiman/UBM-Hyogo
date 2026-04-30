// u-04: sync layer 共通型。SyncTrigger は契約論理名 (manual / scheduled / backfill)。
// audit 物理は sync_job_logs。

export type SyncTrigger = "manual" | "scheduled" | "backfill";

export type AuditStatus = "running" | "success" | "failed" | "skipped";

export interface DiffSummary {
  fetched: number;
  upserted: number;
  failed: number;
  retryCount: number;
  durationMs: number;
}

export interface SyncResult extends DiffSummary {
  status: "success" | "failed" | "skipped";
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
