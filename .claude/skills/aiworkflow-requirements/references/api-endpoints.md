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

### 管理同期 API（apps/api）

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| POST | /admin/sync | Google Sheets 由来の既存同期ジョブを手動実行（互換 mount） | `SYNC_ADMIN_TOKEN` Bearer |
| POST | /admin/sync/run | u-04 正本 manual sync。Google Sheets 回答を fetch → map → D1 upsert し、`sync_job_logs` に audit row を作成する | `SYNC_ADMIN_TOKEN` Bearer |
| POST | /admin/sync/backfill | u-04 backfill。Sheets 全件を正として `member_responses` を再投入する。admin-managed 列には触れない | `SYNC_ADMIN_TOKEN` Bearer |
| GET | /admin/sync/audit?limit=N | u-04 audit ledger の最新行を `started_at DESC` で返す。limit は 1〜100 に clamp | `SYNC_ADMIN_TOKEN` Bearer |
| POST | /admin/sync/responses | Google Forms `forms.responses.list` を D1 に取り込み、`current_response_id` と consent snapshot を更新 | `SYNC_ADMIN_TOKEN` Bearer |
| GET | /admin/smoke/sheets | Google Sheets API v4 `spreadsheets.values.get` の dev/staging E2E smoke。production は 404 | `SMOKE_ADMIN_TOKEN` Bearer |

u-04 (`docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/`) では `apps/api/src/sync/` を正本実装とする。manual / scheduled / backfill の 3 経路は `withSyncMutex` で直列化し、論理 `sync_audit` の物理 ledger である `sync_job_logs` に `running -> success|failed|skipped` を記録する。scheduled sync は HTTP endpoint ではなく Cloudflare Workers `scheduled()` handler から `runScheduledSync(env)` を呼び出し、MVP では timestamp drift を避けるため毎時全件 upsert する。

`POST /admin/sync/responses` は `fullSync=true` と `cursor=<submittedAt|responseId>` を query として受け付ける。`cursor` は Google API の `pageToken` ではなく、処理済み response の high-water mark として扱う。二重起動時は `409 Conflict` を返す。

### 管理バックオフィス API（apps/api / 04c）

`04c-parallel-admin-backoffice-api-endpoints` で、admin UI と後続 workflow が利用する `/admin/*` バックオフィス API を追加した。05a で人間向けバックオフィス API の認可は Auth.js 共有 HS256 JWT + `admin_users.active` 判定に差し替え済み。同期ジョブ API のみ `SYNC_ADMIN_TOKEN` Bearer gate を維持する。

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| GET | `/admin/dashboard` | 会員・同意・削除済み・タグ queue・schema 状態の dashboard 集計 | Auth.js JWT + `requireAdmin` |
| GET | `/admin/members` | admin member list。`filter=active|hidden|deleted` を受け付ける | Auth.js JWT + `requireAdmin` |
| GET | `/admin/members/:memberId` | admin member detail。admin notes は detail にのみ含める | Auth.js JWT + `requireAdmin` |
| PATCH | `/admin/members/:memberId/status` | publish state / hidden reason を更新する | Auth.js JWT + `requireAdmin` |
| POST | `/admin/members/:memberId/notes` | admin note を作成する | Auth.js JWT + `requireAdmin` |
| PATCH | `/admin/members/:memberId/notes/:noteId` | admin note を更新する | Auth.js JWT + `requireAdmin` |
| POST | `/admin/members/:memberId/delete` | member を論理削除する | Auth.js JWT + `requireAdmin` |
| POST | `/admin/members/:memberId/restore` | 論理削除済み member を復元する | Auth.js JWT + `requireAdmin` |
| GET | `/admin/tags/queue` | tag assignment queue を一覧する | Auth.js JWT + `requireAdmin` |
| POST | `/admin/tags/queue/:queueId/resolve` | queue item を `confirmed`（DB/API status: `resolved`）または `rejected` に解決する | Auth.js JWT + `requireAdmin` |
| GET | `/admin/schema/diff` | schema diff queue を一覧する | Auth.js JWT + `requireAdmin` |
| POST | `/admin/schema/aliases` | question stable key alias を解決する | Auth.js JWT + `requireAdmin` |
| GET | `/admin/meetings` | meeting sessions と attendance summary（既存出席 memberId）を一覧する | Auth.js JWT + `requireAdmin` |
| POST | `/admin/meetings` | meeting session を作成する | Auth.js JWT + `requireAdmin` |
| GET | `/admin/meetings/:sessionId/attendance/candidates` | attendance 候補を一覧する。session 不在は `404 session_not_found`、削除済み member と登録済み member は除外する | Auth.js JWT + `requireAdmin` |
| POST | `/admin/meetings/:sessionId/attendance` | attendance を追加する。重複は `409 attendance_already_recorded`、削除済み member は `422 member_is_deleted`、session 不在は `404 session_not_found` | Auth.js JWT + `requireAdmin` |
| DELETE | `/admin/meetings/:sessionId/attendance/:memberId` | attendance を削除する。row 不在は `404 attendance_not_found` に集約する | Auth.js JWT + `requireAdmin` |
| GET | `/admin/audit` | `audit_log` を read-only に検索する。`action` / `actorEmail` / `targetType` / `targetId` / UTC `from` `to` / cursor / limit を受け、raw JSON ではなく masked view を返す | Auth.js JWT + `requireAdmin` |

04c の構造的不変条件:

- `PATCH /admin/members/:memberId/profile` は作らない。管理者は本人プロフィール本文を直接編集しない。
- `PATCH /admin/members/:memberId/tags` は作らない。タグ確定は queue resolve 経由に限定する。
- schema 変更は `/admin/schema/*` に集約する。
- `admin_member_notes` は public/member view model へ混入させない。
- mutation は `audit_log` append を通す。
- 07c attendance add/remove は `attendance.add` / `attendance.remove` を `target_type='meeting'`, `target_id=<sessionId>` で append し、POST は `after_json`、DELETE は `before_json` に attendance row を残す。
- 07c follow-up audit browsing は append-only の閲覧専用で、`before_json` / `after_json` の保存値は変更せず、API projection と UI defense-in-depth で email / phone / address / name 相当キーを表示時 masking する。cursor は `{ createdAt, auditId }` の base64url JSON、order は `created_at DESC, audit_id DESC`。

07a close-out で `POST /admin/tags/queue/:queueId/resolve` の body は zod discriminated union に確定した。

```ts
type TagQueueResolveBody =
  | { action: "confirmed"; tagCodes: string[] }
  | { action: "rejected"; reason: string };
```

UT-07A-02 close-out で schema 正本は `packages/shared/src/schemas/admin/tag-queue-resolve.ts` の `tagQueueResolveBodySchema` に移された。apps/api route と apps/web admin client はこの shared schema/type を参照する。`confirmed` と `rejected` の key を混在させた body は 400 `validation_error`。

成功時は `{ ok: true, result: { queueId, status: "resolved" | "rejected", resolvedAt, memberId, tagCodes?, reason?, idempotent } }` を返す。同一 payload の再投入は 200 + `idempotent: true` で追加 audit を作らない。主要 error code は `queue_not_found` (404), `state_conflict` / `idempotent_payload_mismatch` / `race_lost` (409), `unknown_tag_code` / `member_deleted` (422), body validation (400)。

07b schema alias workflow close-out:

- `GET /admin/schema/diff` は `items[].recommendedStableKeys: string[]` を返す。候補は既存 `schema_questions.stable_key` から、label の Levenshtein 距離 + section / position 一致スコアで上位 5 件を提示する。
- `POST /admin/schema/aliases?dryRun=true` は書き込みを行わず、`affectedResponseFields` / `currentStableKeyCount` / `conflictExists` を返す。dry-run では `audit_log` も追記しない。
- `POST /admin/schema/aliases` apply mode は `schema_aliases` へ manual alias を INSERT し、任意 `diffId` の `schema_diff_queue` resolve、`response_fields.stable_key='__extra__:<questionId>'` の back-fill、`audit_log.action='schema_diff.alias_assigned'` 追記を同じ workflow 境界で実行する。`schema_questions.stable_key` は fallback 期間の参照互換として残し、manual alias の主 write target には戻さない。
- collision は同一 `revision_id` 内の別 `question_id` が同じ stableKey を持つ場合に `409 stable_key_collision` を返す。body validation は `422`、diff 不在は `404`、diff と request question mismatch は `409`。
- back-fill は batch 100 / CPU budget 25s を上限とし、`deleted_members` に紐づく `member_identities.current_response_id` は対象外にする。既に同 response に新 stableKey 行がある場合は extra 行を削除して冪等性を保つ。CPU budget exhausted は HTTP 202 + retryable body とし、`backfill.status='exhausted'`、`code='backfill_cpu_budget_exhausted'`、`retryable=true`、`queueStatus='resolved'` を返す。`schema_diff_queue.backfill_status` / `backfill_cursor` は continuation 状態を保持し、`exhausted` / `in_progress` / `failed` の diff は再実行対象として一覧可能にする。

### 認証セッション解決 API（apps/api / 05a）

05a で Auth.js Google OAuth callback から呼ばれる内部 endpoint を追加した。apps/web は D1 を直接参照せず、この endpoint だけを経由して `member_identities` / `member_status` / `admin_users` を解決する。

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| GET | `/auth/session-resolve?email=<email>` | OAuth email を正規化し、`memberId` / `isAdmin` / `gateReason` を返す | `X-Internal-Auth: INTERNAL_AUTH_SECRET` |

レスポンス:

```ts
type GateReason = "unregistered" | "deleted" | "rules_declined";
type SessionResolveResponse = {
  memberId: string | null;
  isAdmin: boolean;
  gateReason: GateReason | null;
};
```

### Magic Link callback / Auth.js Credentials Provider（apps/web / 05b-B）

05b-B で Magic Link メール本文の callback URL を `apps/web` に実装した。apps/web は D1 を直接参照せず、token/email の検証は apps/api の `POST /auth/magic-link/verify` に委譲する。

| メソッド | パス | 説明 | 認証 |
| --- | --- | --- | --- |
| GET | `/api/auth/callback/email?token=<64hex>&email=<email>` | query validation 後、`POST /auth/magic-link/verify` を呼び、成功時のみ Auth.js `signIn("magic-link")` で session cookie を確立する | Magic Link token/email |
| POST | `/api/auth/callback/email` | callback route の POST は許可しない | 405 |
| POST | `/auth/magic-link/verify` | Magic Link token/email を検証・消費し、session user shape を返す | Magic Link token/email（public token endpoint）。`/auth/session-resolve` の `X-Internal-Auth` 境界とは別 |

失敗時は session を作らず `/login?error=<code>` に戻す。error code は `missing_token`, `missing_email`, `invalid_link`, `expired`, `already_used`, `resolve_failed`, `temporary_failure`。

Auth.js session cookie は 05a で共有 HS256 JWT に固定し、`packages/shared/src/auth.ts` の `encodeAuthSessionJwt` / `decodeAuthSessionJwt` と API 側 `verifySessionJwt` が同じ `AUTH_SECRET` を使う。JWT には `memberId` / `email` / `isAdmin` のみを含め、`responseId` やプロフィール本文は含めない。

### 公開ディレクトリ API（apps/api / 04a）

`04a-parallel-public-directory-api-endpoints` で未認証の公開 API を追加した。`/public/*` には session middleware を適用しない。

| メソッド | パス | 説明 | 認証 | Cache-Control |
| --- | --- | --- | --- | --- |
| GET | `/public/stats` | 公開 KPI、zone / membership breakdown、今年の支部会数、直近支部会、schema / response sync 状態 | 不要 | `public, max-age=60` |
| GET | `/public/members` | 公開会員一覧。`q / zone / status / tag / sort / density / page / limit` を受け付ける | 不要 | `no-store` |
| GET | `/public/members/:memberId` | 公開会員プロフィール。公開同意・公開状態・未削除を満たさない member は 404 | 不要 | `no-store` |
| GET | `/public/form-preview` | `schema_questions` 由来のフォームプレビューと responder URL | 不要 | `public, max-age=60` |

公開 member の基本条件は `public_consent='consented' AND publish_state='public' AND is_deleted=0`。profile / list response は `responseEmail` / `rulesConsent` / `adminNotes` を含めない。`/public/members` の `tag` は repeated query を AND 条件として扱い、`limit` は 1〜100 に clamp する。

`GET /admin/smoke/sheets` は UT-26 の NON_VISUAL smoke route。`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` を読み取り専用で使い、2 回連続 `fetchRange()` の間に OAuth token fetch が 1 回だけであることを `tokenFetchesDuringSmoke=1` として返す。`range` query は 80 文字以内の単一 A1 range のみ許可する。

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

### Schema Alias Resolution（issue-191 / 07b）

| Method | Path | 認可 | 用途 |
| ------ | ---- | ---- | ---- |
| POST | `/admin/schema/aliases` | Auth.js admin JWT + `admin_users.active` | 07b の manual alias resolution。HTTP contract は維持し、issue-191 以降の write target は `schema_questions.stable_key` direct update ではなく `schema_aliases` INSERT + `schema_diff_queue.status='resolved'` |

03a は `schema_aliases` first、alias miss の場合のみ `schema_questions.stable_key` fallback とする。D1 transient error は alias miss と扱わず、sync failure + retry へ倒す。

UT-07B hardening では、`schema_aliases` INSERT 後の back-fill が Workers CPU budget を使い切った場合、HTTP 202 の retryable continuation として `backfill_cpu_budget_exhausted` を返す。5xx は infrastructure failure に予約し、継続可能な back-fill state には使わない。

`POST /admin/schema/aliases` レスポンス契約:

| Status | 条件 | Body |
| ------ | ---- | ---- |
| 200 | dry-run 成功 | `{ ok: true, mode: "dryRun", questionId, currentStableKey, proposedStableKey, affectedResponseFields, currentStableKeyCount, conflictExists }` |
| 200 | apply 成功 + back-fill completed | `{ ok: true, mode: "apply", questionId, oldStableKey, newStableKey, affectedResponseFields, queueStatus: "resolved", backfill: { status: "completed", updated, cursor: null, retryable: false } }` |
| 202 | apply 成功 + back-fill continuation required | `{ ok: true, mode: "apply", questionId, oldStableKey, newStableKey, affectedResponseFields, queueStatus: "resolved", backfill: { status: "exhausted", updated, cursor, code: "backfill_cpu_budget_exhausted", retryable: true } }` |
| 404 | question / diff 不在 | `{ ok: false, error }` |
| 409 | diff question mismatch / stable key collision | `{ ok: false, code?: "stable_key_collision", error, existingQuestionIds? }` |
| 422 | body validation failure | `{ ok: false, error }` |

### UBM-Hyogo Admin Schema Sync API（03a）

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
| GET | `/me/profile` | session 必須 | `MemberProfile`、status summary、`editResponseUrl`、`fallbackResponderUrl` を返す。`MemberProfile.attendance` は `createAttendanceProvider(ctx)` 経由で `member_attendance` + `meeting_sessions` から取得する |
| POST | `/me/visibility-request` | session + `authGateState=active` | `admin_member_notes.note_type='visibility_request'` として admin queue に投入。投入時 `request_status='pending'` で記録され、admin が resolve / reject 後は pending 行が無くなるため再申請可能 |
| POST | `/me/delete-request` | session + `authGateState=active` | `admin_member_notes.note_type='delete_request'` として admin queue に投入。投入時 `request_status='pending'` で記録され、admin が resolve / reject 後は pending 行が無くなるため再申請可能 |

禁止: `PATCH /me/profile` は作らない。`/me/*` path に `:memberId` を入れない。GET 系 response に
`admin_member_notes` 由来の `notes` / `adminNotes` を含めない。

`MemberProfile.attendance` は 02a 確定済みの `AttendanceRecord[]` 契約を維持する。UT-02A follow-up では `sessionId` / `title` / `heldOn` を返し、D1 read path は `member_attendance.member_id` を 80-id chunk でまとめ、`meeting_sessions.session_id` へ INNER JOIN する。`meeting_sessions` に存在しない session は返さず、同一 member の同一 session は 1 件へ正規化する。

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
| 2.7.0   | 2026-04-29 | 04a: 公開ディレクトリ API 4 endpoint を追加 |
| 2.6.1   | 2026-04-29 | UT-26: `GET /admin/smoke/sheets` dev/staging Sheets API smoke route を追加 |
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
