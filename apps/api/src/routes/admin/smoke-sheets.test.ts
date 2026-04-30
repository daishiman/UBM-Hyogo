// UT-26: /admin/smoke/sheets のユニットテスト。
// 実 Google Sheets API は呼ばず、SheetsFetcher を mock 注入することで
// production guard / 認可 / 正常系 (cache hit) / 各エラー分類を検証する。

import { describe, it, expect, vi } from "vitest";
import { createSmokeSheetsRoute } from "./smoke-sheets";
import {
  SheetsFetchError,
  type SheetsFetcher,
  type SheetsFetcherDiagnostics,
  type SheetsValueRange,
} from "../../jobs/sheets-fetcher";

const VALID_TOKEN = "dummy-token";
const SPREADSHEET_ID = "1ABCDdefghijklmnopqrstuvwxyzWXYZ";
const SA_JSON = JSON.stringify({
  client_email: "test@test.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----\n",
});

function buildEnv(overrides: Record<string, unknown> = {}) {
  return {
    ENVIRONMENT: "development" as const,
    SMOKE_ADMIN_TOKEN: VALID_TOKEN,
    SHEETS_SPREADSHEET_ID: SPREADSHEET_ID,
    GOOGLE_SHEETS_SA_JSON: SA_JSON,
    ...overrides,
  };
}

function makeFetcher(impl: (range: string) => Promise<SheetsValueRange>): SheetsFetcher {
  return { fetchRange: vi.fn(impl) };
}

function makeDiagnosticFetcher(
  impl: (range: string) => Promise<SheetsValueRange>,
  getTokenFetchCount: () => number,
): SheetsFetcher & SheetsFetcherDiagnostics {
  return {
    fetchRange: vi.fn(impl),
    getTokenFetchCount,
  };
}

describe("createSmokeSheetsRoute", () => {
  it("production 環境では 404 を返す", async () => {
    const app = createSmokeSheetsRoute({
      createFetcher: () => makeFetcher(async () => ({ range: "x" })),
    });
    const res = await app.request(
      "/",
      { method: "GET", headers: { authorization: `Bearer ${VALID_TOKEN}` } },
      buildEnv({ ENVIRONMENT: "production" }),
    );
    expect(res.status).toBe(404);
  });

  it("Authorization ヘッダなしで 401", async () => {
    const app = createSmokeSheetsRoute({
      createFetcher: () => makeFetcher(async () => ({ range: "x" })),
    });
    const res = await app.request("/", { method: "GET" }, buildEnv());
    expect(res.status).toBe(401);
  });

  it("Authorization ヘッダ不一致で 401", async () => {
    const app = createSmokeSheetsRoute({
      createFetcher: () => makeFetcher(async () => ({ range: "x" })),
    });
    const res = await app.request(
      "/",
      { method: "GET", headers: { authorization: "Bearer wrong" } },
      buildEnv(),
    );
    expect(res.status).toBe(401);
  });

  it("正常系: 200, cacheHit=true (token fetch 1 回), spreadsheetId が redact される", async () => {
    let call = 0;
    const fetcher = makeDiagnosticFetcher(async () => {
      call += 1;
      return {
        range: "Sheet1!A1:B2",
        values: [
          ["a", "b"],
          ["c", "d"],
        ],
      } satisfies SheetsValueRange;
    }, () => (call > 0 ? 1 : 0));
    let t = 0;
    // latency はレスポンス情報として残すだけで、cacheHit 判定には使わない。
    const now = vi.fn(() => {
      const cur = t;
      // 0 -> 100 -> 105 の順に進める
      if (t === 0) t = 100;
      else if (t === 100) t = 105;
      return cur;
    });
    const app = createSmokeSheetsRoute({
      createFetcher: () => fetcher,
      now,
    });
    const res = await app.request(
      "/",
      { method: "GET", headers: { authorization: `Bearer ${VALID_TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      env: string;
      spreadsheetIdRedacted: string;
      sheetName: string;
      rangeRequested: string;
      firstCall: { latencyMs: number; rowsReturned: number };
      secondCall: { latencyMs: number; rowsReturned: number };
      tokenFetchesDuringSmoke: number;
      cacheHit: boolean;
    };
    expect(body.ok).toBe(true);
    expect(body.cacheHit).toBe(true);
    expect(body.tokenFetchesDuringSmoke).toBe(1);
    expect(body.firstCall.latencyMs).toBeGreaterThan(body.secondCall.latencyMs);
    expect(body.sheetName).toBe("Sheet1");
    // redact 形式: 先頭4文字 + *** + 末尾4文字。完全な ID を含まない
    expect(body.spreadsheetIdRedacted).toContain("***");
    expect(body.spreadsheetIdRedacted).not.toBe(SPREADSHEET_ID);
    expect(body.spreadsheetIdRedacted).not.toContain(
      SPREADSHEET_ID.substring(4, SPREADSHEET_ID.length - 4),
    );
    expect(call).toBe(2);
  });

  it("401 エラー: errorCode='AUTH_INVALID'", async () => {
    const app = createSmokeSheetsRoute({
      createFetcher: () =>
        makeFetcher(async () => {
          throw new SheetsFetchError("OAuth token 401: invalid", 401);
        }),
    });
    const res = await app.request(
      "/",
      { method: "GET", headers: { authorization: `Bearer ${VALID_TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { ok: boolean; errorCode: string };
    expect(body.ok).toBe(false);
    expect(body.errorCode).toBe("AUTH_INVALID");
  });

  it("403 エラー: errorCode='PERMISSION_DENIED'", async () => {
    const app = createSmokeSheetsRoute({
      createFetcher: () =>
        makeFetcher(async () => {
          throw new SheetsFetchError("Sheets API 403: forbidden", 403);
        }),
    });
    const res = await app.request(
      "/",
      { method: "GET", headers: { authorization: `Bearer ${VALID_TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { errorCode: string };
    expect(body.errorCode).toBe("PERMISSION_DENIED");
  });

  it("429 エラー: errorCode='RATE_LIMITED'", async () => {
    const app = createSmokeSheetsRoute({
      createFetcher: () =>
        makeFetcher(async () => {
          throw new SheetsFetchError("Sheets API 429: too many", 429);
        }),
    });
    const res = await app.request(
      "/",
      { method: "GET", headers: { authorization: `Bearer ${VALID_TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(429);
    const body = (await res.json()) as { errorCode: string };
    expect(body.errorCode).toBe("RATE_LIMITED");
  });

  it("GOOGLE_SHEETS_SA_JSON 未設定で errorCode='CONFIG_MISSING'", async () => {
    const app = createSmokeSheetsRoute({
      createFetcher: () => makeFetcher(async () => ({ range: "x" })),
    });
    const res = await app.request(
      "/",
      { method: "GET", headers: { authorization: `Bearer ${VALID_TOKEN}` } },
      buildEnv({ GOOGLE_SHEETS_SA_JSON: undefined }),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { errorCode: string };
    expect(body.errorCode).toBe("CONFIG_MISSING");
  });

  it("SHEETS_SPREADSHEET_ID 未設定で errorCode='CONFIG_MISSING'", async () => {
    const app = createSmokeSheetsRoute({
      createFetcher: () => makeFetcher(async () => ({ range: "x" })),
    });
    const res = await app.request(
      "/",
      { method: "GET", headers: { authorization: `Bearer ${VALID_TOKEN}` } },
      buildEnv({ SHEETS_SPREADSHEET_ID: undefined }),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { errorCode: string };
    expect(body.errorCode).toBe("CONFIG_MISSING");
  });

  it("不正 range は 400 / INVALID_RANGE で Sheets API を呼ばない", async () => {
    const fetcher = makeFetcher(async () => ({ range: "x" }));
    const app = createSmokeSheetsRoute({
      createFetcher: () => fetcher,
    });
    const res = await app.request(
      "/?range=https://example.com/secret",
      { method: "GET", headers: { authorization: `Bearer ${VALID_TOKEN}` } },
      buildEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { errorCode: string };
    expect(body.errorCode).toBe("INVALID_RANGE");
    expect(fetcher.fetchRange).not.toHaveBeenCalled();
  });
});
