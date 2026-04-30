// UT-26: Sheets API E2E smoke route。dev/staging 限定。production では 404 を返す。
//
// 目的:
//   Cloudflare Workers Edge Runtime 上で Google Sheets API v4 への
//   end-to-end 疎通 (JWT 署名 + OAuth token 取得 + spreadsheets.values.get) を
//   1 コール分で確認できる安全な smoke endpoint を提供する。
//
// セキュリティ要件:
//   - production 環境では 404 を返し route を露出させない。
//   - SMOKE_ADMIN_TOKEN による Bearer 認証必須。
//   - spreadsheetId はログ・レスポンスで redact する。
//   - SA JSON / client_email / private_key / Authorization 値は一切外部へ出さない。

import { Hono } from "hono";
import {
  GoogleSheetsFetcher,
  SheetsFetchError,
  type SheetsFetcher,
  type SheetsFetcherDiagnostics,
  type SheetsValueRange,
} from "../../jobs/sheets-fetcher";

export interface SmokeSheetsEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly SMOKE_ADMIN_TOKEN?: string;
  readonly SHEETS_SPREADSHEET_ID?: string;
  readonly GOOGLE_SHEETS_SA_JSON?: string;
}

export interface SmokeDeps {
  /**
   * Fetcher 生成を inject 可能にする (テストで mock を差し込むため)。
   * 実装は GoogleSheetsFetcher を返す default を使用する。
   */
  createFetcher?: (json: string, spreadsheetId: string) => SheetsFetcher;
  now?: () => number;
}

const DEFAULT_RANGE = "Sheet1!A1:B2";
const MAX_RANGE_LENGTH = 80;
const SAFE_A1_RANGE =
  /^[A-Za-z0-9 _.-]{1,40}![A-Z]{1,3}[1-9][0-9]{0,6}(?::[A-Z]{1,3}[1-9][0-9]{0,6})?$/;

export type SmokeErrorCode =
  | "AUTH_INVALID"
  | "PERMISSION_DENIED"
  | "RATE_LIMITED"
  | "NETWORK"
  | "PARSE"
  | "CONFIG_MISSING"
  | "INVALID_RANGE"
  | "UNKNOWN";

export function createSmokeSheetsRoute(deps: SmokeDeps = {}) {
  const app = new Hono<{ Bindings: SmokeSheetsEnv }>();
  const createFetcher =
    deps.createFetcher ??
    ((json: string, spreadsheetId: string) =>
      new GoogleSheetsFetcher({
        spreadsheetId,
        serviceAccountJson: json,
      }));
  const now = deps.now ?? (() => Date.now());

  app.get("/", async (c) => {
    // 1) production では 404 (mount しない方針)
    if (c.env.ENVIRONMENT === "production") {
      return c.notFound();
    }

    // 2) Bearer 認証
    const expected = c.env.SMOKE_ADMIN_TOKEN;
    const auth = c.req.header("authorization") ?? "";
    if (!expected || auth !== `Bearer ${expected}`) {
      return c.json({ ok: false, error: "unauthorized" }, 401);
    }

    // 3) range
    const requestedRange = c.req.query("range") || DEFAULT_RANGE;
    if (!isSafeA1Range(requestedRange)) {
      return c.json(
        {
          ok: false,
          errorCode: "INVALID_RANGE" satisfies SmokeErrorCode,
          message: "range は安全な A1 形式で指定してください",
          hint: "例: Sheet1!A1:B2。80文字以内、単一シート範囲のみ許可します",
        },
        400,
      );
    }
    const sheetName = extractSheetName(requestedRange);

    // env validation
    const saJson = c.env.GOOGLE_SHEETS_SA_JSON;
    const spreadsheetId = c.env.SHEETS_SPREADSHEET_ID;
    if (!saJson || !spreadsheetId) {
      return c.json(
        {
          ok: false,
          errorCode: "CONFIG_MISSING" satisfies SmokeErrorCode,
          message:
            "GOOGLE_SHEETS_SA_JSON / SHEETS_SPREADSHEET_ID が未設定です",
          hint: "wrangler secret put で設定してください",
        },
        500,
      );
    }

    const spreadsheetIdRedacted = redactSpreadsheetId(spreadsheetId);

    let fetcher: SheetsFetcher;
    try {
      fetcher = createFetcher(saJson, spreadsheetId);
    } catch (e) {
      // SA JSON の parse 失敗等
      console.warn(
        JSON.stringify({
          event: "smoke_sheets_config_error",
          spreadsheetIdRedacted,
          message: extractMessage(e),
        }),
      );
      return c.json(
        {
          ok: false,
          errorCode: "CONFIG_MISSING" satisfies SmokeErrorCode,
          message: "Service Account JSON の parse に失敗しました",
          hint: "GOOGLE_SHEETS_SA_JSON が有効な JSON か確認してください",
        },
        500,
      );
    }

    // 4) 1 回目 / 5) 2 回目
    try {
      const tokenFetchCountBefore = tokenFetchCountOf(fetcher);
      const t0 = now();
      const first = await fetcher.fetchRange(requestedRange);
      const t1 = now();
      const second = await fetcher.fetchRange(requestedRange);
      const t2 = now();
      const tokenFetchCountAfter = tokenFetchCountOf(fetcher);

      const firstLatency = t1 - t0;
      const secondLatency = t2 - t1;
      const tokenFetchesDuringSmoke =
        tokenFetchCountBefore !== null && tokenFetchCountAfter !== null
          ? tokenFetchCountAfter - tokenFetchCountBefore
          : null;
      const cacheHit =
        tokenFetchesDuringSmoke === null ? null : tokenFetchesDuringSmoke === 1;

      console.info(
        JSON.stringify({
          event: "smoke_sheets_ok",
          env: c.env.ENVIRONMENT ?? "unknown",
          spreadsheetIdRedacted,
          rangeRequested: requestedRange,
          firstLatencyMs: firstLatency,
          secondLatencyMs: secondLatency,
          tokenFetchesDuringSmoke,
          cacheHit,
        }),
      );

      return c.json({
        ok: true,
        env: c.env.ENVIRONMENT ?? "unknown",
        spreadsheetIdRedacted,
        sheetName,
        rangeRequested: requestedRange,
        firstCall: {
          latencyMs: firstLatency,
          rowsReturned: rowsOf(first),
          sampleRowCount: rowsOf(first),
        },
        secondCall: {
          latencyMs: secondLatency,
          rowsReturned: rowsOf(second),
        },
        tokenFetchesDuringSmoke,
        cacheHit,
      });
    } catch (e) {
      const { code, status } = classifyError(e);
      console.warn(
        JSON.stringify({
          event: "smoke_sheets_error",
          env: c.env.ENVIRONMENT ?? "unknown",
          spreadsheetIdRedacted,
          rangeRequested: requestedRange,
          errorCode: code,
        }),
      );
      return c.json(
        {
          ok: false,
          errorCode: code,
          message: extractMessage(e),
          hint: hintFor(code),
        },
        status,
      );
    }
  });

  return app;
}

function rowsOf(v: SheetsValueRange): number {
  return v.values?.length ?? 0;
}

function isSafeA1Range(range: string): boolean {
  return range.length <= MAX_RANGE_LENGTH && SAFE_A1_RANGE.test(range);
}

function tokenFetchCountOf(fetcher: SheetsFetcher): number | null {
  const diagnostics = fetcher as Partial<SheetsFetcherDiagnostics>;
  if (typeof diagnostics.getTokenFetchCount !== "function") return null;
  return diagnostics.getTokenFetchCount();
}

function extractSheetName(range: string): string {
  const idx = range.indexOf("!");
  if (idx <= 0) return range;
  return range.substring(0, idx);
}

function redactSpreadsheetId(id: string): string {
  if (id.length <= 8) return "***";
  return `${id.substring(0, 4)}***${id.substring(id.length - 4)}`;
}

function extractMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function classifyError(e: unknown): {
  code: SmokeErrorCode;
  status: 401 | 403 | 429 | 500 | 502;
} {
  if (e instanceof SheetsFetchError) {
    if (e.status === 401) return { code: "AUTH_INVALID", status: 401 };
    if (e.status === 403) return { code: "PERMISSION_DENIED", status: 403 };
    if (e.status === 429) return { code: "RATE_LIMITED", status: 429 };
    return { code: "UNKNOWN", status: 502 };
  }
  if (e instanceof SyntaxError) return { code: "PARSE", status: 502 };
  if (e instanceof TypeError) return { code: "NETWORK", status: 502 };
  return { code: "UNKNOWN", status: 500 };
}

function hintFor(code: SmokeErrorCode): string {
  switch (code) {
    case "AUTH_INVALID":
      return "Service Account の private_key / iat/exp clock skew を確認してください";
    case "PERMISSION_DENIED":
      return "Sheet が SA に共有されているか / Sheets API が有効か確認してください";
    case "RATE_LIMITED":
      return "Quota 超過。バックオフ後に再試行してください";
    case "NETWORK":
      return "Workers の egress / fetch エラー。再試行してください";
    case "PARSE":
      return "API レスポンスの JSON 解析に失敗しました";
    case "CONFIG_MISSING":
      return "必要な secret 変数を設定してください";
    case "INVALID_RANGE":
      return "range は Sheet1!A1:B2 のような単一 A1 range にしてください";
    default:
      return "想定外のエラー。ログを確認してください";
  }
}
