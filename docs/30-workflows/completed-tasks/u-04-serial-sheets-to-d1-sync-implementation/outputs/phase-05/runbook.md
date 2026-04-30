# runbook.md（u-04 実装ランブック）

> 9 ファイル placeholder + sanity check 手順。本実装は `apps/api/src/sync/` 配下を新規作成し、既存 `jobs/sync-sheets-to-d1.ts` を Phase 9 で deprecation re-export 化する。

## 0. 事前確認

| # | 手順 |
| --- | --- |
| P-01 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging` |
| P-02 | `sync_locks` / `sync_job_logs` / `member_responses` / `member_identities` / `member_status` テーブル存在確認 |
| P-03 | `SYNC_ADMIN_TOKEN` / `GOOGLE_SERVICE_ACCOUNT_JSON` / `SHEETS_SPREADSHEET_ID` 配置確認 |

## 1. apps/api/src/sync/types.ts

`SyncTrigger` / `AuditStatus` / `DiffSummary` / `AuditDeps` / `SyncResult` / `Env` interface 集約。

## 2. apps/api/src/sync/audit.ts

`startRun` / `finishRun` / `failRun` / `skipRun` / `listRecent` / `withSyncMutex` を提供。

- 物理書き込み先: `sync_job_logs`
- `trigger` 値: manual / scheduled / backfill（`sync_job_logs.trigger_type` のみ書く。互換 mount 経由の `admin` 受領は manual に正規化）
- mutex は `sync_locks` 経由（`mutex.ts` 呼び出し）
- `withSyncMutex(deps, trigger, fn)` は `try/finally` で finalize 保証

## 3. apps/api/src/sync/mutex.ts

既存 `jobs/sync-lock.ts` の `acquireSyncLock` / `releaseSyncLock` を import し、薄い wrapper として再 export。

## 4. apps/api/src/sync/mapping.ts

Phase 6-8 では既存 `jobs/mappers/sheets-to-members.ts` を re-export（`mapSheetRows`, `MemberRow`）。Phase 9 で物理移動。consent 正規化 / unmapped 退避ロジックは既存に従う。

## 5. apps/api/src/sync/upsert.ts

既存 `jobs/sync-sheets-to-d1.ts` の `upsertMembers` SQL（`UPSERT_COLUMNS` / `ROW_FIELD_ORDER`）を抜き出して `upsertMemberResponses` として再配置。

## 6. apps/api/src/sync/sheets-client.ts

既存 `jobs/sheets-fetcher.ts` の `GoogleSheetsFetcher` を import + factory `createSheetsClient` を提供（fetchAll / fetchDelta）。`fetchDelta(cursor)` は Sheets API 呼び出し後にクライアント側で submittedAt フィルタリング。

## 7. apps/api/src/sync/manual.ts

```
POST /admin/sync/run
  - require Bearer SYNC_ADMIN_TOKEN
  - withSyncMutex(deps, "manual", fn)
  - body: fetch + map + upsert
  - 200 { ok, auditId, result } / 409 { ok:false, error: "sync_in_progress", auditId }
```

## 8. apps/api/src/sync/scheduled.ts

```
runScheduledSync(env)
  - withSyncMutex(deps, "scheduled", fn)
  - cursor = SELECT MAX(finished_at) FROM sync_job_logs WHERE status='success' AND trigger_type IN ('manual','scheduled')
  - fetch all + map + filter (submittedAt >= cursor) + upsert
```

## 9. apps/api/src/sync/backfill.ts

```
POST /admin/sync/backfill
  - require Bearer SYNC_ADMIN_TOKEN
  - withSyncMutex(deps, "backfill", fn)
  - D1 batch:
      DELETE FROM member_responses
      DELETE FROM member_identities
      INSERT 全 normalized rows (member_responses upsert)
      INSERT/UPSERT consent (member_status; admin 列に触れない)
```

## 10. apps/api/src/sync/index.ts

`syncRouter` (manual + backfill + audit GET をまとめた Hono router) と `runScheduledSync` を export。

## 11. apps/api/src/index.ts 接続

- `app.route("/", syncRouter)` mount（既存 `app.route("/admin", adminSyncRoute)` 互換維持）
- `scheduled` handler の default branch を `runScheduledSync(env)` に差し替え

## 12. wrangler.toml

```toml
[triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
```
（`0 */6` → `0 *` の 1 行差分。staging はそのまま）

## 13. middleware/require-sync-admin.ts

```ts
export const requireSyncAdmin: MiddlewareHandler<{ Bindings: { SYNC_ADMIN_TOKEN?: string } }> = async (c, next) => {
  const expected = c.env.SYNC_ADMIN_TOKEN;
  if (!expected) return c.json({ ok: false, error: "SYNC_ADMIN_TOKEN not configured" }, 500);
  const auth = c.req.header("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) return c.json({ ok: false, error: "unauthorized" }, 401);
  await next();
};
```

## 14. sanity check

| # | 手順 | 期待 |
| --- | --- | --- |
| S-01 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | error 0 |
| S-02 | `mise exec -- pnpm --filter @ubm-hyogo/api test` | green |
| S-03 | `grep -rE "googleapis\|from ['\"]node:" apps/api/src/sync` | 0 |
| S-04 | `grep -rE "publish_state\|is_deleted\|meeting_sessions" apps/api/src/sync/{manual,scheduled,backfill}.ts` | 0 |
