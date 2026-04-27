# `withRetry` / Cron / Queues 設計（Phase 2 成果物）

## 1. 設計方針

- **主戦略**: Cron Triggers の「次回実行で再処理」（既存 `wrangler.toml: crons = ["0 * * * *"]`）
- **補助戦略**: in-request の bounded retry（`maxAttempts` 上限 2、累計待機 < 1 秒）
- **Workers 制約遵守**: `setTimeout` 長時間 sleep を回避。短時間 (< 200ms) の `await new Promise` のみ許容
- **Queues**: MVP では未採用（有償の可能性。Phase 2 設計で除外、Phase 12 ドキュメントで「将来検討」とする）
- **分類関数**: transient（network・5xx・rate limit・timeout）はリトライ、permanent（4xx・認証）は即失敗

## 2. シグネチャ

```ts
// packages/shared/src/retry.ts
import type { UbmErrorCode } from "./errors";

export type RetryClassification = "retry" | "stop";

export interface RetryOptions {
  /** 最大試行回数。in-request は最大 2 に丸められる（Workers 制約） */
  maxAttempts: number;
  /** 初回バックオフ ms（指数: baseDelayMs * 2^attempt） */
  baseDelayMs: number;
  /** 累計タイムアウト（超過時に UBM-6002 を throw） */
  totalTimeoutMs?: number;
  /** リトライ可否分類関数 */
  classify: (err: unknown) => RetryClassification;
  /** AbortSignal */
  signal?: AbortSignal;
  /** Workers 環境フラグ（テスト用、デフォルト true） */
  isWorkersRuntime?: boolean;
  /** 上限超過時に投げる ApiError コード（既定 UBM-6001） */
  failureCode?: UbmErrorCode;
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T>;

/** 単純な分類: HTTP 5xx / network エラー / timeout のみリトライ */
export function defaultClassify(err: unknown): RetryClassification;

/** Sheets API 用プリセット */
export const SHEETS_RETRY_PRESET: Readonly<RetryOptions>;
```

## 3. 動作仕様

### 成功時

- `fn(0)` 実行 → 成功時はそのまま返す（リトライなし）

### 失敗時

1. `classify(err)` を実行
2. `"stop"` なら即 throw（`ApiError` 化はしない、生 err を re-throw）
3. `"retry"` なら以下:
   - `attempt + 1 >= maxAttempts` なら `ApiError({ code: failureCode ?? "UBM-6001", log: { cause: err } })` を throw
   - `signal?.aborted` なら abort error を throw
   - `Date.now() - startedAt > totalTimeoutMs` なら `UBM-6002` を throw
   - `delay = baseDelayMs * 2^attempt`（ただし `delay <= 200` のみ許容、超える場合は警告ログ + 即時再試行）
   - `await new Promise(r => setTimeout(r, delay))` 後 `attempt + 1` で再帰

### Workers 制約丸め込み

```ts
const effectiveMaxAttempts = (opts.isWorkersRuntime ?? true)
  ? Math.min(opts.maxAttempts, 2)
  : opts.maxAttempts;
```

`maxAttempts > 2` を Workers ランタイムで指定された場合は警告ログを出力した上で 2 に丸める（Phase 12 のドキュメントで明記）。

## 4. プリセット

```ts
export const SHEETS_RETRY_PRESET: Readonly<RetryOptions> = {
  maxAttempts: 2,
  baseDelayMs: 100,
  totalTimeoutMs: 800,
  classify: defaultClassify,
  failureCode: "UBM-6001",
};
```

## 5. 利用例（UT-09 で使われる想定）

```ts
import { withRetry, SHEETS_RETRY_PRESET, ApiError } from "@ubm-hyogo/shared";

const rows = await withRetry(
  () => fetchSheetRows(env.GOOGLE_SERVICE_ACCOUNT_JSON, env.SHEET_ID),
  SHEETS_RETRY_PRESET,
);
// withRetry 内部で UBM-6001 / UBM-6002 / UBM-6003 が ApiError として throw される
```

## 6. 分類関数の既定実装

```ts
export function defaultClassify(err: unknown): RetryClassification {
  if (err instanceof ApiError) {
    // ApiError 経由の場合はコードで判定
    if (err.code === "UBM-6001" || err.code === "UBM-6002" || err.code === "UBM-6003") return "retry";
    return "stop";
  }
  if (err instanceof TypeError && /fetch failed/i.test(err.message)) return "retry";
  // HTTP error メッセージ判定（簡易）
  const msg = err instanceof Error ? err.message : String(err);
  if (/\b(5\d{2}|429)\b/.test(msg)) return "retry";
  if (/timeout/i.test(msg)) return "retry";
  return "stop";
}
```

## 7. Cron / Queues 戦略の役割分担

| 戦略 | 利用シーン | 理由 |
| --- | --- | --- |
| Cron Triggers（採用） | 1 時間おきの再同期 | 既存実装あり。in-request 失敗時も次回実行で自然回復する |
| in-request bounded retry（採用） | 一時的 transient エラーの即時回復 | UX 改善、ユーザー再操作なしで成功確率を上げる |
| Cloudflare Queues（不採用 / 将来検討） | 数分〜数時間後の遅延リトライ | 有償、設定追加が必要。dead letter キュー連携は UT-07 で再評価 |

## 8. 不変条件

| # | 不変条件 |
| --- | --- |
| INV-R1 | Workers ランタイムでは `maxAttempts <= 2` |
| INV-R2 | バックオフ累計は `totalTimeoutMs` を超えない（超過時 UBM-6002）|
| INV-R3 | リトライ判定は `classify` 関数経由で必ず通る（暗黙の例外吸収禁止）|
| INV-R4 | 上限超過時は必ず `ApiError`（`UBM-6xxx`）として throw（生 Error は throw しない）|
| INV-R5 | `signal.aborted` を確認するチェックポイントは「リトライ前」と「sleep 後」の 2 箇所 |
