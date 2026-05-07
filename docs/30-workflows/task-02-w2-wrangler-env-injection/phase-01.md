# Phase 01 — 要件定義

実装区分: 実装仕様書（CONST_004 デフォルト適用）

## 0. 位置づけ

本タスク `task-02-w2-wrangler-env-injection` は、ui-prototype-alignment-mvp-recovery ワークフローの 02-runtime wave 最上流タスクである。task-01 scope-gate-all-screens の gate 通過後、即着手可能。下流（task-04 / task-05 / task-18）は本タスクが提供する `getEnv()` 公開 API を経由してのみ環境変数にアクセスする。

## 1. 真の論点（Q1〜Q6）

### Q1: `NEXT_PUBLIC_*` を build 時固定にすべきか、runtime 注入にすべきか

**結論**: **両立**。`NEXT_PUBLIC_*` は Next.js 規約で client bundle に焼き込まれるため、build 時に環境別の値を bundler に渡す必要がある。同時に Workers ランタイムからも `[vars]` で参照可能とし、SSR / Server Action からは `getEnv()` 経由でアクセスする。

- ビルドは `wrangler dev` 起動時 → `[vars]` から、`pnpm --filter @ubm-hyogo/web build` → 環境変数 / `.dev.vars` から取得
- client から `getPublicEnv()`、server から `getEnv()` の 2 経路を分離する

### Q2: `wrangler.toml` の env 別 `[vars]` 構造をどう設計するか

**結論**: トップレベル `[vars]` を production の既定値とし、`[env.staging.vars]` で staging override、`[env.production.vars]` で production を再宣言（明示性確保）。**env キーは 3 環境すべてに同名 key を揃える**（key 欠落で parse 失敗を起こさせない）。

### Q3: `getCloudflareContext()` が利用できない runtime（test / build / Node SSR fallback）でのフォールバック戦略

**結論**: `try/catch` で `@opennextjs/cloudflare` の `require` を試み、失敗または `ctx?.env` 未定義時は `process.env` を最終フォールバックとして読む。両経路で同じ zod schema に通すことで型契約を一本化する。

### Q4: zod スキーマの厳格度

**結論**:

- 必須キー: `ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` / `AUTH_URL` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE`
- optional キー: `SENTRY_DSN_WEB` / `AUTH_SECRET`（Cloudflare Secrets 注入のため build / test runtime では存在しないことを許容）
- URL 系は `z.string().url()`、enum 系は `z.enum([...])`、数値は `z.coerce.number().min(0).max(1)`（`SENTRY_TRACES_SAMPLE_RATE`）

### Q5: `.dev.vars.example` の op 参照表記

**結論**: 非 secret は実値の例（`http://127.0.0.1:8787` 等）を直書きし、secret は `op://Personal/UBM Sentry Dev/dsn` のような 1Password 参照のみ記載する。CLAUDE.md「ローカル `.env` の運用ルール」に整合。

### Q6: Cloudflare Secrets と `[vars]` の境界

**結論**:

- `[vars]`: 公開可 / 環境ごとに固定 / 再 deploy で更新（`NEXT_PUBLIC_*` / `ENVIRONMENT` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` / `AUTH_URL` / `*_API_BASE_URL`）
- Cloudflare Secrets: 機密 / `bash scripts/cf.sh secret put` で個別投入 / wrangler.toml に値を書かない（`SENTRY_DSN_WEB` / `AUTH_SECRET`）
- 機械検証: AC-9 で `rg 'SENTRY_DSN_WEB\s*=\s*"http' apps/web/wrangler.toml` 0 件

## 2. Schema / 共有コード Ownership 宣言（再掲）

| 範囲 | 編集権 | 備考 |
| --- | --- | --- |
| `apps/web/wrangler.toml` `[vars]` / `[env.*.vars]` | **本タスク** | env キー集約の正本 |
| `apps/web/wrangler.toml` `[observability]` / instrumentation | task-03 | 本タスクは触らない |
| `apps/web/.dev.vars.example` | **本タスク** | 新規 |
| `apps/web/src/lib/env.ts` | **本タスク** | 新規。公開 API: `EnvSchema` / `Env` / `getEnv()` / `getPublicEnv()` |
| `apps/web/src/lib/__tests__/env.test.ts` | **本タスク** | 新規 |
| `apps/web/next.config.ts` | **本タスク（最小編集）** | `NEXT_PUBLIC_*` 公開キー許可リストのみ |

## 3. AC 確定（index.md の AC-1〜11 を再掲し本 phase で lock）

AC-1〜11 は `index.md` で定義済み。本 phase で以下を確定する:

- AC-1: 3 環境すべてで env キーセット完備
- AC-5: `127.0.0.1:8888` 焼き込み 0 件
- AC-6: `process.env.NEXT_PUBLIC_API_BASE_URL` 直接参照は `env.ts` 以外 0 件
- AC-9: secret 値が wrangler.toml に書かれていない（機械検証）

## 4. 不変条件と本タスクの関係

| 不変条件 | 本タスクとの関係 |
| --- | --- |
| #5 D1 直接アクセスは `apps/api` に閉じる | `apps/web` 側 env キーに D1 binding 名・接続情報を含めない |
| #6 GAS prototype を本番仕様に昇格させない | env キー名・URL 選定で GAS prototype を引かない |
| CLAUDE.md secrets 管理 | `.dev.vars.example` は op 参照のみ、`wrangler` 直接実行禁止（`scripts/cf.sh` 経由） |
| プロトタイプ正本順位 | env 配線は UI 正本順位とは独立（本タスクのスコープでは衝突なし） |

## 5. automation-30 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | OK | 元タスク §4 / §5 / §7 の env キー一覧 / wrangler.toml 差分 / 関数シグネチャは整合 |
| 漏れなし | OK | local / staging / production の 3 環境 + secret / non-secret の 2 軸を網羅 |
| 整合性あり | OK | `getEnv()` の zod schema が wrangler.toml `[vars]` キーセットと完全一致 |
| 依存関係整合 | OK | task-01 上流 gate / task-03 並列調整 / task-04・05・18 下流の `getEnv()` 依存が明示済み |

## 6. 並列タスク（task-03）との競合回避ルール

`apps/web/wrangler.toml` は本タスクと task-03 sentry-workers-sdk-unify が共有編集する可能性がある。以下のルールで競合を回避する:

| セクション | owner |
| --- | --- |
| `[vars]` / `[env.staging.vars]` / `[env.production.vars]` | **本タスク** |
| `[observability]` / Sentry instrumentation 関連設定 | task-03 |
| `name` / `main` / `compatibility_date` 等の build target 設定 | 本タスク先行（既存値維持） |

運用: 本タスクが先に `[vars]` セクションを commit/merge し、task-03 はそれを base に instrumentation を追記する。並列 PR で同一行を編集する状況を作らない。

## 7. エスカレーション条件

以下のいずれかを満たす場合、user に判断を仰ぐ:

- `getCloudflareContext()` の API が `@opennextjs/cloudflare` のバージョン更新で破壊的に変化
- `NEXT_PUBLIC_*` が build 時 fallback でしか効かない既存制約が判明
- staging / production の URL（`*.workers.dev` ホスト名）の確定値が未提供
- Cloudflare Secrets `SENTRY_DSN_WEB` / `AUTH_SECRET` が未投入で staging dry-run が失敗

## 8. 次フェーズへの引き渡し

phase-02（設計）に渡す confirmed inputs:

- env キーセット（§4 元タスク）
- wrangler.toml 差分案（§5 元タスク）
- 関数シグネチャ（§7 元タスク）
- 公開 API 表面: `EnvSchema` / `Env` / `getEnv()` / `getPublicEnv()`
- 競合回避ルール（task-03 と `[vars]` owner 分離）
- AC-1〜11 lock 済み
