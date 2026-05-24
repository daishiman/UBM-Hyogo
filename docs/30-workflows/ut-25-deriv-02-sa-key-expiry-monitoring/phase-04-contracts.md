---
phase: 4
title: Contracts
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 4: Contracts — SA key 失効監視

[実装区分: 実装仕様書]

## 1. classifier 型契約

```ts
// apps/api/src/jobs/sheets-auth-classifier.ts
export type SheetsAuthCode =
  | 'SHEETS_AUTH_401_KEY_INVALID'
  | 'SHEETS_AUTH_403_FORBIDDEN'
  | 'SHEETS_AUTH_OTHER';

export interface SheetsAuthClassification {
  code: SheetsAuthCode;
  status: number | null;     // 抽出できない場合 null
  message: string;           // err.message を最大 500 文字でトリム
  isAuthFailure: boolean;    // 401/403 のとき true
}

export function classifySheetsAuthError(err: unknown): SheetsAuthClassification;
```

判定ルール:
- `SheetsFetchError` かつ `status === 401` → `SHEETS_AUTH_401_KEY_INVALID`
- `SheetsFetchError` かつ `status === 403` → `SHEETS_AUTH_403_FORBIDDEN`
- それ以外（5xx / 429 / network / 非 SheetsFetchError）→ `SHEETS_AUTH_OTHER`（`isAuthFailure: false`）

## 2. logger 型契約

```ts
// apps/api/src/jobs/sheets-auth-logger.ts
export interface SheetsAuthLogContext {
  jobName: 'backfill' | 'manual-sync' | 'sync-sheets-to-d1' | 'sheets-auth-healthcheck';
  isolateId?: string;
  spreadsheetId?: string;
  ts?: string; // ISO 8601, default new Date().toISOString()
}

export function logSheetsAuthFailure(
  err: unknown,
  ctx: SheetsAuthLogContext
): SheetsAuthClassification;
```

ログ event schema:

```json
{
  "event": "sheets.auth.failure",
  "code": "SHEETS_AUTH_401_KEY_INVALID",
  "status": 401,
  "message": "...",
  "jobName": "backfill",
  "isolateId": "...",
  "spreadsheetId": "...",
  "ts": "2026-05-22T18:00:00.000Z"
}
```

`isAuthFailure: false` のときは `event: "sheets.auth.transient"` として出力し、alert pipeline には載せない。

## 3. healthcheck 型契約

```ts
// apps/api/src/scheduled/sheets-auth-healthcheck.ts
import type { ApiEnv } from '../env';

export interface SheetsAuthHealthcheckResult {
  ok: boolean;
  classification: SheetsAuthClassification;
  durationMs: number;
}

export function runSheetsAuthHealthcheck(
  env: ApiEnv,
  event: ScheduledEvent
): Promise<SheetsAuthHealthcheckResult>;
```

動作:
1. `env.GOOGLE_SERVICE_ACCOUNT_JSON` から OAuth トークンを取得（既存 sheets-fetcher の auth path を流用）
2. `https://sheets.googleapis.com/v4/spreadsheets/{SHEETS_SPREADSHEET_ID}?fields=spreadsheetId` に GET（最小 read）
3. レスポンス status を `classifySheetsAuthError` に渡して分類
4. `isAuthFailure: true` のとき alert-relay POST（後述 §4）
5. 例外時も rethrow せず classification を返す（cron 全体を落とさない）

## 4. alert-relay payload 拡張

```ts
// apps/api/src/routes/internal/alert-relay.ts
// 既存 zod schema に union 追加
const SheetsAuthAlertPayload = z.object({
  category: z.literal('sheets-auth'),
  code: z.enum(['SHEETS_AUTH_401_KEY_INVALID', 'SHEETS_AUTH_403_FORBIDDEN']),
  status: z.number(),
  message: z.string().max(500),
  jobName: z.string(),
  spreadsheetId: z.string().optional(),
  ts: z.string(),
  rollbackRunbookUrl: z.string().url().default(
    'https://github.com/daishiman/UBM-Hyogo/blob/main/docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md'
  ),
});
```

既存 KV dedup key 規約: `alert:sheets-auth:{code}:{yyyymmddHHMM mod 10min}` — 10 分窓で 3 件目以降を suppress。

## 5. sync ジョブ catch 契約

各 sync ジョブの catch ブロックは以下契約を満たす:

```ts
try {
  await fetchSheets(env, ...);
} catch (err) {
  const cls = logSheetsAuthFailure(err, { jobName: 'backfill', isolateId, spreadsheetId });
  if (cls.isAuthFailure) {
    // alert-relay POST は scheduled 側 healthcheck に集約する。
    // sync ジョブ側では log のみで rethrow し既存挙動を破壊しない。
  }
  throw err; // 既存挙動維持
}
```
