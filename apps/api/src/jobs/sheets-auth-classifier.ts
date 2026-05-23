// UT-25-DERIV-02: Sheets API 失敗を 401/403/その他に分類する純関数。
// 通知判断は呼び出し側（logger / healthcheck）の責務。

import { SheetsFetchError } from "./sheets-fetcher";

export type SheetsAuthCode =
  | "SHEETS_AUTH_401_KEY_INVALID"
  | "SHEETS_AUTH_403_FORBIDDEN"
  | "SHEETS_AUTH_OTHER";

export interface SheetsAuthClassification {
  code: SheetsAuthCode;
  status: number | null;
  message: string;
  isAuthFailure: boolean;
}

const MAX_MSG = 500;

export function classifySheetsAuthError(err: unknown): SheetsAuthClassification {
  const raw = err instanceof Error ? err.message : String(err);
  const message = raw.slice(0, MAX_MSG);
  if (err instanceof SheetsFetchError) {
    if (err.status === 401) {
      return {
        code: "SHEETS_AUTH_401_KEY_INVALID",
        status: 401,
        message,
        isAuthFailure: true,
      };
    }
    if (err.status === 403) {
      return {
        code: "SHEETS_AUTH_403_FORBIDDEN",
        status: 403,
        message,
        isAuthFailure: true,
      };
    }
    return {
      code: "SHEETS_AUTH_OTHER",
      status: err.status ?? null,
      message,
      isAuthFailure: false,
    };
  }
  return {
    code: "SHEETS_AUTH_OTHER",
    status: null,
    message,
    isAuthFailure: false,
  };
}
