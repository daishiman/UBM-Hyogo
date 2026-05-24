---
phase: 5
title: Implementation Guide
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 5: Implementation Guide — SA key 失効監視

[実装区分: 実装仕様書]

## 1. 新規ファイル

### 1.1 `apps/api/src/jobs/sheets-auth-classifier.ts`

```ts
import { SheetsFetchError } from './sheets-fetcher';

export type SheetsAuthCode =
  | 'SHEETS_AUTH_401_KEY_INVALID'
  | 'SHEETS_AUTH_403_FORBIDDEN'
  | 'SHEETS_AUTH_OTHER';

export interface SheetsAuthClassification {
  code: SheetsAuthCode;
  status: number | null;
  message: string;
  isAuthFailure: boolean;
}

const MAX_MSG = 500;

export function classifySheetsAuthError(err: unknown): SheetsAuthClassification {
  const message = (err instanceof Error ? err.message : String(err)).slice(0, MAX_MSG);
  if (err instanceof SheetsFetchError) {
    if (err.status === 401) {
      return { code: 'SHEETS_AUTH_401_KEY_INVALID', status: 401, message, isAuthFailure: true };
    }
    if (err.status === 403) {
      return { code: 'SHEETS_AUTH_403_FORBIDDEN', status: 403, message, isAuthFailure: true };
    }
    return { code: 'SHEETS_AUTH_OTHER', status: err.status ?? null, message, isAuthFailure: false };
  }
  return { code: 'SHEETS_AUTH_OTHER', status: null, message, isAuthFailure: false };
}
```

### 1.2 `apps/api/src/jobs/sheets-auth-logger.ts`

```ts
import { classifySheetsAuthError, type SheetsAuthClassification } from './sheets-auth-classifier';

export interface SheetsAuthLogContext {
  jobName: 'backfill' | 'manual-sync' | 'sync-sheets-to-d1' | 'sheets-auth-healthcheck';
  isolateId?: string;
  spreadsheetId?: string;
  ts?: string;
}

export function logSheetsAuthFailure(
  err: unknown,
  ctx: SheetsAuthLogContext
): SheetsAuthClassification {
  const cls = classifySheetsAuthError(err);
  const event = cls.isAuthFailure ? 'sheets.auth.failure' : 'sheets.auth.transient';
  // 構造化ログ: Workers logs / Tail Worker から query 可能
  // eslint-disable-next-line no-console
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
```

### 1.3 `apps/api/src/scheduled/sheets-auth-healthcheck.ts`

```ts
import type { ApiEnv } from '../env';
import { logSheetsAuthFailure } from '../jobs/sheets-auth-logger';
import { classifySheetsAuthError, type SheetsAuthClassification } from '../jobs/sheets-auth-classifier';
import { SheetsFetchError, getSheetsAccessToken } from '../jobs/sheets-fetcher';

export interface SheetsAuthHealthcheckResult {
  ok: boolean;
  classification: SheetsAuthClassification;
  durationMs: number;
}

export async function runSheetsAuthHealthcheck(
  env: ApiEnv,
  _event: ScheduledEvent
): Promise<SheetsAuthHealthcheckResult> {
  const started = Date.now();
  try {
    const token = await getSheetsAccessToken(env);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEETS_SPREADSHEET_ID}?fields=spreadsheetId`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      throw new SheetsFetchError(`healthcheck failed: ${res.status}`, res.status);
    }
    return {
      ok: true,
      classification: { code: 'SHEETS_AUTH_OTHER', status: 200, message: 'ok', isAuthFailure: false },
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const cls = logSheetsAuthFailure(err, {
      jobName: 'sheets-auth-healthcheck',
      spreadsheetId: env.SHEETS_SPREADSHEET_ID,
    });
    if (cls.isAuthFailure) {
      await postAlertRelay(env, cls);
    }
    return { ok: false, classification: cls, durationMs: Date.now() - started };
  }
}

async function postAlertRelay(env: ApiEnv, cls: SheetsAuthClassification): Promise<void> {
  try {
    await fetch(`${env.API_INTERNAL_BASE_URL}/internal/alert-relay`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.INTERNAL_ALERT_TOKEN}` },
      body: JSON.stringify({
        category: 'sheets-auth',
        code: cls.code,
        status: cls.status,
        message: cls.message,
        jobName: 'sheets-auth-healthcheck',
        spreadsheetId: env.SHEETS_SPREADSHEET_ID,
        ts: new Date().toISOString(),
      }),
    });
  } catch (e) {
    // 通知失敗は飲み込む（cron 全体を落とさない）
    // eslint-disable-next-line no-console
    console.error({ event: 'sheets.auth.alert_relay_post_failed', message: String(e) });
  }
}
```

## 2. 編集ファイル diff 方針

### 2.1 `apps/api/src/sync/backfill.ts:63-67`

```diff
-} catch (err) {
-  // existing throw path
-  throw err;
-}
+} catch (err) {
+  logSheetsAuthFailure(err, { jobName: 'backfill', isolateId });
+  throw err;
+}
```

### 2.2 `apps/api/src/sync/manual.ts:62` — 同様パターン

### 2.3 `apps/api/src/jobs/sync-sheets-to-d1.ts` — fetch 呼び出し全体を try/catch でラップし `logSheetsAuthFailure({ jobName: 'sync-sheets-to-d1' })` を挟む

### 2.4 `apps/api/src/index.ts`（scheduled 401-510, `*/15` 分岐）

```diff
 if (event.cron === '*/15 * * * *') {
   ctx.waitUntil(runSyncSheetsToD1(env, event));
+  ctx.waitUntil(runSheetsAuthHealthcheck(env, event));
 }
```

### 2.5 `apps/api/src/routes/internal/alert-relay.ts`

既存 zod schema を union で拡張し、`category: 'sheets-auth'` の payload を許容。dedup key を `alert:sheets-auth:{code}:{window}` で既存 KV 経路に乗せる。

### 2.6 `rollback-runbook.md` 追記（冒頭）

```md
> **失効検出時の起点**: Sheets API 失効 alert (`SHEETS_AUTH_401_KEY_INVALID` / `SHEETS_AUTH_403_FORBIDDEN`) 受信時は、本 runbook の §新 key 投入手順を実行する前に、alert payload 内の rollback URL がこの runbook を指していることを確認すること。逆参照元: `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/`
```

## 3. 実装順序

step-01 → step-02 → step-04 → step-03 → step-06 → step-05 → step-07 の順。
step-03 の sync ジョブ injection は logger（step-02）完成後でないとビルドが通らない。
