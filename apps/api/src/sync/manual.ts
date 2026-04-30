// u-04: POST /admin/sync/run (正本) / POST /admin/sync (互換 mount)
// withSyncMutex で start → fetch → map → upsert → finalize を一括化する。

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
import { upsertMemberResponses } from "./upsert";
import { requireSyncAdmin, type SyncAdminEnv } from "../middleware/require-sync-admin";
import { resolveServiceAccountJson } from "../jobs/sync-sheets-to-d1";
import type { SyncEnvBase, AuditDeps, DiffSummary } from "./types";

interface ManualEnv extends SyncEnvBase, SyncAdminEnv {}

export interface ManualSyncDeps {
  fetchValues?: (env: ManualEnv) => Promise<{ values: string[][]; retryCount: number }>;
  now?: () => Date;
  newId?: () => string;
}

export async function runManualSync(
  env: ManualEnv,
  deps: ManualSyncDeps = {},
): Promise<ReturnType<typeof withSyncMutex>> {
  const auditDeps: AuditDeps = {
    db: env.DB,
    now: deps.now ?? (() => new Date()),
    newId: deps.newId ?? (() => crypto.randomUUID()),
  };
  return withSyncMutex(auditDeps, "manual", async () => {
    return runFetchMapUpsert(env, deps);
  });
}

export async function runFetchMapUpsert(
  env: ManualEnv,
  deps: ManualSyncDeps,
  cursorIso: string | null = null,
): Promise<DiffSummary> {
  const range = env.SYNC_RANGE ?? "Form Responses 1!A1:ZZ10000";
  const fetchValues = deps.fetchValues ?? (async (e: ManualEnv) => {
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
          if (cursorIso) return await client.fetchDelta(range, cursorIso);
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
  await upsertMemberResponses(env.DB, rows);
  return {
    fetched: rows.length,
    upserted: rows.length,
    failed: skipped.length,
    retryCount,
    durationMs: 0,
  };
}

export const manualSyncRoute = new Hono<{ Bindings: ManualEnv }>();

manualSyncRoute.post("/admin/sync/run", requireSyncAdmin, async (c) => {
  const result = await runManualSync(c.env);
  if (result.status === "skipped") {
    return c.json(
      { ok: false, error: "sync_in_progress", auditId: result.auditId },
      409,
    );
  }
  const httpStatus = result.status === "failed" ? 500 : 200;
  return c.json({ ok: result.status !== "failed", result }, httpStatus);
});
