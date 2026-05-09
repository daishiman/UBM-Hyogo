# Phase 4: データ / 状態（init flag / env キー一覧 / Cloudflare Secrets 投入）

## 目的

本 task が触れる「ランタイム状態」と「外部設定値」を 1 ヶ所に集約し、env キーの正規化と Cloudflare Secrets / `[vars]` への投入手順を確定する。task-02 が wrangler.toml を編集する際の正本テーブルを提供する。

## ランタイム状態（in-memory / global）

| 状態 | 配置 | 型 | 用途 | 寿命 |
| --- | --- | --- | --- | --- |
| `initialized`（モジュールスコープ） | `instrumentation.ts` | `boolean` | `register()` 内の早期 return | worker isolate 単位 |
| `globalThis.__ubmSentryInitialized__` | server runtime | `boolean \| undefined` | HMR / 再 import 越しの二重 init 防止 | worker isolate / Node プロセス単位 |
| `window.__ubmSentryInitialized__` | client runtime | `boolean \| undefined` | Next.js client navigation 越しの二重 init 防止 | Browser tab 単位 |

> いずれも書き込みは init 経路（`register()` / `instrumentation-client.ts` トップレベル）に閉じる。`capture.ts` からは **read-only**。

## env キー一覧（task-02 と整合）

| キー | 配置 | 型 | server / client | 既定 / fallback | 備考 |
| --- | --- | --- | --- | --- | --- |
| `SENTRY_DSN_WEB` | Cloudflare Secrets | `string?` | server | 未設定なら init skip | `bash scripts/cf.sh secret put` で投入。正本 secret 名は `deployment-secrets-management.md` の Web DSN に合わせる |
| `SENTRY_ENVIRONMENT` | wrangler `[vars]` | `'local' \| 'staging' \| 'production'` | server + client（client は `NEXT_PUBLIC_SENTRY_ENVIRONMENT` 経由） | `'local'` | local では `enabled: false` |
| `SENTRY_TRACES_SAMPLE_RATE` | wrangler `[vars]` | `string`（数値文字列） | server + client | `'0.1'` | `Number()` で変換 |
| `NEXT_PUBLIC_SENTRY_DSN` | wrangler `[vars]` | `string?` | client | 未設定なら client init skip | client DSN は公開前提（Sentry 仕様） |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | wrangler `[vars]` | 同上 | client | `SENTRY_ENVIRONMENT` と同値で設定 | build inject |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | wrangler `[vars]` | `string` | client | `'0.1'` | build inject |

## Cloudflare Secrets / `[vars]` 投入手順

```bash
# Secrets（server 用 DSN）
bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh secret put SENTRY_DSN_WEB --config apps/web/wrangler.toml --env production

# 確認
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production

# [vars]（client DSN・environment・sample rate）は wrangler.toml に直接記述（task-02 で配置）
# 例: apps/web/wrangler.toml の [env.staging.vars] セクション
#   NEXT_PUBLIC_SENTRY_DSN = "https://xxx@oN.ingest.sentry.io/yyy"
#   NEXT_PUBLIC_SENTRY_ENVIRONMENT = "staging"
#   NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = "0.1"
#   SENTRY_ENVIRONMENT = "staging"
#   SENTRY_TRACES_SAMPLE_RATE = "0.1"
```

> CLAUDE.md「`wrangler` を直接呼ばない」「`scripts/cf.sh` 経由のみ」のポリシーを遵守。`scripts/cf.sh` は op run + esbuild バイナリ整合 + `mise exec --` を一括で行うラッパー。

## ローカル `.env` 運用

`.env`（リポジトリにコミットしない）には実値を書かず `op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn` 等の参照のみを書く。`scripts/with-env.sh` が `op run --env-file=.env` で揮発的に注入する。

## `getEnv()` 経路（task-02 受領前提）

```ts
// apps/web/src/lib/env.ts（task-02 で配置）
export function getEnv(ctx?: { env?: CloudflareBindings }): {
  SENTRY_DSN_WEB?: string;
  SENTRY_ENVIRONMENT: "local" | "staging" | "production";
  SENTRY_TRACES_SAMPLE_RATE: number;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  // ...
};
```

本 task は `getEnv` の **読み取り側**であり、定義は task-02 に閉じる。task-02 が `getEnv` を export していない場合は本 task の実装は blocking（Phase 9 で結線確認）。

## 実行タスク（チェックリスト）

- [ ] env キー表を本 phase で確定し task-02 仕様書に転記依頼
- [ ] Cloudflare Secrets / `[vars]` 投入手順を Phase 10（deploy）と整合
- [ ] ローカル `.env` には `op://...` 参照のみ書くポリシーを Phase 6 実装に反映
- [ ] `getEnv()` の戻り値型に Sentry 関連 6 キーが含まれることを task-02 仕様で確認
- [ ] `process.env.SENTRY_DSN` 直接参照禁止（CI grep gate を Phase 8 で設置）

## 入力 / 出力

| 種別 | 内容 |
| --- | --- |
| 入力 | 元タスク §6 / §7、task-02 の env スキーマ |
| 出力 | env キー一覧表、Secrets 投入コマンド表、global 状態表 |

## 参照資料

- 元タスク §6「入力 / 出力 / 副作用」, §7「DSN / Secrets 取扱い」
- `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」「ローカル .env の運用ルール」
- task-02 仕様書（env 注入経路）

## 成果物

- 本 phase-04.md の env / state 表
- `outputs/phase-04/main.md`（executed 時、本仕様書では未生成）

## 完了条件（DoD）

- [ ] env キー 6 件が表で網羅
- [ ] Cloudflare Secrets / `[vars]` の投入コマンドが `scripts/cf.sh` 経由で記述済
- [ ] global 状態 3 件（module-scope / globalThis / window）が表で識別
- [ ] `getEnv()` 受領前提が task-02 と整合

## 統合テスト連携

- `apps/web/src/lib/env.ts` の `SENTRY_DSN_WEB` 型と `instrumentation.ts` の参照名を同じ focused test / typecheck で確認する。
- `NEXT_PUBLIC_SENTRY_DSN` は browser bundle 用の公開 DSN として、`SENTRY_DSN_WEB` と混同しない grep gate を Phase 11 に渡す。

## メタ情報

- workflow: task-03-w2-par-sentry-workers-sdk-unify
- phase: 4
- status: `implemented-local / completed`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
