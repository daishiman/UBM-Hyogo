// u-04: POST /admin/sync/backfill。
// D1 batch 内で member_responses を truncate-and-reload する。
// 不変条件 #4: member_status の admin 列 (publish_state / is_deleted / hidden_reason)、
// meeting_sessions、member_attendance、member_tags、tag_assignment_queue、magic_tokens、
// member_identities には触らない。consent 同期は別 wave 担当のため本タスクでは行わない。

import { Hono } from "hono";
import { withSyncMutex } from "./audit";
import {
  createSheetsClient,
  fetchWithBackoff,
  backoffConfigFromEnv,
  RateLimitError,
  SheetsFetchError,
} from "./sheets-client";
import { mapSheetRows } from "./mapping";
import { buildUpsertStatements } from "./upsert";
import { requireSyncAdmin, type SyncAdminEnv } from "../middleware/require-sync-admin";
import { resolveServiceAccountJson } from "../jobs/sync-sheets-to-d1";
import type { AuditDeps, SyncEnvBase, DiffSummary } from "./types";

interface BackfillEnv extends SyncEnvBase, SyncAdminEnv {}

export interface BackfillDeps {
  fetchValues?: (env: BackfillEnv) => Promise<{ values: string[][]; retryCount: number }>;
  now?: () => Date;
  newId?: () => string;
}

export async function runBackfill(
  env: BackfillEnv,
  deps: BackfillDeps = {},
): Promise<ReturnType<typeof withSyncMutex>> {
  const auditDeps: AuditDeps = {
    db: env.DB,
    now: deps.now ?? (() => new Date()),
    newId: deps.newId ?? (() => crypto.randomUUID()),
  };
  return withSyncMutex(auditDeps, "backfill", async () => {
    return performBackfill(env, deps);
  });
}

async function performBackfill(
  env: BackfillEnv,
  deps: BackfillDeps,
): Promise<DiffSummary> {
  const range = env.SYNC_RANGE ?? "Form Responses 1!A1:ZZ10000";
  const fetchValues = deps.fetchValues ?? (async (e: BackfillEnv) => {
    const sa = resolveServiceAccountJson(e);
    if (!sa || !e.SHEETS_SPREADSHEET_ID) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON / SHEETS_SPREADSHEET_ID 未設定");
    }
    const client = createSheetsClient({
      spreadsheetId: e.SHEETS_SPREADSHEET_ID,
      serviceAccountJson: sa,
    });
    const { value, retryCount } = await fetchWithBackoff(
      async () => {
        try {
          return await client.fetchAll(range);
        } catch (err) {
          if (err instanceof SheetsFetchError && err.status !== undefined) {
            if (err.status === 429 || err.status >= 500) {
              throw new RateLimitError(err.status);
            }
          }
          throw err;
        }
      },
      backoffConfigFromEnv(e),
    );
    return { values: value.values ?? [], retryCount };
  });
  const { values, retryCount } = await fetchValues(env);
  const { rows, skipped } = mapSheetRows(values);
  if (rows.length === 0) {
    throw new Error("backfill preflight failed: no valid mapped rows");
  }
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare("DELETE FROM member_responses"),
    ...buildUpsertStatements(env.DB, rows),
  ];
  await env.DB.batch(stmts);
  return {
    fetched: rows.length,
    upserted: rows.length,
    failed: skipped.length,
    retryCount,
    durationMs: 0,
  };
}

export const backfillSyncRoute = new Hono<{ Bindings: BackfillEnv }>();

backfillSyncRoute.post("/admin/sync/backfill", requireSyncAdmin, async (c) => {
  const result = await runBackfill(c.env);
  if (result.status === "skipped") {
    return c.json(
      { ok: false, error: "sync_in_progress", auditId: result.auditId },
      409,
    );
  }
  const httpStatus = result.status === "failed" ? 500 : 200;
  return c.json({ ok: result.status !== "failed", result }, httpStatus);
});
