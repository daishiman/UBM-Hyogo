// UT-25-DERIV-02: classifier 結果を構造化ログで出力する。
// 通知 (alert-relay) への POST は呼び出し側（healthcheck）責務。

import {
  classifySheetsAuthError,
  type SheetsAuthClassification,
} from "./sheets-auth-classifier";

export interface SheetsAuthLogContext {
  jobName:
    | "backfill"
    | "manual-sync"
    | "sync-sheets-to-d1"
    | "sheets-auth-healthcheck";
  isolateId?: string | undefined;
  spreadsheetId?: string | undefined;
  ts?: string | undefined;
}

export function logSheetsAuthFailure(
  err: unknown,
  ctx: SheetsAuthLogContext,
): SheetsAuthClassification {
  const cls = classifySheetsAuthError(err);
  const event = cls.isAuthFailure
    ? "sheets.auth.failure"
    : "sheets.auth.transient";
  console.error({
    event,
    code: cls.code,
    status: cls.status,
    message: cls.message,
    jobName: ctx.jobName,
    isolateId: ctx.isolateId,
    spreadsheetId: ctx.spreadsheetId,
    ts: ctx.ts ?? new Date().toISOString(),
  });
  return cls;
}
