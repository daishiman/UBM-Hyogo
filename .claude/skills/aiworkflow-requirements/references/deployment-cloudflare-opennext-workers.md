# Cloudflare Workers OpenNext デプロイ仕様 (apps/web)

> 親仕様書: [deployment-cloudflare.md](deployment-cloudflare.md)
> 役割: `apps/web` を `@opennextjs/cloudflare` で Cloudflare Workers へ配信する場合の正本仕様
> 起源: UT-06-FU-A (`docs/30-workflows/ut-06-followup-A-opennext-workers-migration/`)

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
| 派生タスク (route/secret 監視) | `docs/30-workflows/unassigned-task/UT-06-FU-A-production-route-secret-observability.md` |

## 変更履歴

| 日付 | バージョン | 変更内容 |
| --- | --- | --- |
| 2026-04-29 | 1.0.0 | 新規作成（UT-06-FU-A 反映: OpenNext Workers 形式・`.assetsignore` 運用・env 分離・bundle size ガード・SPA fallback・CLI 経路・R2 cache 採否別タスク化） |
