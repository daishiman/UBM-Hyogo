// Worker env 型の正本（issue #112 / 02c follow-up）。
// `apps/api/wrangler.toml` の binding 定義と本ファイルの `Env` interface を
// 一対一対応として運用する。binding 追加・変更時は本ファイルも同 PR で更新する。
//
// 不変条件 #5: D1 への直接アクセスは apps/api に閉じる。
// 本ファイルの `Env` を `apps/web/**` から import すると `scripts/lint-boundaries.mjs`
// が禁止トークン `apps/api/src/env` で error を返す。

import type { SyncEnv } from "./jobs/sync-sheets-to-d1";
import type { ResponseSyncEnv } from "./jobs/sync-forms-responses";

/**
 * Cloudflare Workers の env binding 型。
 *
 * - D1 / vars は `apps/api/wrangler.toml` 起源。
 * - secrets は `wrangler secret put` 起源（toml には現れない）。
 * - 本 interface 直接の field は他に重複定義しない。Sync 系は `SyncEnv` /
 *   `ResponseSyncEnv` を継承して二重管理を回避する。
 */
export interface Env extends SyncEnv, ResponseSyncEnv {
  // wrangler.toml [[d1_databases]] binding = "DB"
  readonly DB: D1Database;

  // wrangler.toml [[analytics_engine_datasets]] binding = "SYNC_ALERTS"
  // 03b-followup-006: per-sync write cap 連続到達検知の event emit 先
  readonly SYNC_ALERTS?: AnalyticsEngineDataset;

  // wrangler.toml [[r2_buckets]] binding = "UBM_AUDIT_COLD_STORAGE"
  // Issue #514: Cloudflare audit log cold storage.
  readonly UBM_AUDIT_COLD_STORAGE?: R2Bucket;

  // wrangler.toml [[r2_buckets]] binding = "UBM_AUDIT_APP_COLD_STORAGE"
  // Issue #315: application audit_log cold storage.
  readonly UBM_AUDIT_APP_COLD_STORAGE?: R2Bucket;

  // wrangler.toml [[queues.producers]] binding = "SCHEMA_ALIAS_BACKFILL_QUEUE"
  // UT-07B-FU-01: schema alias back-fill 継続 job の enqueue 先
  readonly SCHEMA_ALIAS_BACKFILL_QUEUE?: Queue<unknown>;

  // wrangler.toml [vars] ENVIRONMENT
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly RETENTION_PURGE_MODE?: "off" | "dry-run" | "apply";
  readonly RETENTION_PURGE_LIMIT?: string;
  // issue #378: Forms sync -> tag_assignment_queue candidate enqueue emergency stop.
  readonly TAG_QUEUE_PAUSED?: string;

  // Issue #503: schema alias back-fill shadow A/B 用 mode 切替。
  // 値域: "remaining-scan" (default) / "cursor"
  readonly BACKFILL_CURSOR_MODE?: string;

  // wrangler.toml [vars] SHEET_ID / FORM_ID / GOOGLE_FORM_ID
  readonly SHEET_ID?: string;
  readonly FORM_ID?: string;
  readonly GOOGLE_FORM_ID?: string;
  readonly GOOGLE_FORM_RESPONDER_URL?: string;

  // secrets (wrangler secret put) — Google Forms / Sheets service account
  readonly GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  readonly GOOGLE_PRIVATE_KEY?: string;
  readonly FORMS_SA_EMAIL?: string;
  readonly FORMS_SA_KEY?: string;

  // secrets — admin / sync gate tokens
  readonly SYNC_ADMIN_TOKEN?: string;
  readonly HEALTH_DB_TOKEN?: string;
  // smoke routes: Sheets is dev/staging only; observability also supports production with an explicit confirm header.
  readonly SMOKE_ADMIN_TOKEN?: string;

  // secrets — 09b-A: observability runtime smoke (staging + production provider smoke)
  readonly SENTRY_DSN_API?: string;
  readonly SLACK_WEBHOOK_INCIDENT?: string;
  readonly SLACK_WORKFLOW_URL?: string;

  // secrets — 05a: Auth.js v5 + admin gate
  readonly AUTH_SECRET?: string;
  readonly INTERNAL_AUTH_SECRET?: string;

  // secrets / vars — 05b: Magic Link / Auth provider
  readonly AUTH_URL?: string;
  readonly MAIL_PROVIDER_KEY?: string;
  readonly MAIL_FROM_ADDRESS?: string;

  // Issue #553 — live audit-correlation endpoint
  // secrets (wrangler secret put) — 1Password 参照経由で注入する
  readonly GITHUB_AUDIT_PAT?: string;
  readonly SLACK_AUDIT_INCIDENT_WEBHOOK_URL?: string;
  readonly AUDIT_CORRELATION_SALT?: string;
  readonly AUDIT_CORRELATION_INTERNAL_TOKEN?: string;
  // vars — 公開 runbook URL / GitHub org slug
  readonly AUDIT_CORRELATION_RUNBOOK_BASE_URL?: string;
  readonly AUDIT_CORRELATION_GITHUB_ORG?: string;

  // UT-17 — Cloudflare Notifications generic webhook → Slack 日本語化リレー
  // 1Password 正本 → Cloudflare Secrets（`bash scripts/cf.sh secret put` 経由）
  readonly CF_WEBHOOK_AUTH_SECRET?: string;
  readonly SLACK_WEBHOOK_URL?: string;
  readonly SLACK_WEBHOOK_URL_HEALTHCHECK?: string;
  readonly HEALTHCHECK_FALLBACK_EMAIL?: string;
  readonly RESEND_API_KEY?: string;
  // vars — Slack message links shown in UT-17 alert cards
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;

  // ut-17-followup-002: alert-relay dedup を isolate 跨ぎで永続化する KV namespace。
  // wrangler.toml の `[[env.{staging,production}.kv_namespaces]]` で binding = "ALERT_DEDUP_KV" を割当てる。
  readonly ALERT_DEDUP_KV: KVNamespace;
}

// 予約欄（本タスク scope 外、後続タスクで `Env` に追加する binding 候補）
// - SESSIONS: KVNamespace            → 05a / 05b で `[[kv_namespaces]]` 追加と同時に
// - OAUTH_CLIENT_ID / SECRET: string → 05a で wrangler secret put と同時に
// - MAGIC_LINK_HMAC_KEY: string      → 05b で wrangler secret put と同時に
// - R2_ARCHIVE: R2Bucket             → 将来 `[[r2_buckets]]` 追加と同時に
