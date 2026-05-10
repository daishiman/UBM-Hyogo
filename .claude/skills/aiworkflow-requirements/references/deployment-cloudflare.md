# Cloudflare デプロイメント仕様

> 親仕様書: [deployment.md](deployment.md)
> 役割: Cloudflare インフラ デプロイ仕様

## 概要

ubm-hyogo Webアプリは **Cloudflare** を主要インフラとして使用する。
静的アセット・SSR・APIはすべて Cloudflare のエッジネットワーク上で動作する。

---

## サービス構成

| サービス | 用途 | 対応技術 |
| -------- | ---- | -------- |
| Cloudflare Workers | フロントエンド・Next.js ホスティング、サーバーレスAPI・バックエンドロジック | Next.js 16 + `@opennextjs/cloudflare` / Hono / Workers API |
| Cloudflare D1 | SQLiteデータベース（エッジ） | Drizzle ORM |
| Cloudflare R2 | オブジェクトストレージ（ファイル・画像） | AWS S3互換API |
| Cloudflare KV | 設定・セッションキャッシュ | キーバリューストア |
| Cloudflare Zero Trust | 認証・アクセス制御 | OAuth2 / OIDC |

---

## 現行 canonical: UT-06 実行前ゲート（2026-04-27）

UT-06 canonical 前提・5 ゲート → [`deployment-cloudflare-ut06-gate.md`](./deployment-cloudflare-ut06-gate.md)

### 初回 D1 バックアップと restore-empty

初回 migration 前の `wrangler d1 export` は、テーブル未作成のため空 export になる場合がある。この場合でも、実行日時、DB 名、command、出力ファイル、空 export である理由を `d1-backup-evidence.md` に記録すれば AC-7 の事前バックアップ証跡として扱える。

初回 migration 失敗時に備え、Phase 4 で `restore-empty.sql` または同等の DROP SQL 雛形を準備する。実行前に対象テーブル名が migration と一致していることを確認する。

### Pages 形式と OpenNext Workers 形式の判定

> `apps/web` の OpenNext Workers 形式の詳細仕様（必須項目・`.assetsignore`・env 分離・bundle size ガード・SPA fallback・CLI 経路）は [`deployment-cloudflare-opennext-workers.md`](./deployment-cloudflare-opennext-workers.md) を参照。

| wrangler.toml の特徴 | 判定 | UT-06 での扱い |
| --- | --- | --- |
| `pages_build_output_dir = ".next"` | Pages 形式 | OpenNext Workers AC とは非整合。移行または AC 再定義が必要 |
| `main = ".open-next/worker.js"` + `[assets] directory = ".open-next/assets"` | OpenNext Workers 形式 | UT-06 AC-1 の前提を満たす |
| `compatibility_flags = ["nodejs_compat"]` のみ | 不十分 | entrypoint と assets 設定を併せて確認 |

### OpenNext Workers env 分離の追加確認（2026-04-29 / UT-06-FU-A）

`apps/web` を OpenNext Workers 形式へ移行する場合、top-level の `[assets]` / `[observability]` だけでなく、`[env.staging.assets]` / `[env.production.assets]` と `[env.staging.observability]` / `[env.production.observability]` も明示する。wrangler の env scope で top-level 設定が期待通り継承されない場合に備え、staging / production の Worker を独立して検証できる状態にする。

production Worker 名を top-level `name` から分離する場合は、production deploy 前に route / custom domain / secrets / observability の対象 Worker を確認する。`apps/web` の deploy / rollback / tail / secret 操作は `bash scripts/cf.sh ... --config apps/web/wrangler.toml --env <env>` 経由に統一し、`wrangler types` のようなローカル型生成とは分離して扱う。

## API Worker Cron（u-04 Sheets → D1 sync）

u-04 (`docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/`) で、Google Sheets → D1 の scheduled sync を `apps/api` Worker に追加した。

| 項目 | 値 |
| --- | --- |
| Cron | `0 * * * *`（毎時 0 分） |
| 実装 | `apps/api/src/index.ts` `scheduled()` が cron `0 * * * *` の場合のみ `runScheduledSync(env)` を呼ぶ |
| モジュール | `apps/api/src/sync/scheduled.ts` |
| audit | `sync_job_logs` (`trigger_type='scheduled'`) |
| 排他 | `sync_locks` + `withSyncMutex` |
| Secret / var | `GOOGLE_SERVICE_ACCOUNT_JSON`, `SHEETS_SPREADSHEET_ID`, `SYNC_RANGE`, `SYNC_MAX_RETRIES=3`, `SYNC_ADMIN_TOKEN` |

既存 cron との分岐:

| Cron | 用途 |
| --- | --- |
| `*/15 * * * *` | 03b Google Forms response sync |
| `0 18 * * *` | 03a Google Forms schema sync（03:00 JST） |
| `0 * * * *` | u-04 Sheets → D1 scheduled sync |

実機 staging smoke は 05b、cron 監視と 30 分超 running alert は 09b の責務とする。

### API Worker Env 型正本（Issue #112 / 2026-05-01）

`apps/api` Worker の TypeScript binding 型は `apps/api/src/env.ts` の `Env` interface を正本とする。`apps/api/wrangler.toml` の D1 binding / vars と Cloudflare Secrets を追加・変更する場合は、同一 PR / 同一 wave で `Env` も更新する。

| 対象 | 正本 |
| --- | --- |
| D1 binding | `apps/api/wrangler.toml` `binding = "DB"` + `Env.DB: D1Database` |
| Sheets / Forms vars | `SHEET_ID`, `SHEETS_SPREADSHEET_ID`, `FORM_ID`, `GOOGLE_FORM_ID` など |
| Repository context | `apps/api/src/repository/_shared/db.ts` `ctx(env: Pick<Env, "DB">)` |
| Web boundary | `scripts/lint-boundaries.mjs` が `apps/web` から `apps/api/src/env` への raw / relative import を遮断 |

---

## D1 Backup Long-Term Storage（UT-06-FU-E / 2026-05-01）

UT-06 Phase 12 UNASSIGNED-E は `docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/` で `spec_created` / docs-only / NON_VISUAL workflow として formalize した。現 wave は仕様書と validator 用 placeholder のみで、runtime 実装は Phase 13 ユーザー承認後の別 PR に分離する。

| 項目 | current contract |
| --- | --- |
| export 主経路 | `.github/workflows/d1-backup.yml` の GHA schedule。`bash scripts/cf.sh d1 export` → gzip → R2 PUT |
| Cloudflare cron | `apps/api/wrangler.toml` の R2 latest healthcheck / UT-08 alert 補助。Workers runtime から D1 export CLI は実行しない |
| retention | `daily/` は 30 日、`monthly/` は 12 ヶ月 |
| storage | R2 を第一保管先、1Password Environments は月次補助保管先 |
| encryption | R2 SSE 標準を base case。L3 相当データが入る場合は SSE-C / KMS を再判定 |
| restore rehearsal | 月次、RTO 15 分未満、結果は restore rehearsal record に追記 |
| visual evidence | NON_VISUAL。screenshots は不要。Phase 11 placeholder は runtime PASS ではない |
| follow-ups | `UT-06-FU-E-monthly-restore-rehearsal-sop-001` / `UT-06-FU-E-encryption-mode-finalization-001` / `UT-06-FU-E-gha-backup-monitoring-extension-001` |

実装 PR では `apps/web` を変更せず、Cloudflare 操作は `bash scripts/cf.sh` 経由に統一する。secret 実値は記録禁止で、`op://...` は参照名としてのみ許可する。

---

## Cloudflare Workers デプロイ（Next.js / OpenNext）

> **current facts (Issue #331 cleanup / 2026-05-09)**: `apps/web/wrangler.toml` は **OpenNext Workers 形式**（`main = ".open-next/worker.js"` + `[assets]`）で、`.github/workflows/web-cd.yml` も `pnpm --filter @ubm-hyogo/web build:cloudflare` 後に `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging|production>` を呼ぶ。repo-side Pages deploy cutover は完了済み。Cloudflare side Pages project retirement、custom domain / route verification、staging / production runtime smoke は user approval 後の Issue #419 / Phase 13 evidence 境界とする。
> **current facts (CI recovery / 2026-05-09)**: `apps/web/wrangler.toml` は **OpenNext Workers 形式**（`main = ".open-next/worker.js"` + `[assets]`）で、`.github/workflows/web-cd.yml` も `build:cloudflare` + `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging|production` へ同期済み。Pages deploy (`pages deploy .next`) は current web-cd path から撤去済み。staging / production runtime deploy evidence は user-approved Actions run 後に取得する。

### Pages 形式と OpenNext Workers 形式の判定（current state 列付き）

| wrangler.toml の特徴 | 判定 | UT-06 での扱い | 現状（2026-05-01） |
| --- | --- | --- | --- |
| `pages_build_output_dir = ".next"` | Pages 形式 | OpenNext Workers AC とは非整合。移行または AC 再定義が必要 | `apps/web/wrangler.toml` から撤回済み |
| `main = ".open-next/worker.js"` + `[assets] directory = ".open-next/assets"` | OpenNext Workers 形式 | UT-06 AC-1 の前提を満たす | **`apps/web/wrangler.toml` の現行形式** |
| `compatibility_flags = ["nodejs_compat"]` のみ | 不十分 | entrypoint と assets 設定を併せて確認 | n/a |

### セットアップ手順

#### 1. Cloudflareアカウント設定

> **重要（2026-04-27 / UT-06 派生）**: ローカル `wrangler login`（`~/Library/Preferences/.wrangler/config/default.toml` に OAuth トークンを保持する方式）は **使用禁止**。`.env` の `op://` 参照経由で `CLOUDFLARE_API_TOKEN` を `op run --env-file=.env` で動的注入する `bash scripts/cf.sh ...` に一本化する。グローバル `pnpm add -g wrangler` も避け、worktree のローカル `node_modules/.bin/wrangler`（`scripts/cf.sh` が `ESBUILD_BINARY_PATH` を併せて固定して優先解決）を利用する。

```bash
# 認証確認（op run --env-file=.env で 1Password から CLOUDFLARE_API_TOKEN を動的注入）
bash scripts/cf.sh whoami
```

#### 2. Workers プロジェクトの確認

```bash
# ローカルビルドの確認
pnpm --filter @ubm-hyogo/web build:cloudflare
```

#### 3. Next.js の OpenNext Workers 設定

`apps/web/next.config.ts`:

```typescript
import type { NextConfig } from "next";
import path from "node:path";

// Next.js 16 / Turbopack は monorepo の root を誤検出する場合があるため、
// worktree root を明示する（UT-06 派生 / 2026-04-27）。
const workspaceRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
  typescript: {
    // ビルド時の型チェックは別 gate（pnpm --filter web exec tsc --noEmit）で実施するため、
    // ビルドではエラーで停止しない設定にしている。`ignoreBuildErrors=true` を有効にする場合、
    // 必ず deploy gate に独立した tsc --noEmit を併設する。
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

`apps/web/wrangler.toml`:

```toml
name = "ubm-hyogo-web"
main = ".open-next/worker.js"
compatibility_date = "2026-04-26"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[vars]
ENVIRONMENT = "production"
```

#### 4. 環境変数の設定

```bash
# 本番環境シークレット設定（scripts/cf.sh 経由で op 参照を動的注入）
bash scripts/cf.sh secret put ANTHROPIC_API_KEY --config apps/web/wrangler.toml --env production

# 確認
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
```

---

## Cloudflare Workers デプロイ（APIバックエンド）

### 構成

```
apps/
  api/           # Cloudflare Workers (Hono)
    src/
      index.ts   # Workers エントリポイント
    wrangler.toml
```

### wrangler.toml（API Workers）

> wrangler 4.x は strict mode により、`--env <name>` 指定時に対応する `[env.<name>]` セクションが top-level に存在しないと deploy が失敗する。staging / production 双方を必ず明示する（UT-06 派生 / 2026-04-27）。

```toml
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db"
database_id = "your-d1-database-id"

[[kv_namespaces]]
binding = "SESSION_KV"
id = "your-kv-namespace-id"
# UT-13 で SESSION_KV に統一。詳細は本ファイル下方「Cloudflare KV セッションキャッシュ」セクション参照
# 注（UT-CICD-DRIFT / 2026-04-29）: 上記 KV binding 例は UT-13 採用後の構成。
#                                   現行 `apps/api/wrangler.toml` には KV binding は未追加で、
#                                   D1 binding のみが配置されている。実適用は UT-13 KV bootstrap 配下。

[env.staging]
name = "ubm-hyogo-api-staging"

[env.production]
name = "ubm-hyogo-api"
```

### API Worker cron / Forms response sync（03b）

`apps/api` は二種類の cron を持つ。

> **UT-21 close-out note (2026-04-30)**: 下表の Sheets 由来 cron / `runSync` / Sheets API v4 説明は legacy current-fact の残存であり、現行正本は Forms sync（`forms.get` / `forms.responses.list`、`POST /admin/sync/schema` / `POST /admin/sync/responses`、`sync_jobs` ledger）である。runtime cron / wrangler 設定の撤回・整理は `docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md`（UT21-U05）で扱い、本 close-out では `apps/api/wrangler.toml` を変更しない。

| cron | 用途 | 実行関数 |
| --- | --- | --- |
| `0 * * * *` | Google Sheets 由来の legacy hourly sync（撤回は UT21-U05） | `runSync` |
| `0 18 * * *` | 03a schema sync + issue-402 retention purge dry-run/apply 併用（fan-out なし。`apps/api/src/index.ts` cron handler 内で分岐ルーティングし、retention purge は `RETENTION_PURGE_MODE` で dry-run/apply/off を切替。SSOT: [data-retention-policy.md](./data-retention-policy.md)） | `runSchemaSync` + retention purge job |
| `*/15 * * * *` | Google Forms response 同期 | `runResponseSync` |

> **current facts (09b / 2026-05-01)**: 上記 3 件は `apps/api/wrangler.toml` の `[triggers] crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]`、`[env.staging.triggers]` と完全整合する。`0 * * * *` は legacy Sheets hourly cron の現行残存であり、撤回・runtime 設定整理は `docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md`（UT21-U05）で扱う。09b は docs-only / spec_created のため runtime 設定を変更しない。

Forms response sync は `GOOGLE_FORM_ID` を Cloudflare vars に持ち、`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` を Cloudflare Secrets として扱う。JWT signing は Workers WebCrypto (`RSASSA-PKCS1-v1_5` + SHA-256) で行い、`packages/integrations` の Google Forms client に注入する。

Issue #378 以降、Forms response sync の tag candidate enqueue は `TAG_QUEUE_PAUSED` variable で deploy-gated に停止できる。`"true"` 完全一致のみ停止し、停止中は `tag_assignment_queue` への D1 read / write を行わず `{ enqueued: false, reason: "paused" }` と structured log `UBM-TAGQ-PAUSED` を返す。切替手順は `docs/30-workflows/runbooks/tag-queue-pause.md` を正本とし、Cloudflare Secret では扱わない。

Google Sheets API v4 同期は `SHEETS_SPREADSHEET_ID` を Cloudflare vars に持ち、`GOOGLE_SERVICE_ACCOUNT_JSON` を Cloudflare Workers Secret として扱う。`GOOGLE_SERVICE_ACCOUNT_JSON` は UT-25 で確定した正本名で、staging / production の両環境に `bash scripts/cf.sh secret put ... --config apps/api/wrangler.toml --env <env>` 経由で配置する。`GOOGLE_SHEETS_SA_JSON` は移行期間の legacy alias として実装側のみ許容し、新規 secret 投入名には使わない。

Sheets sync auth は UT-03 で実装した `packages/integrations/google/src/sheets/auth.ts` を使う。`GOOGLE_SERVICE_ACCOUNT_JSON` を Cloudflare Secret として注入し、任意で `SHEETS_SCOPES` を指定する。未指定時の scope は `https://www.googleapis.com/auth/spreadsheets.readonly`。JWT signing は Workers WebCrypto (`RSASSA-PKCS1-v1_5` + SHA-256) を使い、token endpoint の `expires_in` に従って cache し、失効 5 分前に再取得する。UT-09 / UT-21 は `@ubm-hyogo/integrations-google` の `sheets` namespace export 経由で `getSheetsAccessToken()` を呼ぶ。


staging / production では `[triggers]` と `[env.staging.triggers]` の両方に `*/15 * * * *` を明示する。未設定 secret の場合、cron は response sync を開始せずスキップする。

> R2 binding は現行 `apps/api/wrangler.toml` には未適用。UT-12 の下流実装時に、下記 R2 セクションの環境別差分を追加する。

### デプロイコマンド

```bash
# Workers のデプロイ（canonical: scripts/cf.sh 経由）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# ログ確認
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production
```

### Cloudflare R2 ストレージ設定（UT-12）

R2 はファイル・画像などのオブジェクトストレージとして使う。アプリケーションからの直接アクセスは `apps/api` に閉じ、`apps/web` には R2 binding を置かない。

| 項目 | 正本値 / 方針 |
| --- | --- |
| production bucket | `ubm-hyogo-r2-prod` |
| staging bucket | `ubm-hyogo-r2-staging` |
| Workers binding | `R2_BUCKET` |
| Token 方針 | 専用 R2 token を作成し、`Account > Workers R2 Storage > Edit` の最小権限に限定 |
| 公開方針 | private bucket + `apps/api` 経由の presigned URL / proxy access |
| CORS 方針 | production / staging の `AllowedOrigins` を環境別に管理し、実ドメインは secrets / environment 管理に寄せる |

`wrangler.toml` の R2 binding は環境別 bucket を明示する。これは現行設定例ではなく、下流のファイルアップロード実装時に適用する差分である。

```toml
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"

[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
```

CORS ルールは以下をテンプレートとし、`<env-specific-origin>` を環境別に差し替える。

```json
[
  {
    "AllowedOrigins": ["<env-specific-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

UT-12 は `spec_created` のため実 bucket 作成・`wrangler.toml` 反映・smoke test 実行は未適用。下流のファイルアップロード実装タスクで `docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-12/implementation-guide.md` を参照して実施する。

---

## Cloudflare D1 データベース

### セットアップ

```bash
# D1 データベース作成
bash scripts/cf.sh d1 create ubm-hyogo-db-prod

# マイグレーション実行（canonical: scripts/cf.sh 経由 / production）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# 初回 migration 前に export を取り backup 証跡として保存（空 export でも記録）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup.sql
```

### マイグレーション管理

```bash
# 新規マイグレーション作成
bash scripts/cf.sh d1 migrations create ubm-hyogo-db-prod "add_users_table"

# マイグレーション一覧
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
```

### D1 PRAGMA 制約

Cloudflare D1 の PRAGMA は SQLite と完全同一に扱わず、Cloudflare の official compatible PRAGMA list を確認してから使う。`wrangler.toml` は D1 binding metadata の管理場所であり、`PRAGMA journal_mode=WAL` のような SQLite PRAGMA を永続設定する場所ではない。

`journal_mode` が official compatible PRAGMA として確認できない場合、staging / production で `PRAGMA journal_mode=WAL` を実行しない。読み書き競合対策は retry/backoff、queue serialization、短い transaction、batch-size 制限を runtime 実装側で扱う。

---

## Cloudflare KV セッションキャッシュ（UT-13 / SESSION_KV）

### 用途と設計方針

| 用途 | キー命名例 | TTL | KV 採否 |
| --- | --- | --- | --- |
| セッションブラックリスト（JWT 失効済み jti） | `session:blacklist:<jti>` | 86400s（24h） | 採用 |
| 設定キャッシュ（読み取り中心） | `config:<key>` | 3600s（1h） | 採用 |
| レートリミットカウンタ（短期 windowing） | `rl:<bucket>:<window>` | 60s〜600s | 採用（書き込み枠注意） |
| ログアウト即時反映 / 権限変更即時反映 | - | - | **不採用**（D1 / Durable Objects） |
| セッション本体保管 | - | - | **不採用**（書き込み枠 1k/日 を消費するため。JWT で完結） |

設計の正本: `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/`。

### 命名規約・バインディング

| 環境 | Namespace 名 | バインディング名 |
| --- | --- | --- |
| production | `ubm-hyogo-kv-prod` | `SESSION_KV` |
| staging | `ubm-hyogo-kv-staging` | `SESSION_KV` |
| staging (preview) | `ubm-hyogo-kv-staging-preview` | `SESSION_KV` |

- バインディング名は全環境で `SESSION_KV` に統一
- Namespace ID は 1Password Environments（`UBM-Hyogo / Cloudflare / KV / <env>`）で集中管理
- `apps/api/wrangler.toml` のみに KV バインディングを配置（`apps/web` からの直接利用は禁止）

### wrangler.toml バインディング例（DRY 化済み）

```toml
[[kv_namespaces]]
binding = "SESSION_KV"
id = "<local-preview-id>"
preview_id = "<local-preview-id>"

[vars]
SESSION_BLACKLIST_TTL_SECONDS = "86400"
CONFIG_CACHE_TTL_SECONDS     = "3600"
RATE_LIMIT_WINDOW_SECONDS    = "60"

[env.staging]
[[env.staging.kv_namespaces]]
binding = "SESSION_KV"
id = "<staging-namespace-id>"
preview_id = "<staging-kv-preview-namespace-id>"

[env.production]
[[env.production.kv_namespaces]]
binding = "SESSION_KV"
id = "<production-namespace-id>"
```

### 無料枠と運用方針

| 制約項目 | 上限 | 監視閾値（推奨） |
| --- | --- | --- |
| read / day | 100,000 | 70,000（70%）で警告 |
| write / day | 1,000 | 700（70%）で警告、900（90%）で対応 |
| storage | 1 GB | 700 MB（70%）で警告 |

枯渇時のフォールバック: 用途縮退（レートリミット停止 → Durable Objects 移行検討）、ストレージは TTL 経過済みキーの bulk delete。

### 最終的一貫性制約（最大 60 秒の伝搬遅延）

- `put` 直後の `get` を同設計内で行わない（別エッジで旧値が返る可能性）
- 即時反映が必要な操作（ログアウト無効化・権限変更）は **D1 または Durable Objects** を使用する
- セッションブラックリストは「ヒット = 拒否」のみ実装し、即時失効は D1 セッションフラグで多層防御
- TTL は最小 60 秒以上（最終的一貫性以下に設定しない）

### KV Namespace 作成コマンド

```bash
wrangler kv:namespace create ubm-hyogo-kv-prod
wrangler kv:namespace create ubm-hyogo-kv-staging
wrangler kv:namespace create ubm-hyogo-kv-staging --preview
```

### 動作確認（smoke test）

```bash
wrangler kv:key put --binding=SESSION_KV --env=staging "verify:phase-05" "ok"
wrangler kv:key get --binding=SESSION_KV --env=staging "verify:phase-05"
wrangler kv:key delete --binding=SESSION_KV --env=staging "verify:phase-05"
```

### Worker 実装パターン

```ts
export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  SESSION_KV: KVNamespace
  SESSION_BLACKLIST_TTL_SECONDS: string
}

export async function isSessionBlacklisted(env: Env, jti: string): Promise<boolean> {
  const v = await env.SESSION_KV.get(`session:blacklist:${jti}`)
  return v !== null
}

export async function blacklistSession(env: Env, jti: string, ttlSec: number): Promise<void> {
  await env.SESSION_KV.put(`session:blacklist:${jti}`, "1", { expirationTtl: ttlSec })
}
```

### 関連 spec

- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-05/kv-bootstrap-runbook.md` （runbook）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-02/eventual-consistency-guideline.md` （最終的一貫性の設計指針）
- `docs/30-workflows/ut-13-cloudflare-kv-session-cache/outputs/phase-07/handoff.md` （下流タスク向けハンドオフ）

---

## GitHub Actions CI/CD

### UT-28 Cloudflare Pages project creation contract (spec_created / 2026-04-29)

UT-28 fixes the Cloudflare Pages project naming and creation contract used by `web-cd.yml`. The task is `spec_created`: the workflow and runbook are documented, but the real Cloudflare mutation is still gated by Phase 13 user approval.

| Environment | Pages project | Branch | Compatibility | Git integration |
| --- | --- | --- | --- | --- |
| production | `ubm-hyogo-web` | `main` | `compatibility_date=2025-01-01`, `nodejs_compat` | OFF |
| staging | `ubm-hyogo-web-staging` | `dev` | `compatibility_date=2025-01-01`, `nodejs_compat` | OFF |

`CLOUDFLARE_PAGES_PROJECT` stores the production/base name only: `ubm-hyogo-web`. Staging is derived by the GitHub Actions workflow as `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging`; storing `ubm-hyogo-web-staging` in the variable is invalid.

Use `bash scripts/cf.sh` for all Cloudflare CLI operations. Direct `wrangler` execution is out of contract because it bypasses the 1Password-backed token injection path.

OpenNext output-form preflight is mandatory before real apply. If `apps/web/wrangler.toml` still uses `pages_build_output_dir = ".next"` and UT-05 has not recorded a Pages-form exception, UT-28 real apply stops and the output-form blocker is routed to UT-05 / `task-impl-opennext-workers-migration-001`.

### 必要なシークレット・変数 / API トークン権限

CI/CD の secret / variable 配置と最小権限は [`deployment-secrets-management.md`](deployment-secrets-management.md) と [`deployment-gha.md`](deployment-gha.md) を正本とする。Cloudflare Pages / Workers / D1 の Edit 権限は deploy token に限定する。

### デプロイフロー（web-cd.yml）

`push` to `dev` / `main` → OpenNext Workers bundle build → `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <staging|production>`。
`push` to `dev` / `main` → setup Node/pnpm/mise → `pnpm --filter @ubm-hyogo/web build:cloudflare` → `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging|production`。

> **current facts (Issue #331 cleanup / 2026-05-09)**: 現行 `.github/workflows/web-cd.yml` は Pages deploy を呼ばない。Discord 通知ステップは現状未実装で、UT-08-IMPL で導入予定。
> **current facts (CI recovery / 2026-05-09)**: `.github/workflows/web-cd.yml` の Pages deploy は撤去済み。Discord 通知ステップは現状未実装で、UT-08-IMPL で導入予定。

---

## プレビューデプロイメント

Cloudflare Pages の Git Integration は UT-28 以降 OFF を既定とする。deploy は GitHub Actions 主導に一本化し、Pages 側の自動 Git deploy と二重起動させない。

| ブランチ | URL形式 | 用途 |
| -------- | ------- | ---- |
| `main` | `ubm-hyogo-web.pages.dev` | 本番 |
| `dev` | `ubm-hyogo-web-staging.pages.dev` | ステージング |
| `feature/*` | `<hash>.ubm-hyogo-web.pages.dev` | プレビュー（PR用） |

### Git Integration 設定

Cloudflare ダッシュボード → Pages → プロジェクト → Settings → Git Integration は OFF のまま維持する。PR プレビュー URL が必要な場合も、UT-28 の GitHub Actions 主導方針と競合しない別タスクで再設計する。

---

## カスタムドメイン設定

```bash
# カスタムドメイン追加
wrangler pages domain add ubm-hyogo-web yourdomain.com

# DNS 設定確認
# → CloudflareダッシュボードでCNAMEレコードが自動生成される
# → SSL証明書は自動発行（Let's Encrypt）
```

---

## 環境分離

| 環境 | Pages プロジェクト | ブランチ | D1 データベース |
| ---- | ------------------ | -------- | --------------- |
| 開発 | ローカル wrangler dev | - | ローカルD1シミュレーター |
| ステージング | ubm-hyogo-web-staging | `dev` | ubm-hyogo-db-staging |
| 本番 | ubm-hyogo-web | `main` | ubm-hyogo-db-prod |

---

## ロールバック戦略

### Pages ロールバック

Cloudflare ダッシュボード → Pages → Deployments から過去のデプロイメントを選択して「Rollback to this deployment」をクリック。

```bash
# CLI でのロールバック（canonical: scripts/cf.sh 経由）
bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env production
```

### ロールバック判断基準

| 状況 | 対応 |
| ---- | ---- |
| ビルド失敗 | 自動的に旧バージョン維持（Cloudflare Pages） |
| 機能不具合 | ダッシュボードから1クリックロールバック |
| データベースマイグレーション失敗 | スキーマロールバック + コードロールバック |

---

## モニタリング/アラート（UT-08 連携）

UT-08（`docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/`）で以下を SSOT として確定。実装は UT-08-IMPL（Wave 2）。

| 項目 | 値 |
| ---- | -- |
| WAE binding 名 | `MONITORING_AE` |
| WAE dataset 名 | `ubm_hyogo_monitoring` |
| 主要イベント | `api.request` / `api.error` / `d1.query.fail` / `cron.sync.start` / `cron.sync.end` |
| 任意イベント | `auth.fail`（UT-13 認証実装で採否確定） |
| PII 除外 | email / userId / IP は WAE data point に含めない |
| 外部監視 | UptimeRobot 無料プラン（5 分間隔） |

詳細は `lessons-learned-ut08-monitoring-design-2026-04.md` および `workflow-ut08-monitoring-alert-design-artifact-inventory.md` を参照。

---

## per-sync write cap 連続到達アラート（03b-followup-006 / Issue #199）

`apps/api/src/jobs/sync-forms-responses.ts` は per-sync write cap (`RESPONSE_SYNC_WRITE_CAP`、既定 200) を持つ。cap への到達は単発であれば許容するが、連続到達は回答急増 / retry storm / cron 間隔不足のシグナルとして扱い、escalation 階段で運用検知する。

### 検知契約

- `sync_jobs.metrics_json.writeCapHit: boolean` を成功 job 完了時に記録する。`absent` / `null` は `false` 解釈とし、後方互換を維持する。
- `apps/api/src/jobs/cap-alert.ts` の `evaluateConsecutiveCapHits()` が、`job_type='response_sync'` の直近 N+1 行を `started_at DESC, job_id DESC` で取得し、直近 N 行すべて `writeCapHit=true` のとき `thresholdReached=true` とする。failed / skipped job も `writeCapHit=false` として streak を reset する。直前 window が未達のときだけ `shouldEmit=true` を返し、連続継続中の重複 emit を抑制する。
- emit 先は Cloudflare Analytics Engine binding `SYNC_ALERTS`（dataset = `sync_alerts` / staging は `sync_alerts_staging`）。binding 未設定時は `console.warn` のみで例外伝播しない。

### 閾値・チャネル抽象化（escalation）

| 段階 | 連続 hit 数 | 経過時間目安 | チャネル候補 | 判断 |
| --- | --- | --- | --- | --- |
| Stage 1 | N=3 | 45 分（15 分 × 3 cron） | GitHub issue 自動起票（非同期） | 03b-followup-006 で event 契約を固定 |
| Stage 2 | N=6 | 90 分 | メール通知（同期） | 05a-parallel-observability 側で実装 |
| Stage 3 | N=12 | 180 分 | Slack（MVP では抽象化のみ） | 05a 後段 |

03b-followup-006 では event 契約 (`blobs=["sync_write_cap_consecutive_hit", jobKind]`, `doubles=[consecutiveHits, windowSize]`, `indexes=[jobId]`) のみを正本化し、GitHub / mail / Slack の実装は 05a observability guardrails に委譲する。

### コスト試算（D1 無料枠との整合）

| 項目 | 値 |
| --- | --- |
| 最大 write/sync | 200 行 |
| cron 周期 | 15 分（96 回/day） |
| 上限到達日次 write | 200 × 96 = 19,200 write/day |
| D1 free tier limit | 100,000 write/day |
| 占有率 | 19.2%（cap 解除時のリスク試算は runbook 参照） |
| Analytics Engine free tier | 25M write/month（連続 cap hit 時のみ emit するため余裕大） |

連続 cap hit 検知時のオペレータ手順は `docs/30-workflows/completed-tasks/task-03b-followup-006-per-sync-cap-alert/outputs/phase-12/runbook-per-sync-cap-alert.md` を参照する。

---

## Long-term Analytics Evidence（Issue #347 / 2026-05-05）

Cloudflare Analytics の長期保存 evidence は `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/` を正本 decision workflow とする。

| 項目 | current contract |
| --- | --- |
| canonical method | GraphQL Analytics API aggregate-only query |
| fallback | dashboard CSV export（保存前 redaction 必須） |
| rejected | dashboard screenshot（数値 diff / PII 不在検証が弱い） |
|保存先 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/` |
| retention | active 直近 12 件、13 件目以降は `archive/YYYY-MM/` |
| metrics | 4 metric groups / 5 scalar values: requests, totalRequests/errors5xx, D1 readQueries/writeQueries, worker invocations |
| PII boundary | URL query / request body / response body / IP / User-Agent / email / member ID / session token は保存禁止 |
| Logpush | Free plan 外のため不採用 |
| automation follow-up | consumed source: `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md`; current implementation spec: `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/` |

### Monthly Analytics Export Automation Spec（Issue #484 / 2026-05-06）

`docs/30-workflows/issue-484-cloudflare-analytics-export-automation/` is the current implementation specification for the Issue #347 automation follow-up.

| 項目 | contract |
| --- | --- |
| task state | `implemented-local / implementation / NON_VISUAL / code evidence captured / runtime Cloudflare export pending_user_approval / Phase 13 blocked_pending_user_approval` |
| script | `scripts/fetch-cloudflare-analytics.ts` |
| workflow | `.github/workflows/cloudflare-analytics-export.yml` |
| secrets/env | `CLOUDFLARE_ANALYTICS_API_TOKEN`, `CLOUDFLARE_ZONE_TAG`, `CLOUDFLARE_ACCOUNT_TAG`; 1Password is canonical, GitHub Secrets are execution copies |
| schedule | `0 2 1 * *`; schedule and `workflow_dispatch` real runs are limited to one export per target month |
| output | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/analytics-export-YYYYMMDD-HHmm-UTC.json` |
| persisted identifiers | `zoneTag` / `accountTag` are GraphQL inputs only and are stored as `[redacted]` in JSON evidence |
| metric aggregation | GraphQL group arrays are summed across returned buckets; first-element-only reads are forbidden |
| redaction gate | email, IPv4, bearer/token, URL query, member ID, session/cookie |
| runtime boundary | token-backed export and PR creation require explicit implementation/runtime execution; implemented-local close-out claims local code evidence only |
| automation status | **applied (2026-05-06)** — `scripts/fetch-cloudflare-analytics.ts` / `scripts/redaction-check-analytics.sh` / `.github/workflows/cloudflare-analytics-export.yml` がコードベースに配置済み。実 token 経由の runtime evidence は GitHub Secrets 配置後の workflow_dispatch 実行で取得する |

Runtime production sample は Cloudflare dashboard session または API token が必要なため、user approval 後の運用 cycle で取得する。Issue #347 decision workflow は schema sample / redaction check / Free plan constraints / aiworkflow 同期を完了し、09c parent workflow state は変更しない。

### D+7 / D+30 Post-release Observation Reminder（Issue #350 / 2026-05-06）

09c の 24h post-release verification 後に残る 1週間 / 1か月の継続観測は、`docs/30-workflows/issue-350-long-term-production-observation/` を正本 workflow とする。Cloudflare Workers cron は無料枠 3 本が既に埋まっているため追加せず、`.github/workflows/post-release-observation-reminder.yml` の GitHub Actions schedule / workflow_dispatch で reminder Issue を起票する。

| 項目 | current contract |
| --- | --- |
| runbook | `docs/runbooks/post-release-long-term-observation.md` |
| SSOT reference | `references/post-release-long-term-observation.md` |
| helper | `scripts/observation/create-reminder-issue.sh` |
| metrics | req/day, D1 reads/writes, 5xx p95, cron success, authz smoke, free plan headroom |
| evidence boundary | aggregate-only / redacted evidence。URL query, body, IP, User-Agent, email, member ID, session token, token values are prohibited |
| runtime gate | real workflow dispatch / Issue creation / commit / push / PR は user approval 後 |

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-05-06 | 1.6.0 | Issue #350 D+7 / D+30 post-release observation reminder を追加。GitHub Actions scheduled reminder、runbook、SSOT reference、PII/evidence boundary、runtime user gate を正本化 |
| 2026-05-05 | 1.5.0 | Issue #347 Cloudflare Analytics long-term evidence decision を追加。GraphQL aggregate-only export、12件 retention、PII 非保存、Logpush 不採用、automation follow-up を正本化 |
| 2026-05-06 | 1.6.0 | Issue #484 Cloudflare Analytics monthly export automation spec を current implementation spec として追加。source follow-up task を consumed trace 化し、token/env 名、accountTag、redaction gate、runtime pending 境界を同期 |
| 2026-05-06 | 1.7.0 | Issue #484 automation を実装適用。`scripts/fetch-cloudflare-analytics.ts` / `scripts/redaction-check-analytics.sh` / `.github/workflows/cloudflare-analytics-export.yml` を配置し、multi-bucket summation / persisted identifier redaction / schedule-manual duplicate guard を applied contract に更新 |
| 2026-04-09 | 1.0.0 | 初版作成（Cloudflare 移行） |
| 2026-04-27 | 1.1.0 | UT-08 モニタリング/アラート設計の SSOT 連携セクション追加 |
| 2026-04-27 | 1.2.0 | UT-06 派生: `scripts/cf.sh` 章を `wrangler` 直接実行から canonical wrapper に統一（whoami / deploy / d1 / rollback / secret / tail）。ローカル `wrangler login` OAuth 禁止と `op://` 参照経由の `CLOUDFLARE_API_TOKEN` 動的注入を明示。OpenNext Workers 形式 / Pages 形式の判定マトリクスを追加。初回 D1 backup の空 export 取扱を追記。`apps/web/next.config.ts` 例に `outputFileTracingRoot` / `turbopack.root` / `typescript.ignoreBuildErrors` を反映（別 `tsc --noEmit` gate と pair 必須）。API `wrangler.toml` 例に wrangler 4.x strict mode 対応の `[env.staging]` / `[env.production]` を明示 |
| 2026-04-29 | 1.3.0 | UT-CICD-DRIFT: Pages vs OpenNext Workers の current state 列を判定表に追加、Workers section 冒頭に Pages 運用中の current facts 注記、Cron 表に `0 18 * * *`（03a schema sync）を追加し `apps/api/wrangler.toml` の 3 件と整合、API wrangler.toml KV binding 例を「UT-13 採用後構成」と注記、web-cd 既存フロー後に OpenNext cutover 委譲注記を追加 |
| 2026-05-03 | 1.4.0 | 03b-followup-006 (Issue #199): per-sync write cap 連続到達アラート節を追加。`sync_jobs.metrics_json.writeCapHit` 契約・`evaluateConsecutiveCapHits` 検知ロジック・Analytics Engine `sync_alerts` binding・Stage 1〜3 escalation 閾値・D1 無料枠 19.2% 占有試算を SSOT 化 |
