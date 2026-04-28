# Phase 1: 既存資産インベントリ

## 1. アプリケーション設定

### 1.1 `apps/api/wrangler.toml`

```toml
name = "ubm-hyogo-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
SHEET_ID = "10XQqUko2A5jFXT-J0ibvPt3KUX56divqEk6kDccH5vw"
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"

[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-prod"
database_id = "<PROD_D1_DATABASE_ID>"   # 実値: 直書きあり (Phase 8 で DRY 化検討)

[env.staging]
name = "ubm-hyogo-api-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
SHEET_ID = "10XQqUko2A5jFXT-J0ibvPt3KUX56divqEk6kDccH5vw"
FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "<STAGING_D1_DATABASE_ID>"
```

**所見:**
- 明示的な `[env.production]` セクションは **存在しない**。トップレベル設定が production デフォルトとして動作する構造。
- `wrangler deploy --env production` 実行時はトップレベル `[vars]` および `[[d1_databases]]` が適用される。
- KV / R2 / Queue / Service binding は未設定 (現時点で利用していない)。
- `[vars]` の `SHEET_ID` / `FORM_ID` が production と staging で重複定義されている → Phase 8 DRY 化対象。

### 1.2 `apps/web/wrangler.toml`

```toml
name = "ubm-hyogo-web"
pages_build_output_dir = ".next"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

[env.staging]
name = "ubm-hyogo-web-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
```

**所見:**
- `pages_build_output_dir = ".next"` は **Pages 形式** の設定。CLAUDE.md は「Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare`」と定義しており **OpenNext Workers 形式 (`.open-next/`)** との整合性が課題。
- 本タスクでは「現状の wrangler.toml を尊重しつつ、OpenNext Workers 形式への移行は別タスクで実施」を方針とする。Phase 2 設計で両形式の差異を明示する。
- D1 / KV / R2 binding は未設定 (`apps/web` から D1 直接アクセス禁止 = CLAUDE.md 不変条件 5 と整合)。

## 2. データスキーマ・マイグレーション

| パス | 内容 |
| --- | --- |
| `apps/api/migrations/` | D1 マイグレーション SQL ディレクトリ |
| `apps/api/migrations/0001_init.sql` | 初期スキーマ (1 件のみ) |

→ Phase 5 ステップ 2 で `wrangler d1 migrations apply` の対象は 1 件。

## 3. ランタイム・ツール固定

### 3.1 `.mise.toml`

```toml
[tools]
node = "24.15.0"
pnpm = "10.33.2"

[env]
NODE_ENV = "development"
```

### 3.2 実機 CLI バージョン (取得時点)

| ツール | バージョン | 期待値 | 判定 |
| --- | --- | --- | --- |
| wrangler | 4.84.1 | 3.x 以上 | PASS (上位互換) |
| Node (mise 固定) | 24.15.0 | 24.15.0 | PASS |
| pnpm (mise 固定) | 10.33.2 | 10.33.2 | PASS |

> 備考: 一部のシェル環境では mise 未経由の Node v22.21.1 が解決される可能性あり。本タスクでは必ず `mise exec --` 経由で実行する。

## 4. monorepo 構造

| ディレクトリ | 役割 |
| --- | --- |
| `apps/api/` | Cloudflare Workers (Hono) - API レイヤー |
| `apps/web/` | Cloudflare Workers (Next.js via `@opennextjs/cloudflare`) - Web UI |
| `packages/shared/` | 共通型・スキーマ等 |
| `apps/api/migrations/` | D1 マイグレーション SQL |
| `apps/api/src/` | API ソース |

## 5. package scripts (主要)

実機 `package.json` の主要スクリプト (root):

| script | 用途 |
| --- | --- |
| `pnpm build` | 全 workspace ビルド |
| `pnpm typecheck` | 型チェック |
| `pnpm lint` | リント |
| `pnpm test` | テスト |
| `pnpm --filter @ubm-hyogo/web build:cloudflare` | OpenNext Workers ビルド (期待) |
| `pnpm --filter @ubm-hyogo/api build` | API Workers ビルド (期待) |
| `pnpm --filter @ubm-hyogo/api db:migrations:apply:prod` | (存在する場合) D1 production マイグレーション apply |

> 実 script 名は実行直前に再確認すること。

## 6. 上流タスク完了状態

| タスク | パス | 状態 |
| --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | `docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/` | completed (ディレクトリ存在) |
| 03-serial-data-source-and-storage-contract | `docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/` | completed |
| 04-serial-cicd-secrets-and-environment-sync | `docs/30-workflows/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/` | in-progress / pending (要確認) |
| 05b-parallel-smoke-readiness-and-handoff | `docs/30-workflows/01-infrastructure-setup/05b-parallel-smoke-readiness-and-handoff/` | in-progress / pending (要確認) |
| UT-04 (D1 スキーマ) | (派生) | 上記 03-serial に含まれる |
| UT-05 (CI/CD) | (派生) | 推奨だが必須ではない (手動デプロイで代替可) |

→ 04-serial / 05b-parallel の handoff PASS は Phase 4 verify suite で再確認すること。

## 7. Cloudflare resource 命名規則

| 項目 | local | staging | production |
| --- | --- | --- | --- |
| Workers (apps/api) name | n/a | `ubm-hyogo-api-staging` | `ubm-hyogo-api` |
| Workers (apps/web) name | n/a | `ubm-hyogo-web-staging` | `ubm-hyogo-web` |
| D1 database_name | (local emulation) | `ubm-hyogo-db-staging` | `ubm-hyogo-db-prod` |
| D1 binding name | `DB` (共通) | `DB` (共通) | `DB` (共通) |
| Vars `ENVIRONMENT` | development | staging | production |

→ kebab-case を採用、`ubm-hyogo-{purpose}-{env}` パターン (production は接尾辞無しまたは `-prod`)。

## 8. 課題・不整合候補 (Phase 2 へ引き継ぎ)

1. **OpenNext Workers vs Pages 形式の混在**: `apps/web/wrangler.toml` の `pages_build_output_dir = ".next"` は Pages 形式。OpenNext Workers (`.open-next/`) への移行整合性を Phase 2 で明確化する。
2. **`[env.production]` セクション不在**: `apps/api/wrangler.toml` でトップレベル設定が production 扱い。Phase 8 DRY 化で `[env.production]` 明示化を検討。
3. **database_id 直書き**: 実 UUID が wrangler.toml に直書きされている (機密度低だが Phase 8 / Phase 9 で扱い方針を確定)。
4. **重複 `[vars]`**: `SHEET_ID` / `FORM_ID` が production / staging で同一値を重複定義 → Phase 8 で共通化方針確定。
