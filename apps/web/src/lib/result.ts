// admin-ui-prototype-alignment: 共通 SafeResult 型。
// server component / safeServerFetch から各 admin page へ section 単位の結果を渡す。

export interface SafeResultError {
  code: string;
  message: string;
  correlationId?: string;
}

export type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SafeResultError };

export const safeOk = <T>(data: T): SafeResult<T> => ({ ok: true, data });

export const safeErr = <T>(error: SafeResultError): SafeResult<T> => ({
  ok: false,
  error,
});
