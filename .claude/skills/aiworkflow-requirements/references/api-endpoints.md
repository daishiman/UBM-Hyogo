# API エンドポイント一覧

> 本ドキュメントは統合システム設計仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/

---

## 概要

本ドキュメントはAIWorkflowOrchestratorプロジェクトのAPIエンドポイントのインデックスです。
REST API、Desktop IPC APIの詳細は以下の分割ドキュメントで定義しています。

---

## ドキュメント構成

| カテゴリ               | ファイル                                     | 説明                                |
| ---------------------- | -------------------------------------------- | ----------------------------------- |
| 認証・プロフィールIPC  | [api-ipc-auth.md](./api-ipc-auth.md)         | OAuth認証、プロフィール管理IPC      |
| Agent・Chat Edit IPC   | [api-ipc-agent.md](./api-ipc-agent.md)       | スキル管理、ワークスペースチャット  |
| システムIPC・AIプロバイダー | [api-ipc-system.md](./api-ipc-system.md) | AI/チャット、スライド同期、APIキー  |

---

## REST API エンドポイント一覧

### ワークフロー管理

| メソッド | パス                          | 説明                   | 認証 |
| -------- | ----------------------------- | ---------------------- | ---- |
| POST     | /api/v1/workflows             | ワークフロー作成       | 必要 |
| GET      | /api/v1/workflows             | ワークフロー一覧取得   | 必要 |
| GET      | /api/v1/workflows/{id}        | ワークフロー詳細取得   | 必要 |
| PATCH    | /api/v1/workflows/{id}        | ワークフロー更新       | 必要 |
| DELETE   | /api/v1/workflows/{id}        | ワークフロー削除       | 必要 |
| POST     | /api/v1/workflows/{id}/retry  | ワークフローリトライ   | 必要 |
| POST     | /api/v1/workflows/{id}/cancel | ワークフローキャンセル | 必要 |

### Local Agent API

| メソッド | パス                    | 説明                 | 認証  |
| -------- | ----------------------- | -------------------- | ----- |
| POST     | /api/v1/agent/sync      | ファイル同期         | Agent |
| POST     | /api/v1/agent/execute   | ワークフロー実行     | Agent |
| GET      | /api/v1/agent/status    | エージェント状態確認 | Agent |
| POST     | /api/v1/agent/heartbeat | ハートビート         | Agent |

### ユーザー設定

| メソッド | パス                  | 説明             | 認証 |
| -------- | --------------------- | ---------------- | ---- |
| GET      | /api/v1/settings      | ユーザー設定取得 | 必要 |
| PATCH    | /api/v1/settings      | ユーザー設定更新 | 必要 |
| GET      | /api/v1/api-keys      | APIキー一覧取得  | 必要 |
| POST     | /api/v1/api-keys      | APIキー登録      | 必要 |
| DELETE   | /api/v1/api-keys/{id} | APIキー削除      | 必要 |

### システム

| メソッド | パス           | 説明           | 認証 |
| -------- | -------------- | -------------- | ---- |
| GET      | /api/health    | ヘルスチェック | 不要 |
| GET      | /api/v1/status | 詳細ステータス | 必要 |

### UBM-Hyogo Health API（UT-06-FU-H）

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| GET | `/health/db` | API Worker から D1 binding に `SELECT 1` を実行し、DB 疎通を確認する | `X-Health-Token: <HEALTH_DB_TOKEN>` + Cloudflare WAF allowlist / rate limit |

レスポンス契約:

| Status | 条件 | Body | Headers |
| --- | --- | --- | --- |
| 200 | token 一致、D1 `SELECT 1` 成功 | `{ ok: true, db: "ok", check: "SELECT 1" }` | `Content-Type: application/json` |
| 401 | WAF allowlist 内で `X-Health-Token` 欠落または不一致 | `{ ok: false, error: "unauthorized" }` | - |
| 403 | WAF allowlist 外または rate limit block | Cloudflare WAF response | Cloudflare WAF response |
| 503 | `HEALTH_DB_TOKEN` 未設定、D1 binding 欠落、D1 `SELECT 1` 失敗 | `{ ok: false, db: "error", error: string }` | `Retry-After: 30` |

`/health` は API Worker / runtime foundation の軽量 health、`/health/db` は D1 疎通 health として SLO を分離する。`/health/db` は `apps/api` に閉じ、`apps/web` から D1 binding を直接参照しない。

### 管理同期 API（apps/api）

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| POST | /admin/sync | Google Sheets 由来の既存同期ジョブを手動実行 | `SYNC_ADMIN_TOKEN` Bearer |
| POST | /admin/sync/responses | Google Forms `forms.responses.list` を D1 に取り込み、`current_response_id` と consent snapshot を更新 | `SYNC_ADMIN_TOKEN` Bearer |

`POST /admin/sync/responses` は `fullSync=true` と `cursor=<submittedAt|responseId>` を query として受け付ける。`cursor` は Google API の `pageToken` ではなく、処理済み response の high-water mark として扱う。二重起動時は `409 Conflict` を返す。

### 管理バックオフィス API（apps/api / 04c）

`04c-parallel-admin-backoffice-api-endpoints` で、admin UI と後続 workflow が利用する `/admin/*` バックオフィス API を追加した。04c 時点の認可は `SYNC_ADMIN_TOKEN` Bearer gate で、05a で Auth.js + `admin_users` active 判定へ差し替える。

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| GET | `/admin/dashboard` | 会員・同意・削除済み・タグ queue・schema 状態の dashboard 集計 | `SYNC_ADMIN_TOKEN` Bearer |
| GET | `/admin/members` | admin member list。`filter=active|hidden|deleted` を受け付ける | `SYNC_ADMIN_TOKEN` Bearer |
| GET | `/admin/members/:memberId` | admin member detail。admin notes は detail にのみ含める | `SYNC_ADMIN_TOKEN` Bearer |
| PATCH | `/admin/members/:memberId/status` | publish state / hidden reason を更新する | `SYNC_ADMIN_TOKEN` Bearer |
| POST | `/admin/members/:memberId/notes` | admin note を作成する | `SYNC_ADMIN_TOKEN` Bearer |
| PATCH | `/admin/members/:memberId/notes/:noteId` | admin note を更新する | `SYNC_ADMIN_TOKEN` Bearer |
| POST | `/admin/members/:memberId/delete` | member を論理削除する | `SYNC_ADMIN_TOKEN` Bearer |
| POST | `/admin/members/:memberId/restore` | 論理削除済み member を復元する | `SYNC_ADMIN_TOKEN` Bearer |
| GET | `/admin/tags/queue` | tag assignment queue を一覧する | `SYNC_ADMIN_TOKEN` Bearer |
| POST | `/admin/tags/queue/:queueId/resolve` | queue item を `queued -> reviewing -> resolved` で解決する | `SYNC_ADMIN_TOKEN` Bearer |
| GET | `/admin/schema/diff` | schema diff queue を一覧する | `SYNC_ADMIN_TOKEN` Bearer |
| POST | `/admin/schema/aliases` | question stable key alias を解決する | `SYNC_ADMIN_TOKEN` Bearer |
| GET | `/admin/meetings` | meeting sessions と attendance summary を一覧する | `SYNC_ADMIN_TOKEN` Bearer |
| POST | `/admin/meetings` | meeting session を作成する | `SYNC_ADMIN_TOKEN` Bearer |
| POST | `/admin/meetings/:sessionId/attendance` | attendance を追加する。重複は `409`、削除済み member は `422` | `SYNC_ADMIN_TOKEN` Bearer |
| DELETE | `/admin/meetings/:sessionId/attendance/:memberId` | attendance を削除する | `SYNC_ADMIN_TOKEN` Bearer |

04c の構造的不変条件:

- `PATCH /admin/members/:memberId/profile` は作らない。管理者は本人プロフィール本文を直接編集しない。
- `PATCH /admin/members/:memberId/tags` は作らない。タグ確定は queue resolve 経由に限定する。
- schema 変更は `/admin/schema/*` に集約する。
- `admin_member_notes` は public/member view model へ混入させない。
- mutation は `audit_log` append を通す。

### 認証 API（apps/api / 05b）

`05b-parallel-magic-link-provider-and-auth-gate-state` で、Magic Link 発行・検証と login gate 判定を `/auth/*` に追加した。`apps/web` は同 origin `/api/auth/*` proxy だけを持ち、D1 には直接接続しない。`/no-access` 専用 route は作らず、login UI が state/reason JSON を表示に変換する。

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| GET | `/auth/gate-state?email=...` | email から login gate を判定する。`ok` / `unregistered` / `rules_declined` / `deleted` を返し、memberId は返さない | 不要（IP 60/h rate limit） |
| POST | `/auth/magic-link` | gate state が `ok` の時だけ `magic_tokens` を発行し、Magic Link mail を送る。gate 結果は 200 + `sent` / `unregistered` / `rules_declined` / `deleted`、mail 失敗は 502 + `MAIL_FAILED` | 不要（email 5/h + IP 30/h rate limit） |
| POST | `/auth/magic-link/verify` | token と email を検証し、成功時に `SessionUser` を返す。失敗 reason は `not_found` / `expired` / `already_used` / `resolve_failed` | 不要（token 検証） |
| POST | `/auth/resolve-session` | Auth.js callback / credentials bridge 用に email から `SessionUser` を解決する | 内部利用想定 |

05b の構造的不変条件:

- `magic_tokens` は apps/api repository だけが触る。apps/web は proxy fetch のみ。
- token TTL は 900 秒、token 形式は 64 hex、consume は optimistic lock で 1 回限り。
- mail 送信に失敗した場合は発行済み token を `deleteByToken` で rollback し、502 `{code:"MAIL_FAILED"}` を返す。
- gate 判定優先度は `unregistered -> deleted -> rules_declined -> ok`。
- `/no-access` route と redirect は作らない。API は JSON state/reason を返す。

### 公開ディレクトリ API（apps/api / 04a）

`04a-parallel-public-directory-api-endpoints` で未認証の公開 API を追加した。`/public/*` には session middleware を適用しない。

| メソッド | パス | 説明 | 認証 | Cache-Control |
| --- | --- | --- | --- | --- |
| GET | `/public/stats` | 公開 KPI、zone / membership breakdown、今年の支部会数、直近支部会、schema / response sync 状態 | 不要 | `public, max-age=60` |
| GET | `/public/members` | 公開会員一覧。`q / zone / status / tag / sort / density / page / limit` を受け付ける | 不要 | `no-store` |
| GET | `/public/members/:memberId` | 公開会員プロフィール。公開同意・公開状態・未削除を満たさない member は 404 | 不要 | `no-store` |
| GET | `/public/form-preview` | `schema_questions` 由来のフォームプレビューと responder URL | 不要 | `public, max-age=60` |

公開 member の基本条件は `public_consent='consented' AND publish_state='public' AND is_deleted=0`。profile / list response は `responseEmail` / `rulesConsent` / `adminNotes` を含めない。`/public/members` の `tag` は repeated query を AND 条件として扱い、`limit` は 1〜100 に clamp する。

### チャット履歴

| メソッド | パス                           | 説明                   | 認証 |
| -------- | ------------------------------ | ---------------------- | ---- |
| GET      | /api/v1/sessions               | セッション一覧取得     | 必要 |
| GET      | /api/v1/sessions/{id}          | セッション詳細取得     | 必要 |
| POST     | /api/v1/sessions               | セッション作成         | 必要 |
| PATCH    | /api/v1/sessions/{id}          | セッション更新         | 必要 |
| DELETE   | /api/v1/sessions/{id}          | セッション削除         | 必要 |
| GET      | /api/v1/sessions/{id}/messages | メッセージ一覧取得     | 必要 |
| POST     | /api/v1/sessions/{id}/messages | メッセージ追加         | 必要 |
| GET      | /api/v1/sessions/{id}/export   | セッションエクスポート | 必要 |
| POST     | /api/v1/sessions/export/batch  | 一括エクスポート       | 必要 |

---

## エンドポイント命名規則

### 命名パターン

| パターン     | 例                           | 説明             |
| ------------ | ---------------------------- | ---------------- |
| コレクション | /api/v1/workflows            | 複数形を使用     |
| 個別リソース | /api/v1/workflows/{id}       | ID指定           |
| サブリソース | /api/v1/workflows/{id}/steps | 親子関係         |
| アクション   | /api/v1/workflows/{id}/retry | 動詞が必要な操作 |

### 禁止パターン

| パターン                 | 理由              | 正しい例               |
| ------------------------ | ----------------- | ---------------------- |
| /api/v1/getWorkflows     | URLに動詞を含める | /api/v1/workflows      |
| /api/v1/workflow         | 単数形を使用      | /api/v1/workflows      |
| /api/v1/workflows/create | POSTで十分        | POST /api/v1/workflows |

---

## UBM-Hyogo Admin Sync API（03a）

`03a-parallel-forms-schema-sync-and-stablekey-alias-queue` で schema sync の手動入口を追加した。

| Method | Path | 認可 | 用途 |
| ------ | ---- | ---- | ---- |
| POST | `/admin/sync/schema` | `Authorization: Bearer <SYNC_ADMIN_TOKEN>` | Google Forms `forms.get` の live schema を D1 の `schema_versions` / `schema_questions` に同期し、stableKey 未解決 question を `schema_diff_queue` へ投入する |

レスポンス契約:

| Status | 条件 | Body |
| ------ | ---- | ---- |
| 200 | 同期成功 | `{ ok: true, jobId, status: "succeeded", revisionId, upserted, diffEnqueued }` |
| 401 | Authorization header なし | `{ ok: false, error: "unauthorized" }` |
| 403 | Bearer token 不一致 | `{ ok: false, error: "forbidden" }` |
| 409 | `schema_sync` job が既に `running` | `{ ok: false, status: "conflict", error }` |
| 500 | env 未設定 / Forms API / D1 失敗 | `{ ok: false, status?: "failed", error }` |

実装: `apps/api/src/routes/admin/sync-schema.ts` / `apps/api/src/sync/schema/`。

---

## UBM-Hyogo Member Self-Service API（04b）

`04b-parallel-member-self-service-api-endpoints` で会員本人向け `/me/*` endpoint を追加した。
Auth.js cookie resolver は 05a/05b で差し替える。04b 時点の dev token は `x-ubm-dev-session: 1`
がある development request のみ有効で、production / staging では無効。

| Method | Path | 認可 | 用途 |
| ------ | ---- | ---- | ---- |
| GET | `/me` | session 必須 | `SessionUser` と `authGateState` (`active` / `rules_declined` / `deleted`) を返す |
| GET | `/me/profile` | session 必須 | `MemberProfile`、status summary、`editResponseUrl`、`fallbackResponderUrl` を返す |
| POST | `/me/visibility-request` | session + `authGateState=active` | `admin_member_notes.note_type='visibility_request'` として admin queue に投入 |
| POST | `/me/delete-request` | session + `authGateState=active` | `admin_member_notes.note_type='delete_request'` として admin queue に投入 |

禁止: `PATCH /me/profile` は作らない。`/me/*` path に `:memberId` を入れない。GET 系 response に
`admin_member_notes` 由来の `notes` / `adminNotes` を含めない。

---

## Desktop IPC API サマリー

### 主要IPCチャンネル

| カテゴリ       | チャンネル例           | 詳細                                 |
| -------------- | ---------------------- | ------------------------------------ |
| 認証           | auth:login, auth:logout | [api-ipc-auth.md](./api-ipc-auth.md) |
| プロフィール   | profile:get, profile:update | [api-ipc-auth.md](./api-ipc-auth.md) |
| Agent          | agent:execute, agent:get-skills | [api-ipc-agent.md](./api-ipc-agent.md) |
| Skill実行      | skill:execute, skill:stream, skill:abort, skill:get-status, skill:complete, skill:error | [interfaces-agent-sdk-skill.md](./interfaces-agent-sdk-skill.md) |
| Skill権限      | skill:permission-request, skill:permission-response | [interfaces-agent-sdk-skill.md](./interfaces-agent-sdk-skill.md) |
| Skill管理      | skill:list, skill:get-imported, skill:scan, skill:import, skill:remove | [interfaces-agent-sdk-skill.md](./interfaces-agent-sdk-skill.md) |
| Chat Edit      | chat-edit:send-with-context | [api-ipc-agent.md](./api-ipc-agent.md) |
| AI/チャット    | AI_CHAT, AI_INDEX, llm:set-selected-config | [api-ipc-system.md](./api-ipc-system.md) |
| Notification   | notification:get-history, notification:mark-read, notification:mark-all-read, notification:delete, notification:clear, notification:new | [api-ipc-system.md](./api-ipc-system.md) |
| HistorySearch  | history:search, history:get-stats | [api-ipc-system.md](./api-ipc-system.md) |
| スライド同期   | slide:sync-status      | [api-ipc-system.md](./api-ipc-system.md) |
| APIキー管理    | apiKey:save, apiKey:validate | [api-ipc-system.md](./api-ipc-system.md) |
| SDK認証キー    | auth-key:set, auth-key:exists, auth-key:validate, auth-key:delete | [api-ipc-system.md](./api-ipc-system.md) |

### IPC設計原則

| 原則                   | 説明                                     |
| ---------------------- | ---------------------------------------- |
| contextIsolation       | Preloadスクリプトでのみ通信APIを公開     |
| チャネルホワイトリスト | 許可されたチャネルのみ通信可能           |
| sender検証             | withValidation()でリクエスト元を検証     |
| 型安全性               | 全チャネルに対してTypeScript型定義を適用 |

---

## 変更履歴

| Version | Date       | Changes                                            |
| ------- | ---------- | -------------------------------------------------- |
| 2.8.0   | 2026-04-29 | UT-06-FU-H: `GET /health/db` D1 疎通 health API 契約を追加 |
| 2.7.0   | 2026-04-29 | 04a: 公開ディレクトリ API 4 endpoint を追加 |
| 2.6.0   | 2026-04-29 | 03b: `POST /admin/sync/responses` 管理同期 API を追加 |
| 2.5.0   | 2026-03-11 | TASK-FIX-APIKEY-CHAT-TOOL-INTEGRATION-001: Desktop IPC API サマリーの AI/チャットへ `llm:set-selected-config` を追加 |
| 2.4.0   | 2026-03-11 | TASK-UI-08-NOTIFICATION-CENTER: Notification IPC サマリーに `notification:delete` を追加し、058e の個別削除契約へ同期 |
| 2.3.0   | 2026-03-05 | TASK-UI-01-C-NOTIFICATION-HISTORY-DOMAIN: Notification（5チャネル）/ HistorySearch（2チャネル）をDesktop IPC APIサマリーへ追加 |
| 2.2.0   | 2026-02-08 | TASK-FIX-16-1: SDK認証キーIPCチャンネル4種をDesktop IPC APIサマリーに追加 |
| 2.1.0   | 2026-02-06 | TASK-FIX-5-1: Skill IPC チャンネル（実行/権限/管理 13チャネル）をDesktop IPC APIサマリーに追加 |
| 2.0.0   | 2026-01-26 | 3ファイルに分割（875行→インデックス+詳細ファイル） |
| 1.0.0   | 2026-01-25 | 初版作成                                           |

---

## 関連ドキュメント

- [アーキテクチャパターン](./architecture-patterns.md)
- [セキュリティ設計](./security-api-electron.md)
- [LLMインターフェース](./interfaces-llm.md)
