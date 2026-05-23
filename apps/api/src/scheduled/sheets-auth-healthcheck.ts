// UT-25-DERIV-02: Sheets API 最小 read を発行して SA key 失効を能動検出する。
// 既存 */15 cron に相乗りする前提（新 cron Trigger を追加しない不変条件）。

import type { Env } from "../env";
import { logSheetsAuthFailure } from "../jobs/sheets-auth-logger";
import {
  classifySheetsAuthError,
  type SheetsAuthClassification,
} from "../jobs/sheets-auth-classifier";
import {
  GoogleSheetsFetcher,
  SheetsFetchError,
  type SheetsFetcher,
} from "../jobs/sheets-fetcher";
import { resolveServiceAccountJson } from "../jobs/sync-sheets-to-d1";

const HEALTHCHECK_RANGE = "A1:A1";

export interface SheetsAuthHealthcheckResult {
  ok: boolean;
  classification: SheetsAuthClassification;
  durationMs: number;
}

export interface SheetsAuthHealthcheckDeps {
  readonly fetch?: typeof fetch;
  readonly fetcher?: SheetsFetcher;
  readonly now?: () => number;
}

export async function runSheetsAuthHealthcheck(
  env: Env,
  _event: ScheduledController,
  deps: SheetsAuthHealthcheckDeps = {},
): Promise<SheetsAuthHealthcheckResult> {
  const now = deps.now ?? Date.now;
  const started = now();
  const sa = resolveServiceAccountJson(env);
  if (!sa || !env.SHEETS_SPREADSHEET_ID) {
    // 未設定環境は skip 扱い（cron を落とさない）。
    return {
      ok: true,
      classification: {
        code: "SHEETS_AUTH_OTHER",
        status: null,
        message: "skipped: GOOGLE_SERVICE_ACCOUNT_JSON / SHEETS_SPREADSHEET_ID 未設定",
        isAuthFailure: false,
      },
      durationMs: now() - started,
    };
  }

  const fetcher: SheetsFetcher =
    deps.fetcher ??
    new GoogleSheetsFetcher({
      spreadsheetId: env.SHEETS_SPREADSHEET_ID,
      serviceAccountJson: sa,
      ...(deps.fetch ? { fetchImpl: deps.fetch } : {}),
    });

  try {
    await fetcher.fetchRange(HEALTHCHECK_RANGE);
    return {
      ok: true,
      classification: {
        code: "SHEETS_AUTH_OTHER",
        status: 200,
        message: "ok",
        isAuthFailure: false,
      },
      durationMs: now() - started,
    };
  } catch (err) {
    const cls = logSheetsAuthFailure(err, {
      jobName: "sheets-auth-healthcheck",
      spreadsheetId: env.SHEETS_SPREADSHEET_ID,
    });
    if (cls.isAuthFailure) {
      await postAlertRelay(env, cls, deps.fetch ?? fetch);
    }
    return { ok: false, classification: cls, durationMs: now() - started };
  }
}

async function postAlertRelay(
  env: Env,
  cls: SheetsAuthClassification,
  fetchImpl: typeof fetch,
): Promise<void> {
  const base = env.API_INTERNAL_BASE_URL;
  const token = env.INTERNAL_ALERT_TOKEN ?? env.CF_WEBHOOK_AUTH_SECRET;
  if (!base || !token) {
    // 通知系の env 未設定時は log 出力のみで終了（cron 全体を落とさない）。
    console.error({
      event: "sheets.auth.alert_relay_skipped",
      reason: "missing API_INTERNAL_BASE_URL or token",
      code: cls.code,
    });
    return;
  }
  try {
    await fetchImpl(`${base}/internal/alert-relay`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-webhook-auth": token,
      },
      body: JSON.stringify({
        category: "sheets-auth",
        code: cls.code,
        status: cls.status,
        message: cls.message,
        jobName: "sheets-auth-healthcheck",
        spreadsheetId: env.SHEETS_SPREADSHEET_ID,
        ts: new Date().toISOString(),
        rollbackRunbookUrl:
          "https://github.com/daishiman/UBM-Hyogo/blob/main/docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md",
      }),
    });
  } catch (e) {
    // 通知失敗は飲み込む（cron 全体を落とさない）
    console.error({
      event: "sheets.auth.alert_relay_post_failed",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

// Export SheetsFetchError re-import path for tests
export { SheetsFetchError };
export { classifySheetsAuthError };
