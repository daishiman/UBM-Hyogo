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

  // wrangler.toml [vars] ENVIRONMENT
  readonly ENVIRONMENT?: "production" | "staging" | "development";

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
  // UT-26: Sheets API E2E smoke test 用 (dev/staging のみ)
  readonly SMOKE_ADMIN_TOKEN?: string;

  // secrets — 05a: Auth.js v5 + admin gate
  readonly AUTH_SECRET?: string;
  readonly INTERNAL_AUTH_SECRET?: string;

  // secrets / vars — 05b: Magic Link / Auth provider
  readonly AUTH_URL?: string;
  readonly MAIL_PROVIDER_KEY?: string;
  readonly MAIL_FROM_ADDRESS?: string;
}

// 予約欄（本タスク scope 外、後続タスクで `Env` に追加する binding 候補）
// - SESSIONS: KVNamespace            → 05a / 05b で `[[kv_namespaces]]` 追加と同時に
// - OAUTH_CLIENT_ID / SECRET: string → 05a で wrangler secret put と同時に
// - MAGIC_LINK_HMAC_KEY: string      → 05b で wrangler secret put と同時に
// - R2_ARCHIVE: R2Bucket             → 将来 `[[r2_buckets]]` 追加と同時に
