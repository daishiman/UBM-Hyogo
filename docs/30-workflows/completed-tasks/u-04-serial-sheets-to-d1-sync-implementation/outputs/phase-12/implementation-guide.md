# u-04 Sheets → D1 Sync 実装ガイド（最終版）

## Part 1: 初学者向けの説明

## なぜ必要か

支部会の申し込みフォームには、会員から届いた回答がたまっていく。
この回答をそのまま表だけで見ていると、公開名簿、管理画面、参加状況の確認に使うたびに人が手で写す必要がある。
手で写すと、抜けや重複や古い情報が混ざりやすい。

u-04 の同期係（フォーム回答をアプリ用の台帳へそろえて入れる仕組み）は、フォーム回答を決まった時間ごとに取りに行き、アプリが使うデータ置き場へそろえて入れる係である。
日常の例で言えば、郵便受けに届いた申込書を、担当者が毎時確認して、会員台帳へ同じルールで転記する作業を自動化する。

## 何をするか

- 手動同期: 管理者が必要な時に「今すぐ取り込み」を実行する。
- 定期同期: Cloudflare のサーバー（インターネット上でアプリを動かす場所）が毎時 0 分に自動で取り込みを実行する。
- 全件入れ直し: 台帳をフォーム回答に合わせ直したい時に、フォーム側を正として入れ直す。
- 実行記録: いつ始まり、成功したか、失敗したか、何件処理したかを必ず記録する。

画面は増えない。確認はスクリーンショットではなく、テスト結果、実行記録、手動確認コマンドで行う。
Phase 11 の画面なし証跡（スクリーンショットの代わりになる確認記録）は `outputs/phase-11/manual-test-result.md` と `outputs/phase-11/evidence/non-visual-evidence.md` に残す。

## Part 2: 技術者向けの説明

## 概要

UBM 兵庫支部会の Google Form 回答を Cloudflare D1 へ毎時同期する sync layer (`apps/api/src/sync/`) の最終ガイド。
manual / scheduled (Cron Trigger) / backfill の 3 経路を `withSyncMutex` で直列化し、
Workers 互換 fetch + `crypto.subtle` のみで Google Sheets API v4 にアクセスする。
全実行は `sync_job_logs` テーブル（audit ledger）に running → success / failed / skipped で finalize される。

## アーキテクチャ

```
                ┌──────────────────────┐
                │ Cron Trigger (0 * * *)│
                └─────────┬─────────────┘
                          │ scheduled()
                          ▼
admin POST /admin/sync/run ──► runManualSync ─┐
admin POST /admin/sync/backfill ─► runBackfill┼─► withSyncMutex (sync_locks + sync_job_logs)
admin GET  /admin/sync/audit ──► audit-route   │     ├── sheets-client.fetchAll / fetchDelta
                                                │     │     (JWT via crypto.subtle, fetchWithBackoff)
                                                │     ├── mapping.mapSheetRows (form_field_aliases)
                                                │     ├── upsert.upsertMemberResponses (D1 batch)
                                                │     └── audit.finalizeRun (success / failed / skipped)
                                                ▼
                                          Cloudflare D1 (apps/api binding only)
```

apps/web からの D1 直接アクセスは禁止（不変条件 #5）。sync は `apps/api/src/sync/` に閉じる。

## 主要モジュール

| モジュール | 責務 | 主要 export |
| --- | --- | --- |
| `manual.ts` | `POST /admin/sync/run` 正本 + `runManualSync` | `manualSyncRoute`, `runManualSync`, `runFetchMapUpsert` |
| `scheduled.ts` | Cloudflare Workers `scheduled` handler の全件 upsert sync 実装 | `runScheduledSync` |
| `backfill.ts` | `POST /admin/sync/backfill` の truncate-and-reload | `backfillSyncRoute`, `runBackfill` |
| `audit.ts` | `sync_job_logs` writer + `withSyncMutex` 共通基盤 | `startRun`, `finalizeRun`, `withSyncMutex`, `redact` |
| `audit-route.ts` | `GET /admin/sync/audit?limit=N` | `auditRoute` |
| `sheets-client.ts` | Workers 互換 Google Sheets API v4 client（JWT + fetch） | `createSheetsClient`, `fetchWithBackoff`, `RateLimitError`, `SheetsFetchError` |
| `mapping.ts` | Sheets 列 → stableKey → D1 mapping（`form_field_aliases` 駆動） | `mapSheetRows` |
| `upsert.ts` | `member_responses` の冪等 upsert（admin-managed table には触れない） | `upsertMemberResponses` |
| `mutex.ts` | `sync_locks` の expiry / mutex_held 判定 | `acquireMutex`, `releaseMutex` |
| `types.ts` | `SyncTrigger` / `AuditRow` / `DiffSummary` / `MappingResult` | （型のみ） |
| `index.ts` | apps/api/src/index.ts から mount するための barrel export | route 群 |
| `middleware/require-sync-admin.ts` | `SYNC_ADMIN_TOKEN` Bearer 認証（人間向け `requireAdmin` と分離） | `requireSyncAdmin`, `SyncAdminEnv` |

### 型定義（抜粋）

```ts
export type SyncTrigger = "manual" | "scheduled" | "backfill";

export interface AuditRow {
  id: string;
  trigger: SyncTrigger;
  status: "running" | "success" | "failed" | "skipped";
  fetched: number;
  upserted: number;
  failed: number;
  retryCount: number;
  startedAt: string; // ISO
  finishedAt: string | null;
  errorClass?: "rate_limited" | "sheets_unauthorized" | "mutex_held" | "mapping_unmapped" | "unknown";
  errorReason?: string; // PII redacted
}

export interface DiffSummary {
  fetched: number;
  upserted: number;
  failed: number;
  retryCount: number;
  durationMs: number;
}
```

### API シグネチャ

```ts
// manual
POST /admin/sync/run            (Authorization: Bearer SYNC_ADMIN_TOKEN)
  → 200 { ok: true,  result: AuditRow + DiffSummary }
  → 409 { ok: false, error: "sync_in_progress", auditId }
  → 500 { ok: false, result: AuditRow (status=failed) }

// backfill
POST /admin/sync/backfill       (Authorization: Bearer SYNC_ADMIN_TOKEN)
  → 200/409/500 同上

// audit
GET  /admin/sync/audit?limit=N  (Authorization: Bearer SYNC_ADMIN_TOKEN)
  → 200 { ok: true, items: AuditRow[] }

// scheduled (Workers 内部 handler、HTTP 公開なし)
async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext)
```

## 環境変数とシークレット

| 名前 | 種別 | 配置層 | 既定 |
| --- | --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | secret | Cloudflare Secrets | （未設定時は dev で skip） |
| `SHEETS_SPREADSHEET_ID` | var | wrangler.toml `[vars]` | UBM Form の本番 ID |
| `SYNC_RANGE` | var | wrangler.toml | `Form Responses 1!A1:ZZ10000` |
| `SYNC_MAX_RETRIES` | var | wrangler.toml | `3`（実装は 3 を上限に clamp） |
| `SYNC_ADMIN_TOKEN` | secret | Cloudflare Secrets | manual / backfill / audit Bearer |
| Cron Trigger | wrangler.toml `[triggers] crons` | `0 * * * *`（毎時 0 分） |

> 平文 `.env` への実値書き込みは禁止。`op://Vault/Item/Field` 参照のみを記述し、`scripts/cf.sh` 経由で動的注入する。

## 不変条件適合状況

| # | 不変条件 | 適合実装 |
| --- | --- | --- |
| #1 | schema コード固定回避 | `mapping.ts` が `form_field_aliases` テーブル駆動。stableKey ハードコードなし |
| #2 | consent キー統一 | `extract-consent.ts` で `publicConsent` / `rulesConsent` のみ受理、他は unmapped |
| #3 | responseEmail = system field | `mapping.ts` で system 列として分離、Form 質問列と混在しない |
| #4 | admin 列分離 | `upsert.ts` / `backfill.ts` で `member_status.publish_state` / `is_deleted` / `meeting_sessions` に touch しない |
| #5 | apps/web から D1 直接禁止 | 全ハンドラを `apps/api/src/sync/` に閉じる |
| #6 | GAS prototype 不昇格 | `sheets-client.ts` は fetch + `crypto.subtle` のみ。Node 専用 SDK 不採用 |
| #7 | Sheets を真として backfill | `backfill.ts` が Sheets 全件 fetch → upsert で D1 を Sheets に追従 |

## AC トレース

| AC | 内容 | 実装位置 | テスト |
| --- | --- | --- | --- |
| AC-1 | manual sync handler | `sync/manual.ts` | `manual.test.ts`, `routes/admin/sync.test.ts` |
| AC-2 | backfill truncate-and-reload | `sync/backfill.ts` | `backfill.test.ts` |
| AC-3 | scheduled handler | `sync/scheduled.ts` + `index.ts scheduled()` + `wrangler.toml [triggers]` | `scheduled.test.ts` |
| AC-4 | sync_job_logs running→final | `sync/audit.ts` | `audit.test.ts` |
| AC-5 | mutex 二重実行抑止 | `sync/audit.ts withSyncMutex` + `jobs/sync-lock.ts` | `audit.test.ts withSyncMutex` |
| AC-6 | mapping 31 stableKey 契約 | `sync/mapping.ts` → `jobs/mappers/sheets-to-members.ts` | mapping 既存 test |
| AC-7 | GET /admin/sync/audit | `sync/audit-route.ts` | `audit-route.test.ts` |
| AC-8 | SYNC_ADMIN_TOKEN Bearer 必須 | `middleware/require-sync-admin.ts` | route 群 401 テスト |
| AC-9 | error_reason PII redact | `sync/audit.ts redact` | `audit.test.ts redact` |
| AC-10 | admin 列保護 | `upsert.ts` / `backfill.ts` | `backfill.test.ts` |
| AC-11 | Workers 非互換依存禁止 | `sheets-client.ts` (fetch + crypto.subtle) | `sheets-client.test.ts`, package.json grep |
| AC-12 | exponential backoff (max 3) | `sheets-client.ts fetchWithBackoff` | `sheets-client.test.ts` (500ms→2s→8s) |

## 検証コマンド

```bash
# 1) typecheck
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# 2) unit / contract / route tests (398 件)
mise exec -- pnpm --filter @ubm-hyogo/api test --run

# 3) D1 audit ledger query (local)
bash scripts/cf.sh d1 execute ubm-hyogo-db-local \
  --command "SELECT id,trigger,status,started_at,finished_at FROM sync_job_logs ORDER BY id DESC LIMIT 5" \
  --local

# 4) staging deploy（co-owner: 09b へ事前通知）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 5) cron 一時短縮で scheduled 動作確認
#    wrangler.toml の [triggers] crons を ["* * * * *"] へ一時変更
#    → deploy → 1 分待機 → audit ledger に scheduled row が 1 件以上
```

> `wrangler` 直接呼び出しは禁止（UBM-012）。常に `bash scripts/cf.sh` 経由。

## Phase 11 evidence trace

| Evidence | 参照 |
| --- | --- |
| NON_VISUAL 判定 | `outputs/phase-11/manual-test-result.md` §NON_VISUAL 採用理由 |
| 代替 evidence 実ファイル | `outputs/phase-11/evidence/non-visual-evidence.md` |
| AC × evidence | `outputs/phase-11/main.md` §AC × evidence マトリクス |
| staging smoke relay | `outputs/phase-11/manual-test-result.md` §S-11/S-12 |

## エッジケースと挙動

| ケース | 挙動 |
| --- | --- |
| 同 responseId が 2 回流入 | `upsert.ts` の `ON CONFLICT DO UPDATE` で冪等更新（行数増分 0） |
| consent 値が `publicConsent`/`rulesConsent` 以外 | mapping 段で unmapped 扱い（DB に該当キー以外を保存しない） |
| Sheets 列追加 | `form_field_aliases` 未登録は unmapped として記録（07b で受入判定） |
| cron 重複起動 | `withSyncMutex` の lock 取得失敗で skipped 記録、副作用なし |
| scheduled cursor drift | MVP では取りこぼし防止を優先し、毎時全件 upsert する |
| backfill 取得結果 0 件 | preflight failed として failed 記録。既存 `member_responses` は削除しない |
| 429 / 5xx | `fetchWithBackoff` で 500ms → 2s → 8s（最大 3 回）。超過時 `error_class='rate_limited'` で failed |
| Sheets API 401 | `error_class='sheets_unauthorized'` で failed。secret 再配置で復旧 |
| `SYNC_ADMIN_TOKEN` 未設定 | manual / backfill / audit いずれも 401 / 500（middleware 仕様に依存） |

## 既知の制約と将来作業

| ID | 内容 | 対応 |
| --- | --- | --- |
| TECH-M-04 | `bash scripts/cf.sh dispatch` の wrangler 内部挙動依存。失敗時は cron 表現を `* * * * *` へ一時変更する代替が必要 | runbook に明記、09b へ relay |
| OBS-01 | `sync_job_logs.status='running'` が 30 分以上残った場合の alert | 09b cron monitoring へ relay |
| SCALE-01 | D1 batch / transaction サイズ実測は Phase 5/8 で完了。本番想定 100 行/h で問題なし。10x 増時に再評価 | 将来作業 |
| SCHEMA-01 | Form 改訂時の column drift | 07b form schema diff へ relay |
| METRICS-01 | sync 成功率 / 平均 fetch 時間の dashboard | 09b にて Cloudflare Analytics 連携 |

## PR メッセージ原稿としての利用

本ガイド全体を Phase 13 の PR description のテンプレートとして再利用する。`Refs #67`（Issue は CLOSED 維持・reopen しない）を記述すること。
