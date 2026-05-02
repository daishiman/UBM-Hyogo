# Cloudflare Workers OpenNext デプロイ仕様 (apps/web)

> 親仕様書: [deployment-cloudflare.md](deployment-cloudflare.md)
> 役割: `apps/web` を `@opennextjs/cloudflare` で Cloudflare Workers へ配信する場合の正本仕様
> 起源: UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`)
> deploy target decision: ADR-0001 (`docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`)

## 1. 適用範囲

`apps/web` の Next.js App Router を Cloudflare Workers + `@opennextjs/cloudflare` で配信する場合の正本仕様。Cloudflare Pages 形式（`pages_build_output_dir = ".next"`）は **廃止**。本ファイルは Workers 形式の運用ルールを集約し、親仕様 `deployment-cloudflare.md` から差分参照される。

`apps/api`（Hono Workers）は本ファイルの対象外。`apps/api` の `wrangler.toml` 仕様は親仕様に残す。

## 2. 形式判定マトリクス

`apps/web/wrangler.toml` がどちらの形式かは以下で識別する。Workers 形式以外は移行または AC 再定義が必要。

| 観測キー | 値 | 判定 |
| --- | --- | --- |
| `pages_build_output_dir` | `.next` 等が存在 | Pages 形式（廃止対象） |
| `main` | `.open-next/worker.js` | OpenNext Workers 形式 |
| `[assets] directory` | `.open-next/assets` | OpenNext Workers 形式 |
| `compatibility_flags` | `["nodejs_compat"]` のみ | 不十分（`main` / `[assets]` と併記必須） |

## 3. wrangler.toml 必須項目

`apps/web/wrangler.toml` は以下を必須項目とする（実値は実ファイルから引用）。

- `name`: top-level Worker 名
- `main = ".open-next/worker.js"`: OpenNext build 成果物
- `compatibility_date >= "2024-09-23"`（理由: `nodejs_compat` の有効化要件）
- `compatibility_flags = ["nodejs_compat"]`
- `[assets]`: `directory` / `binding` / `not_found_handling = "single-page-application"`
- `[observability]`: `enabled = true`（必要に応じて `head_sampling_rate` を追記）
- env 分離: `[env.staging]` / `[env.production]` を独立 Worker として明示
  - 各 env で `name` / `vars` / `assets` / `observability` を再宣言する（top-level 継承に依存しない）

### 実値（apps/web/wrangler.toml）

```toml
name = "ubm-hyogo-web"
main = ".open-next/worker.js"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
not_found_handling = "single-page-application"

[observability]
enabled = true

[vars]
ENVIRONMENT = "production"

[env.staging]
name = "ubm-hyogo-web-staging"

[env.staging.vars]
ENVIRONMENT = "staging"

[env.staging.assets]
directory = ".open-next/assets"
binding = "ASSETS"
not_found_handling = "single-page-application"

[env.staging.observability]
enabled = true

[env.production]
name = "ubm-hyogo-web-production"

[env.production.vars]
ENVIRONMENT = "production"

[env.production.assets]
directory = ".open-next/assets"
binding = "ASSETS"
not_found_handling = "single-page-application"

[env.production.observability]
enabled = true
```

> **注**: `compatibility_date = "2025-01-01"` は `nodejs_compat` 要件 (>= 2024-09-23) を満たす。採用日・確認日・理由は UT-06-FU-A Phase 5 / Phase 13 に記録済。

## 4. .assetsignore の役割と運用

`.assetsignore` は `.open-next/assets/` を Workers Static Assets binding に同梱する際、サーバーコードや開発成果物を除外するための ignore リスト（`.gitignore` 互換）。

- 配置: `apps/web/.assetsignore`
- 役割: assets bundle に `node_modules` / source map / テストファイル等を含めず、Worker bundle size 上限への影響を抑える
- 標準除外: `node_modules` / `.DS_Store` / `.git` / `*.map` / テストファイル

### 実値（apps/web/.assetsignore）

```
node_modules
.DS_Store
.git
*.map
*.test.*
*.spec.*
__tests__
```

## 5. ビルド・デプロイ手順

OpenNext build → `scripts/cf.sh deploy` の 2 段構成。生成物が無い状態の deploy は失敗するため pre-deploy build を必須化する。

```bash
# 1. OpenNext build（.open-next/worker.js と .open-next/assets/ を生成）
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare

# 2. deploy（scripts/cf.sh 経由のみ、wrangler 直接実行禁止）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

`apps/web/package.json` の関連 script:

| script | 用途 |
| --- | --- |
| `build:cloudflare` | `opennextjs-cloudflare build`（deploy 前提） |
| `preview:cloudflare` | `opennextjs-cloudflare build && opennextjs-cloudflare preview`（ローカル確認） |
| `cf-typegen` | `wrangler types ...`（ローカル型生成。deploy 経路統制の対象外） |

deploy script は package.json に置かず、`scripts/cf.sh` 経由に一本化する（OAuth 漏出と esbuild バージョン不整合を防ぐため）。

## 6. Worker bundle size ガード

Cloudflare Workers の bundle size 上限:

| プラン | 上限 |
| --- | --- |
| Free | 3 MiB |
| Paid | 10 MiB |

監視:
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` 実行後の `.open-next/worker.js` サイズを確認
- `wrangler deploy --dry-run` 相当の出力を `scripts/cf.sh` 経由で取得し size を記録

超過時の対応:
- `@opennextjs/cloudflare` の minify を有効化
- RSC payload / server-only dependencies の削減
- それでも収まらない場合は Paid プラン切替判断を文書化（UT-06-FU-A AC-11）

## 7. SPA fallback / 404 ハンドリング

Workers Static Assets binding は Pages のような自動 SPA fallback 推定を行わないため、`not_found_handling` を **明示** する。

- `not_found_handling = "single-page-application"`: 未マッチパスを Worker (`.open-next/worker.js`) にフォールバック
- 未設定の場合: 404 応答が直接返り、Next.js App Router の動的ルートが解決されない

UT-06-FU-A AC-12 で staging 環境の挙動確認を必須化している。

## 8. preview / staging / production の env 分離

Workers Builds の preview 環境は production の env vars / secrets を共有する既知問題があるため、`apps/web/wrangler.toml` で env section を明示的に分離する。

| env | Worker name | 用途 |
| --- | --- | --- |
| top-level | `ubm-hyogo-web` | デフォルト（直接利用しない） |
| `[env.staging]` | `ubm-hyogo-web-staging` | staging 検証 |
| `[env.production]` | `ubm-hyogo-web-production` | 本番 |

各 env は `assets` / `observability` / `vars` を再宣言する（top-level 継承に依存しない）。Workers Builds で preview を併用する場合は、preview build を staging env で動かし、production secrets が混入しないことを `bash scripts/cf.sh secret list` で検証する。

## 9. 旧 Pages プロジェクトの並走方針

UT-28 で先行作成された Cloudflare Pages リソースが残存している場合、以下の判定軸で扱う。

| 状態 | 判定 | 期間 |
| --- | --- | --- |
| Workers 移行直後 | 並走（旧 Pages を rollback 用に保持） | 最低 1 サイクル（次回 production deploy 確認まで） |
| smoke 安定後 | staging 専用に降格 or 削除 | UT-28 側の判定タスクへ移譲 |
| 完全廃止 | DNS / route の Workers 切替後に物理削除 | 別タスクで実施（UT-06-FU-A 範囲外） |

料金重複リスク（Pages + Workers 二重課金）を避けるため、保持期間中は Pages の build trigger を無効化する。詳細は `outputs/phase-02/rollback-plan.md`（UT-06-FU-A）を参照。

## 10. CLI 経路の徹底

- `bash scripts/cf.sh` のみ使用（deploy / rollback / tail / secret put / secret list / d1 / whoami）
- `wrangler` 直接実行 / `pnpm wrangler` / `npx wrangler` は **禁止**
- `wrangler login` の OAuth トークン（`~/Library/Preferences/.wrangler/config/default.toml`）は保持しない。`.env` の `op://` 参照経由で `CLOUDFLARE_API_TOKEN` を動的注入する
- `apps/web/package.json` の `cf-typegen` (`wrangler types ...`) はローカル型生成のため経路統制対象外

詳細は親仕様 `deployment-cloudflare.md` の 「Cloudflare アカウント設定」 章を参照。

## 11. R2 incremental cache（任意採用）

OpenNext Cloudflare は R2 を incremental cache backend に利用可能。本タスク (UT-06-FU-A) では **採用判断を行わず** 別タスク (`UT-06-FU-A-R2-incremental-cache-decision.md`) で扱う。

採用時の切替方法:
- `apps/web/open-next.config.ts` の `defineCloudflareConfig` で `incrementalCache` を `r2IncrementalCache` に指定
- `wrangler.toml` に `[[r2_buckets]]` を env 別に追加（`apps/api` の R2 binding とは別 bucket / 別 binding 名で分離）

## 12. 関連リソース

| 種別 | パス |
| --- | --- |
| 親仕様 | `deployment-cloudflare.md` |
| UT-06 ゲート | `deployment-cloudflare-ut06-gate.md` |
| 苦戦箇所 | `lessons-learned/lessons-learned-ut06-followup-A-opennext-workers-2026-04.md` |
| 親タスク | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` |
| 派生タスク (R2 cache) | `docs/30-workflows/unassigned-task/UT-06-FU-A-R2-incremental-cache-decision.md` |
| 派生タスク (回帰テスト) | `docs/30-workflows/unassigned-task/UT-06-FU-A-open-next-config-regression-tests.md` |
| 派生タスク (route/secret 監視) | `docs/30-workflows/completed-tasks/UT-06-FU-A-production-route-secret-observability.md` |
| production preflight workflow | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| production preflight runbook | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md` |
| route inventory automation follow-up | `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md` |
| Logpush target diff automation | `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/`（implemented script: `scripts/observability-target-diff.sh` / public command: `bash scripts/cf.sh observability-diff`） |
| deploy target ADR | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md` |
| Pages deploy 残の migration task | `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` |

## 13. production route / secret / observability preflight

`[env.production].name = "ubm-hyogo-web-production"` を使う cutover では、production deploy 承認前に workflow-local runbook を参照し、route / custom domain / secret key name / observability target が新 Worker を指すか確認する。これは実測完了ではなく承認前 preflight 手順の正本導線であり、DNS 切替、secret 値の記録、Logpush mutation、旧 Worker 削除は別承認に分離する。

反復性が必要な読み取り確認は、route inventory script と Logpush target diff script で扱う。Logpush / observability target 差分は `bash scripts/cf.sh observability-diff --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web --config apps/web/wrangler.toml` を公開入口とし、内部実装は `scripts/observability-target-diff.sh` と `scripts/lib/redaction.sh` に閉じる。どちらも read-only output と redaction を前提にし、`wrangler` 直接実行ではなく `bash scripts/cf.sh` または repository script 経由に閉じる。

### 13.1 observability target diff の 4 軸

`scripts/observability-target-diff.sh` は新旧 Worker（`--current-worker` / `--legacy-worker`）に対し以下 4 軸を read-only で比較する。値は redaction module 経由で出力する。

| 軸 | 取得対象 | 取得経路 |
| --- | --- | --- |
| R1 Workers Logs (observability) | Worker 設定の `observability` block（enabled / head_sampling_rate / destination） | `wrangler.toml` パース + `bash scripts/cf.sh api-get` |
| R2 Tail consumers | Worker に紐付いた Tail Worker / consumer Worker 名 | Cloudflare API `/accounts/:id/workers/scripts/:name/tails` |
| R3 Logpush jobs | account 配下の Logpush job のうち、destination filter が当該 Worker を指すもの | Cloudflare API `/accounts/:id/logpush/jobs` |
| R4 Analytics Engine datasets | `wrangler.toml` の `[[analytics_engine_datasets]]` binding 名 | `wrangler.toml` パース |

各軸の出力は `=== R<n> <axis> ===` ヘッダ付きの diff block で、新旧 Worker のいずれかにのみ存在する設定を `+` / `-` で示す。既存設定値の変更（`!`）も同 block で表現する。

### 13.2 redaction ルール（`scripts/lib/redaction.sh`）

| ID | 対象 | 振る舞い |
| --- | --- | --- |
| R-01 | Cloudflare API token / Bearer token | `***REDACTED-TOKEN***` に置換 |
| R-02 | Logpush sink URL の query string（`?...`） | `?***REDACTED-QUERY***` に置換しホスト/パスは保持 |
| R-03 | Logpush sink URL の `X-Amz-*` / `X-Goog-*` 認証パラメータ | パラメータごと `***REDACTED-AUTH***` に置換 |
| R-04 | basic 認証の `user:password@` プレフィクス | `***REDACTED-CREDENTIAL***@` に置換 |
| R-05 | account ID / zone ID（32 桁 hex） | 末尾 4 桁のみ残し前段を `*` で marquee |
| R-06 | secret value（`secret_value` / `apiKey` / `token` JSON フィールド） | 値部分を `***REDACTED***` に置換、key 名は保持 |

入力ストリームは `redact_stream` 関数を通してから標準出力へ流すこと。生 Cloudflare API レスポンスを `cat` / `jq` 直結で出力しない。

### 13.3 read-only 保証と 2 経路

| 経路 | 用途 | 副作用 |
| --- | --- | --- |
| `bash scripts/cf.sh observability-diff` | 公開入口。end-to-end diff 出力 | read-only。Cloudflare 状態を変更しない |
| `bash scripts/cf.sh api-get <path>` | observability-target-diff.sh が内部で利用する GET-only ラッパー | HTTP method を `GET` に固定し、token は op 参照経由で揮発注入 |

`wrangler logpush create` / `delete`, `wrangler tail` の起動、Cloudflare API `POST` / `PATCH` / `DELETE` は本 script の責務外であり、別承認 operation に分離する。検証は `bash tests/unit/redaction.test.sh`（11 ケース）と `bash tests/integration/observability-target-diff.test.sh`（18 ケース）で固定する。既存 `references/observability-monitoring.md`（WAE 6 イベント / UptimeRobot / アラート閾値）とは責務が異なる: 本節は production cutover preflight の差分検出、`observability-monitoring.md` は run-time monitoring/alert 設計を扱う。

## 変更履歴

| 日付 | バージョン | 変更内容 |
| --- | --- | --- |
| 2026-05-02 | 1.3.0 | UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 実装反映。Logpush / observability target diff の公開入口を `bash scripts/cf.sh observability-diff`、内部 script を `scripts/observability-target-diff.sh`、redaction module を `scripts/lib/redaction.sh` として正本化。13.1 (R1-R4 4 軸) / 13.2 (redaction R-01〜R-06) / 13.3 (read-only 2 経路) を追記し、`observability-monitoring.md` との責務境界を明示 |
| 2026-05-01 | 1.2.0 | ADR-0001 により apps/web deploy target を Cloudflare Workers + OpenNext に固定。`web-cd.yml` Pages deploy 残と Cloudflare side 切替は `task-impl-opennext-workers-migration-001` へ委譲 |
| 2026-04-30 | 1.1.0 | UT-06-FU-A-PROD-ROUTE-SECRET-001 close-out review 反映。production route / secret / observability preflight の workflow-local runbook 導線と、route inventory / Logpush target diff automation follow-up を追加 |
| 2026-04-29 | 1.0.0 | 新規作成（UT-06-FU-A 反映: OpenNext Workers 形式・`.assetsignore` 運用・env 分離・bundle size ガード・SPA fallback・CLI 経路・R2 cache 採否別タスク化） |
