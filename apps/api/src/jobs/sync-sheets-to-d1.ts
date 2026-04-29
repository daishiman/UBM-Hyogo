// UT-09: Cron / 手動 両経路から呼ばれる同期ジョブの core entry。
// fetch → map → upsert → log を直列に組み立てる。pagination/retry/lock/log の 4 要素を内包。

import {
  acquireSyncLock,
  releaseSyncLock,
  type SyncLock,
} from "./sync-lock";
import {
  GoogleSheetsFetcher,
  type SheetsFetcher,
  type SheetsValueRange,
} from "./sheets-fetcher";
import { mapSheetRows, type MemberRow } from "./mappers/sheets-to-members";
import { withRetry } from "../utils/with-retry";
import { WriteQueue } from "../utils/write-queue";

export interface SyncEnv {
  readonly DB: D1Database;
  readonly GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  readonly GOOGLE_SHEETS_SA_JSON?: string;
  readonly SHEETS_SPREADSHEET_ID?: string;
  readonly SYNC_BATCH_SIZE?: string;
  readonly SYNC_MAX_RETRIES?: string;
  readonly SYNC_RANGE?: string;
}

export interface SyncOptions {
  readonly trigger: "cron" | "admin" | "backfill";
  readonly fetcher?: SheetsFetcher;
  readonly now?: () => Date;
  readonly runId?: string;
  readonly lockTtlMs?: number;
}

export interface SyncResult {
  readonly status: "success" | "failed" | "skipped";
  readonly runId: string;
  readonly fetched: number;
  readonly upserted: number;
  readonly failed: number;
  readonly retryCount: number;
  readonly durationMs: number;
  readonly skippedReason?: string;
  readonly error?: string;
}

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000;

export async function runSync(
  env: SyncEnv,
  options: SyncOptions,
): Promise<SyncResult> {
  const now = options.now ?? (() => new Date());
  const runId = options.runId ?? crypto.randomUUID();
  const startedAt = now();
  const start = startedAt.getTime();

  let lock: SyncLock | null = null;
  let retryCount = 0;

  const batchSize = parseIntOrDefault(env.SYNC_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const maxRetries = parseIntOrDefault(env.SYNC_MAX_RETRIES, DEFAULT_MAX_RETRIES);

  try {
    lock = await acquireSyncLock(env.DB, {
      holder: runId,
      triggerType: options.trigger,
      ttlMs: options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS,
      now,
    });
    if (!lock) {
      return finalizeSkipped(env.DB, {
        runId,
        trigger: options.trigger,
        startedAt,
        finishedAt: now(),
        reason: "another sync is in progress",
      });
    }

    await insertRunningLog(env.DB, {
      runId,
      trigger: options.trigger,
      startedAt: startedAt.toISOString(),
    });

    const fetcher = options.fetcher ?? buildDefaultFetcher(env);
    const range = env.SYNC_RANGE ?? "Form Responses 1!A1:ZZ10000";
    const valueRange: SheetsValueRange = await fetcher.fetchRange(range);
    const values = valueRange.values ?? [];
    const { rows, skipped } = mapSheetRows(values);

    const queue = new WriteQueue();
    let upserted = 0;
    const errors: string[] = [];

    for (const batch of chunk(rows, batchSize)) {
      try {
        const result = await queue.enqueue(() =>
          withRetry(() => upsertMembers(env.DB, batch), {
            maxRetries,
            baseMs: 50,
          }),
        );
        retryCount += result.attempts;
        upserted += batch.length;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
    await queue.drain();

    const finishedAt = now();
    const durationMs = finishedAt.getTime() - start;
    const status: SyncResult["status"] = errors.length > 0 ? "failed" : "success";
    const failed = rows.length - upserted + skipped.length;

    await finishLog(env.DB, runId, {
      status,
      finishedAt: finishedAt.toISOString(),
      fetched: rows.length,
      upserted,
      failed,
      retryCount,
      durationMs,
      errorReason: errors.length > 0 ? errors.join("; ").slice(0, 1000) : null,
    });

    return {
      status,
      runId,
      fetched: rows.length,
      upserted,
      failed,
      retryCount,
      durationMs,
      error: errors[0],
    };
  } catch (err) {
    const finishedAt = now();
    const message = err instanceof Error ? err.message : String(err);
    await finishLog(env.DB, runId, {
      status: "failed",
      finishedAt: finishedAt.toISOString(),
      fetched: 0,
      upserted: 0,
      failed: 0,
      retryCount,
      durationMs: finishedAt.getTime() - start,
      errorReason: message.slice(0, 1000),
    }).catch(() => undefined);
    return {
      status: "failed",
      runId,
      fetched: 0,
      upserted: 0,
      failed: 0,
      retryCount,
      durationMs: finishedAt.getTime() - start,
      error: message,
    };
  } finally {
    if (lock) {
      await releaseSyncLock(env.DB, lock).catch(() => undefined);
    }
  }
}

function buildDefaultFetcher(env: SyncEnv): SheetsFetcher {
  const serviceAccountJson = resolveServiceAccountJson(env);
  if (!serviceAccountJson || !env.SHEETS_SPREADSHEET_ID) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON / SHEETS_SPREADSHEET_ID が未設定です",
    );
  }
  return new GoogleSheetsFetcher({
    spreadsheetId: env.SHEETS_SPREADSHEET_ID,
    serviceAccountJson,
  });
}

export function resolveServiceAccountJson(env: SyncEnv): string | undefined {
  return env.GOOGLE_SERVICE_ACCOUNT_JSON ?? env.GOOGLE_SHEETS_SA_JSON;
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) return [items.slice()];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function parseIntOrDefault(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

const UPSERT_COLUMNS = [
  "response_id",
  "response_email",
  "submitted_at",
  "full_name",
  "nickname",
  "location",
  "birth_date",
  "occupation",
  "hometown",
  "ubm_zone",
  "ubm_membership_type",
  "ubm_join_date",
  "business_overview",
  "skills",
  "challenges",
  "can_provide",
  "hobbies",
  "recent_interest",
  "motto",
  "other_activities",
  "url_website",
  "url_facebook",
  "url_instagram",
  "url_threads",
  "url_youtube",
  "url_tiktok",
  "url_x",
  "url_blog",
  "url_note",
  "url_linkedin",
  "url_others",
  "self_introduction",
  "public_consent",
  "rules_consent",
  "extra_fields_json",
  "unmapped_question_ids_json",
] as const;

const ROW_FIELD_ORDER: (keyof MemberRow)[] = [
  "responseId",
  "responseEmail",
  "submittedAt",
  "fullName",
  "nickname",
  "location",
  "birthDate",
  "occupation",
  "hometown",
  "ubmZone",
  "ubmMembershipType",
  "ubmJoinDate",
  "businessOverview",
  "skills",
  "challenges",
  "canProvide",
  "hobbies",
  "recentInterest",
  "motto",
  "otherActivities",
  "urlWebsite",
  "urlFacebook",
  "urlInstagram",
  "urlThreads",
  "urlYoutube",
  "urlTiktok",
  "urlX",
  "urlBlog",
  "urlNote",
  "urlLinkedin",
  "urlOthers",
  "selfIntroduction",
  "publicConsent",
  "rulesConsent",
  "extraFieldsJson",
  "unmappedQuestionIdsJson",
];

export async function upsertMembers(
  db: D1Database,
  rows: readonly MemberRow[],
): Promise<void> {
  if (rows.length === 0) return;
  const placeholders = UPSERT_COLUMNS.map((_, i) => `?${i + 1}`).join(", ");
  const updateAssignments = UPSERT_COLUMNS.filter((c) => c !== "response_id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");
  const sql = `INSERT INTO member_responses (${UPSERT_COLUMNS.join(", ")}, updated_at)
VALUES (${placeholders}, datetime('now'))
ON CONFLICT(response_id) DO UPDATE SET ${updateAssignments}, updated_at = datetime('now')`;

  const statements = rows.map((row) =>
    db.prepare(sql).bind(...ROW_FIELD_ORDER.map((k) => row[k] ?? null)),
  );
  await db.batch(statements);
}

interface InsertRunningLogInput {
  runId: string;
  trigger: string;
  startedAt: string;
}

async function insertRunningLog(
  db: D1Database,
  input: InsertRunningLogInput,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO sync_job_logs (run_id, trigger_type, status, started_at) VALUES (?1, ?2, 'running', ?3)",
    )
    .bind(input.runId, input.trigger, input.startedAt)
    .run();
}

interface FinishLogInput {
  status: SyncResult["status"];
  finishedAt: string;
  fetched: number;
  upserted: number;
  failed: number;
  retryCount: number;
  durationMs: number;
  errorReason: string | null;
}

async function finishLog(
  db: D1Database,
  runId: string,
  input: FinishLogInput,
): Promise<void> {
  await db
    .prepare(
      `UPDATE sync_job_logs SET status = ?2, finished_at = ?3, fetched_count = ?4,
        upserted_count = ?5, failed_count = ?6, retry_count = ?7, duration_ms = ?8, error_reason = ?9
       WHERE run_id = ?1`,
    )
    .bind(
      runId,
      input.status,
      input.finishedAt,
      input.fetched,
      input.upserted,
      input.failed,
      input.retryCount,
      input.durationMs,
      input.errorReason,
    )
    .run();
}

interface FinalizeSkippedInput {
  runId: string;
  trigger: string;
  startedAt: Date;
  finishedAt: Date;
  reason: string;
}

async function finalizeSkipped(
  db: D1Database,
  input: FinalizeSkippedInput,
): Promise<SyncResult> {
  await db
    .prepare(
      `INSERT INTO sync_job_logs (run_id, trigger_type, status, started_at, finished_at, error_reason, duration_ms)
       VALUES (?1, ?2, 'skipped', ?3, ?4, ?5, ?6)`,
    )
    .bind(
      input.runId,
      input.trigger,
      input.startedAt.toISOString(),
      input.finishedAt.toISOString(),
      input.reason,
      input.finishedAt.getTime() - input.startedAt.getTime(),
    )
    .run();
  return {
    status: "skipped",
    runId: input.runId,
    fetched: 0,
    upserted: 0,
    failed: 0,
    retryCount: 0,
    durationMs: input.finishedAt.getTime() - input.startedAt.getTime(),
    skippedReason: input.reason,
  };
}
