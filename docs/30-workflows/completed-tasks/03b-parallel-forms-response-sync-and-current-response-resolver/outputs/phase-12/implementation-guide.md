# 実装ガイド — 03b-parallel-forms-response-sync-and-current-response-resolver

## 冒頭サマリ

Google Form の回答を 15 分ごとに Cloudflare D1 へ取り込み、同一メールの再回答時は最新を `current_response_id` として切替、`publicConsent` / `rulesConsent` を `member_status` に snapshotする response sync ジョブを実装した。`POST /admin/sync/responses` 経由で手動再同期と high-water cursor 継続を許容し、二重起動は `sync_jobs` ロックで 409 にする。`responseEmail` は system field として `member_responses.response_email` に保存し、未知の質問は `response_fields.stable_key='__extra__:<questionId>'` の extra row と `schema_diff_queue` に集約することで schema 固定（不変条件 #1）と PII 取り扱い（#3）を両立する。AC-1〜AC-10 すべて vitest で green、API typecheck も green。Phase 11 の手動 smoke は curl/wrangler 証跡テンプレを整備し、ステージング担当が値を埋めて完了する設計。

---

## Part 1: 中学生レベル概念説明

### 困りごと
- UBM 兵庫支部会の入会は Google フォームに答えて済ませる。でも、フォームの答えはずっと Google の中にあって、サイトに表示するには **誰かが手で写し取る必要** がある。
- しかも、同じ人が「住所を引っ越したから」とフォームを **もう一度** 答えることがある。古い答えと新しい答えが混ざって「どっちが本当の今の情報？」が分からなくなる。
- フォームに **新しい質問** を後から足したとき、サイト側のプログラムが「知らない質問」だらけになって落ちると困る。

### 解決後の状態
- 15 分に 1 回、コンピューターが勝手に Google フォームの「回答箱」を覗いて、新しい回答を会員カード台帳（`member_responses`）に写してくれる。
- 同じメールアドレスの人が 2 回答えたら、**新しい方** を「いま使う回答」として印を付ける（`current_response_id`）。古い方も履歴として残るから、後で見返せる。
- 「公開していい？」「規約読んだ？」の答え（`publicConsent` / `rulesConsent`）は、新しい回答のものを会員ステータスカード（`member_status`）に書き写す。すでに退会した人には書き写さない。
- 知らない質問が来たら、回答の **おまけ欄**（`extra field row (`response_fields.stable_key=__extra__:<questionId>`)`）にとっておきつつ、**未処理ボックス**（`schema_diff_queue`）にもメモを入れて、後から管理者が「これはこういう名前の質問ですよ」と名札を付けられるようにする。
- 同じ作業が二重に走らないように、作業ノート（`sync_jobs`）に「いま実行中」と書いてからスタートする。誰かが二重に実行したら「もう動いてるよ」と 409 エラーを返す。

### 用語ミニ辞書
- **同期**: あちらにある最新情報をこちらに写すこと。
- **cursor（カーソル）**: 「ここまで読んだ」という栞。次回はここから読み始める。
- **冪等（べきとう）**: 何回やっても結果が同じになること。同期は冪等にしてある。
- **brand 型**: 文字列でも「これは responseId です」「これは memberId です」と区別する型のしかけ（混同を防ぐ）。

---

## Part 2: 開発者・技術者レベル詳細

### アーキテクチャ図

```mermaid
flowchart TD
  subgraph Trigger
    CRON["Cron */15 * * * *"]
    ADMIN["POST /admin/sync/responses"]
  end

  subgraph API["apps/api (Cloudflare Workers + Hono)"]
    INDEX[index.ts: scheduled() / route mount]
    ROUTE[routes/admin/responses-sync.ts]
    JOB[jobs/sync-forms-responses.ts: runResponseSync]
    LOCK[jobs/sync-lock.ts]
    CURSOR[jobs/cursor-store.ts]
    NORM[jobs/mappers/normalize-response.ts]
    CONSENT[jobs/mappers/extract-consent.ts]
  end

  subgraph External
    FORMS[Google Forms API: forms.responses.list]
  end

  subgraph D1[(Cloudflare D1)]
    MR[member_responses]
    MI[member_identities]
    MS[member_status]
    RF[response_fields]
    SDQ[schema_diff_queue]
    SJ[sync_jobs]
  end

  CRON --> INDEX
  ADMIN --> ROUTE
  ROUTE -- Bearer 認証 --> JOB
  INDEX --> JOB
  JOB --> LOCK --> SJ
  JOB --> CURSOR --> SJ
  JOB --> FORMS
  JOB --> NORM
  JOB --> CONSENT
  JOB --> MR
  JOB --> MI
  JOB --> RF
  JOB --> MS
  JOB --> SDQ
```

### AC ↔ 実装対応

| AC | 概要 | 実装ファイル / 主要関数 |
|----|------|--------------------------|
| AC-1 | `submittedAt` 最新で current 切替（tie は `responseId` desc） | `sync-forms-responses.ts` `decideShouldUpdate` / `updateCurrentResponse` |
| AC-2 | unknown question を `schema_diff_queue` 投入・重複 no-op | `sync-forms-responses.ts` `processResponse` + `repository/schemaDiffQueue.ts` `enqueue` + migration `0005_response_sync.sql` の partial UNIQUE index |
| AC-3 | consent 正規化値（`consented` / `declined` / `unknown`）を `member_status` に snapshot | `mappers/extract-consent.ts` + `repository/status.ts` `setConsentSnapshot` |
| AC-4 | `responseEmail` は `member_responses.response_email` に system field 保存 | `mappers/normalize-response.ts` `SYSTEM_STABLE_KEYS` |
| AC-5 | cursor pagination ループ・`?fullSync=true` で先頭から | `runResponseSync` while-loop + `cursor-store.ts` |
| AC-6 | 二重起動防止 → 409 Conflict | `sync-lock.ts` `acquireSyncLock` + `routes/admin/responses-sync.ts` の `status='skipped'` → 409 mapping |
| AC-7 | `MemberId` / `ResponseId` brand 型分離 | `@ubm-hyogo/shared` brand types + `sync-forms-responses.types.test.ts` |
| AC-8 | 旧 `ruleConsent` を入力時に正規化 | `extract-consent.ts` の legacy alias 処理 |
| AC-9 | `is_deleted=1` identity は consent snapshot をスキップ | `processResponse` 内 guard |
| AC-10 | per-sync write 200 行 cap | `RESPONSE_SYNC_WRITE_CAP` 定数 + ループ break |

### TypeScript 型・主要シグネチャ

```ts
// apps/api/src/jobs/sync-forms-responses.ts
export interface ResponseSyncEnv {
  readonly DB: D1Database;
  readonly GOOGLE_FORM_ID?: string;
  readonly RESPONSE_SYNC_WRITE_CAP?: string;
}

export interface ResponseSyncOptions {
  readonly trigger: "cron" | "admin" | "backfill";
  readonly fullSync?: boolean;
  readonly cursor?: string;
  readonly client: GoogleFormsClient;
  readonly formId?: string;
  readonly now?: () => Date;
  readonly runId?: string;
  readonly lockTtlMs?: number;
}

export interface ResponseSyncResult {
  readonly status: "succeeded" | "failed" | "skipped";
  readonly jobId: string;
  readonly processedCount: number;
  readonly writeCount: number;
  readonly cursor: string | null;
  readonly skippedReason?: string;
  readonly error?: string;
}

export function runResponseSync(
  env: ResponseSyncEnv,
  opts: ResponseSyncOptions,
): Promise<ResponseSyncResult>;
```

### 主要ファイル一覧

新規:
- `apps/api/migrations/0005_response_sync.sql`
- `apps/api/src/jobs/sync-forms-responses.ts`
- `apps/api/src/jobs/sync-forms-responses.test.ts`
- `apps/api/src/jobs/sync-forms-responses.types.test.ts`
- `apps/api/src/jobs/cursor-store.ts`
- `apps/api/src/jobs/__fixtures__/d1-fake.ts`
- `apps/api/src/jobs/mappers/normalize-response.ts`
- `apps/api/src/jobs/mappers/normalize-response.test.ts`
- `apps/api/src/jobs/mappers/extract-consent.ts`
- `apps/api/src/jobs/mappers/extract-consent.test.ts`
- `apps/api/src/routes/admin/responses-sync.ts`
- `apps/api/src/routes/admin/responses-sync.test.ts`

改修:
- `apps/api/src/index.ts`（`buildFormsClient` + route mount + `*/15 * * * *` cron 分岐）
- `apps/api/wrangler.toml`（production / staging に `*/15 * * * *` 追加）
- `apps/api/src/repository/responseFields.ts`（`upsertKnownField` / `upsertExtraField`）
- `packages/integrations/src/index.ts`（`GoogleFormsClient` / `createGoogleFormsClient` 再エクスポート）

### 設定可能なパラメータ・定数

| 名称 | 場所 | 既定値 | 用途 |
|------|------|--------|------|
| `RESPONSE_SYNC_WRITE_CAP` | env / `sync-forms-responses.ts` | `200` | 1 sync あたりの D1 write 行上限（無料枠保護、AC-10） |
| `DEFAULT_LOCK_TTL_MS` | `sync-forms-responses.ts` | `10 * 60 * 1000` | sync_jobs ロック TTL（10 分） |
| `GOOGLE_FORM_ID` | Cloudflare Variables | — | 取得対象 formId |
| `SYNC_ADMIN_TOKEN` | Cloudflare Secrets | — | `POST /admin/sync/responses` の Bearer 認証 |
| cron schedule | `apps/api/wrangler.toml` | `*/15 * * * *` | 自動同期間隔 |

### consent 正規化規則（不変条件 #2）

| 入力（生） | 正規化値 |
|-----------|---------|
| `'同意する'` / `'同意します'` / `'yes'` / `'Yes'` / `'YES'` / `'true'` | `consented` |
| `'同意しない'` / `'同意しません'` / `'no'` / `'No'` / `'NO'` / `'false'` | `declined` |
| 上記以外 / 空文字 / null | `unknown` |
| 入力 key が legacy `ruleConsent` | `rulesConsent` に rename した上で同表で正規化（AC-8） |

### 実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm vitest run apps/api/src/jobs/sync-forms-responses
mise exec -- pnpm vitest run apps/api/src/routes/admin/responses-sync
mise exec -- pnpm build

# migration（staging）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# deploy（staging）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# rollback（migration の取消はなし。インデックス drop なら手動 SQL）
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env staging
```

### 運用手順 / 既知の留意点

1. **production deploy の前提**: `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` を staging / production に設定すること。JWT は Workers WebCrypto の RS256 signer を `createGoogleFormsClient` に注入する。
2. **migration 0005 の rollback**: `idx_schema_diff_queue_question_open` / `idx_response_fields_response` の
   2 INDEX のみ追加。ロールバックは手動 `DROP INDEX` で対応可能（データ移行はなし）。
3. **`*/15 * * * *` cron**: 日 96 回 × per sync 200 write cap = 1 日 19,200 write が理論上限。
   D1 無料枠（5M writes/day）内（不変条件 #10、Phase 9 free-tier-estimate.md 参照）。
4. **PII redact**: log には responseEmail / responseId / questionId を出さない（Phase 9 secret-hygiene.md）。
   `wrangler tail` で漏洩がないか定期確認。
5. **同期共通モジュール**: `_shared/ledger.ts` / `_shared/sync-error.ts` は 03a と共同保守。
   owner 明示は Phase 12 unassigned-task-detection.md で確認要として残す。
6. **GAS prototype 非昇格**: 同期は Forms API + Workers のみで完結（不変条件 #6）。

### 検証コマンド（local）

```bash
mise exec -- pnpm typecheck   # green
mise exec -- pnpm vitest run  # 43 files / 324 tests / green（Phase 10 確認済）
```

### Phase 11（手動 smoke）参照

- `outputs/phase-11/main.md` — 手動 smoke のサマリ・実施区分
- `outputs/phase-11/manual-evidence.md` — curl / wrangler 証跡テンプレ（ステージング担当が値を埋める）
- `outputs/phase-11/curl-recipes.md` — 即コピペ可能な curl コマンド集
- `outputs/phase-11/wrangler-checks.md` — D1 row 確認 SQL 集

### エラーハンドリング・エッジケース

| 状況 | 挙動 |
|------|------|
| 既に running の sync_jobs あり | `runResponseSync` が `status='skipped'` を返す → route が 409 |
| `client.listResponses` throw | `runResponseSync` 内 try/catch で `fail()` → route 500 |
| unknown question 重複 enqueue | `idx_schema_diff_queue_question_open` partial UNIQUE で no-op |
| per-sync write cap に近づく | 処理済み response の high-water cursor（`submittedAt|responseId`）を `sync_jobs.metrics_json.cursor` に保存 → 次回 cron で timestamp filter から冪等再開 |
| `is_deleted=1` identity の再回答 | response 自体は upsert、consent snapshot は skip（AC-9） |
| `MemberId` を `ResponseId` 引数に渡す | `tsc` がコンパイルエラーで弾く（AC-7 / brand 型） |

### invariants 適用一覧

| 不変条件 | 本タスクでの担保箇所 |
|---------|--------------------|
| #1 schema 固定禁止 | stableKey は 03a の `schema_questions` 経由で解決 |
| #2 consent キー統一 | `extract-consent.ts` で `publicConsent` / `rulesConsent` のみ |
| #3 responseEmail = system field | `SYSTEM_STABLE_KEYS` で `member_responses.response_email` に保存、`response_fields` には書かない |
| #4 profile 本文上書き禁止 | 同 `responseId` の upsert のみ、既存の `submittedAt` は不変 |
| #5 apps/web → D1 直接禁止 | sync は apps/api 内で完結 |
| #6 GAS 排除 | Forms API + Workers のみ |
| #7 ResponseId / MemberId 混同禁止 | brand 型 + types test |
| #10 無料枠 | per sync write 200 cap + cron */15 |
| #14 schema 集約 | unknown は schema_diff_queue で集約 |
