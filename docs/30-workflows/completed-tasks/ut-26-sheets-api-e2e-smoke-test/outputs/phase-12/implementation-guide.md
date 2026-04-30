# Implementation Guide (UT-26 Sheets API E2E Smoke Test)

## Part 1: 中学生にも分かる説明

なぜ必要かというと、本番の同期処理を作る前に「Cloudflare のサーバーが Google スプレッドシートを本当に読めるか」を確かめないと、あとで原因不明の 403 や認証エラーに時間を取られるからです。
このタスクは「本番のスプレッドシート同期を作る前のテスト走行」です。
Cloudflare のサーバーが Google スプレッドシートを安全に読めるかどうか、本番より前に確認する仕組みを作りました。

たとえば、サービスアカウントの JSON は「会社の社員バッジ」のようなものです。
サーバーがバッジを Google に提示すると、短時間だけ使える鍵をもらえます。
その鍵で「読んでいいスプレッドシート」だけを開きます。

何をしたかというと、Google Sheets を読むための小さな確認口を `apps/api` に追加しました。

### 今回作ったもの

今回作った smoke route は「お店を開ける前に一回ドアを試す行為」です。
鍵が壊れていないか、開けるべきドアが開くか、もし開かないなら何が原因かを、すぐ分かるようにしてあります。

本番環境ではこのドアは表示されません（404 を返します）。dev / staging だけで動きます。

## Part 2: 技術メモ

### 型定義

```ts
export interface SmokeSheetsEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly SMOKE_ADMIN_TOKEN?: string;
  readonly SHEETS_SPREADSHEET_ID?: string;
  readonly GOOGLE_SHEETS_SA_JSON?: string;
}

export type SmokeErrorCode =
  | "AUTH_INVALID"
  | "PERMISSION_DENIED"
  | "RATE_LIMITED"
  | "NETWORK"
  | "PARSE"
  | "CONFIG_MISSING"
  | "INVALID_RANGE"
  | "UNKNOWN";
```

### APIシグネチャ

```ts
createSmokeSheetsRoute(deps?: SmokeDeps): Hono<{ Bindings: SmokeSheetsEnv }>
```

HTTP entry point:

```text
GET /admin/smoke/sheets?range=Sheet1!A1:B2
Authorization: Bearer <SMOKE_ADMIN_TOKEN>
```

### 実装ファイル

| 種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `apps/api/src/routes/admin/smoke-sheets.ts` | `createSmokeSheetsRoute()` を export。Hono route handler |
| 新規 | `apps/api/src/routes/admin/smoke-sheets.test.ts` | vitest 10 ケース、全 pass |
| 編集 | `apps/api/src/index.ts` | `Env` に `SMOKE_ADMIN_TOKEN?: string` 追加 / `app.route("/admin/smoke/sheets", createSmokeSheetsRoute())` を mount |

### ランタイム / 認可

- ランタイム: Cloudflare Workers / `apps/api`
- 認可境界（三段ガード）:
  1. `c.env.ENVIRONMENT === "production"` の場合は 404 を返す
  2. `Authorization: Bearer ${SMOKE_ADMIN_TOKEN}` ヘッダ必須（一致しなければ 401）
  3. `wrangler.toml` の production env に `SMOKE_ADMIN_TOKEN` 等を露出させない

Worker の route 定義は module load 時点で env を参照できないため、production 安全性は「未 mount」ではなく runtime 404 と Secret 非配置で担保する。

### 環境変数 Decision

仕様書 (`UT-26` index.md Decision Log 2026-04-29) では `GOOGLE_SHEETS_SA_JSON` を案として記述していたが、Phase 5 ゲートで以下の通り確定した:

| 変数 | 採用名 | 理由 |
| --- | --- | --- |
| Service Account JSON | `GOOGLE_SHEETS_SA_JSON` | 既存 `apps/api/src/jobs/sync-sheets-to-d1.ts` が参照済み。本タスクで rename を発生させると UT-09 への影響がある |
| 対象 spreadsheetId | `SHEETS_SPREADSHEET_ID` | 既存と同名 |
| smoke 認証トークン | `SMOKE_ADMIN_TOKEN` | 新規。dev/staging のみ |

env 名の正式統一（仕様書の `GOOGLE_SHEETS_SA_JSON` alias 化）は将来 followup として `outputs/phase-12/unassigned-task-detection.md` に検出記録するのみで、起票は行わない（UT-26 単独 owner ではない）。

### 認証フロー（Sheets API E2E）

`apps/api/src/jobs/sheets-fetcher.ts` の `GoogleSheetsFetcher` を再利用する。

1. SA JSON から `client_email` / `private_key` を取得
2. JWT header `{alg:"RS256", typ:"JWT"}` + payload `{iss, scope:"…/spreadsheets.readonly", aud:"https://oauth2.googleapis.com/token", iat, exp:iat+3600}` を Web Crypto API (RSASSA-PKCS1-v1_5) で署名
3. `https://oauth2.googleapis.com/token` に `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=<jwt>` を POST
4. `access_token` を取得し in-memory cache（TTL = `expires_in - 60s`）
5. `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}` に Bearer 認証で GET

smoke route は (5) を 2 回呼び、`GoogleSheetsFetcher.getTokenFetchCount()` の差分が 1 回だけであることを `tokenFetchesDuringSmoke=1` / `cacheHit=true` として返す。レスポンス遅延差は参考値として返すだけで、cache 判定には使わない。

### エラー分類

| 例外 | errorCode | HTTP |
| --- | --- | --- |
| SheetsFetchError(_, 401) | AUTH_INVALID | 401 |
| SheetsFetchError(_, 403) | PERMISSION_DENIED | 403 |
| SheetsFetchError(_, 429) | RATE_LIMITED | 429 |
| SyntaxError | PARSE | 502 |
| TypeError (fetch failed) | NETWORK | 502 |
| Fetcher 生成失敗 / env 欠如 | CONFIG_MISSING | 500 |
| 不正な range query | INVALID_RANGE | 400 |
| その他 | UNKNOWN | 500/502 |

### エラーハンドリング

`SheetsFetchError` の HTTP status を `AUTH_INVALID` / `PERMISSION_DENIED` / `RATE_LIMITED` に写像する。JSON parse・network・設定不足・range 不正は別 code に分け、secret 値や full spreadsheetId は body と log に出さない。

### エッジケース

- `ENVIRONMENT=production` は常に 404
- `SMOKE_ADMIN_TOKEN` 未設定または Bearer 不一致は 401
- `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` 未設定は 500 `CONFIG_MISSING`
- `range` は 80 文字以内の単一 A1 range のみ許可し、任意 URL や長大文字列は 400 `INVALID_RANGE`
- token cache 判定は latency 差ではなく `tokenFetchesDuringSmoke=1` で行う

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| default range | `Sheet1!A1:B2` |
| max range length | 80 |
| SA JSON env | `GOOGLE_SHEETS_SA_JSON` |
| spreadsheet env | `SHEETS_SPREADSHEET_ID` |
| auth token env | `SMOKE_ADMIN_TOKEN` |
| production behavior | 404 |

### redact ルール

- spreadsheetId: 先頭4 + `***` + 末尾4 のみログ・レスポンスに記録
- access_token / Authorization / SA JSON / private_key / client_email: 一切記録しない
- 値の有無を yes/no で残すのみ

### ローカル / staging 実行手順

### 使用例

```bash
# 1. .dev.vars に 1Password 参照を配置（実値は op:// 経由で動的注入）
#    SMOKE_ADMIN_TOKEN, GOOGLE_SHEETS_SA_JSON, SHEETS_SPREADSHEET_ID, ENVIRONMENT=development

# 2. ローカル疎通
bash scripts/with-env.sh mise exec -- pnpm --filter @ubm-hyogo/api dev
curl -i -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  "http://127.0.0.1:8787/admin/smoke/sheets?range=Sheet1!A1:B2"

# 3. staging deploy + 疎通
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
curl -i -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  "https://<staging-host>/admin/smoke/sheets?range=Sheet1!A1:B2"
```

### テスト構成

vitest 10 ケース、全 pass。正常系では 2 回の Sheets fetch に対して OAuth token fetch が 1 回だけであることを検証し、不正 range が Sheets API を呼ばず `INVALID_RANGE` で止まることも検証する。
詳細は `outputs/phase-11/main.md` のテストケース一覧を参照。

### Secret Hygiene

- Cloudflare Secrets / 1Password 経由のみ
- リポジトリ・ログ・PR メッセージに平文値が残らないこと
- redact が破られていないかは `outputs/phase-09/main.md` のチェックリストで確認

### 403 切り分け runbook

`outputs/phase-11/troubleshooting-runbook.md` の Step A〜D を参照（SA 共有 / JSON 改行 / Sheets API 有効化 / spreadsheetId vs formId）。

### 不変条件

- #1 schema 固定回避: 値の存在のみ確認、列順 / カラム名にハードコード依存しない
- #4 admin-managed data 分離: 読み取りのみ、違反なし
- #5 D1 直接アクセス禁止: smoke route は `apps/api` に閉じ、D1 にも書き込まない

### UT-09 への引き渡し

本タスク完了により、UT-09（Sheets→D1 同期ジョブ）は「実 Sheets API への認証・取得が Workers 上で動く」前提で着手できる。
live 実行は staging credentials 配置完了後に Phase 11 を更新して確定する。
