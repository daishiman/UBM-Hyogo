# Phase 8: DRY 化

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 整理 / `apps/web/.dev.vars.example` 新規 / `apps/web/src/lib/env.ts` 新規 / `apps/web/src/lib/__tests__/env.test.ts` 新規 / `apps/web/next.config.ts` 最小修正を伴う）

## 8.1 目的

env access 経路を `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` に集約することで、`process.env` 直参照の散在 / 同等 helper の重複 / Sentry 系 env と Auth 系 env の境界曖昧化を防ぐ。task-03（sentry-workers-sdk-unify）との naming 整合も本フェーズで確定する。

## 8.2 集約原則

### 8.2.1 env access の単一エントリポイント

| 層 | 直接参照可否 | 経路 |
|----|------------|------|
| RSC / Server Action / Route Handler | `process.env.*` 禁止 | `getEnv()`（zod parse 済み Env を取得） |
| Client Component | `process.env.NEXT_PUBLIC_*` 禁止 | `getPublicEnv()`（NEXT_PUBLIC_* のみを返す） |
| Build script / next.config.ts | `process.env.*` 許可（build 時 fallback） | 直接参照可。ただし `lib/env.ts` の `EnvSchema` を re-import して型整合を保つ |
| test | `vi.stubEnv` 推奨 | env.test.ts のみ |

### 8.2.2 grep ゲート（Phase 9 で gate 化）

```
rg 'process\.env\.NEXT_PUBLIC_API_BASE_URL' apps/web/src --files-with-matches
```

期待 hit: `apps/web/src/lib/env.ts` のみ（`getPublicEnv()` 内 1 箇所）。ほかに hit がある場合は Phase 8 違反として fail。

```
rg 'process\.env\.SENTRY_DSN_WEB' apps/web/src --files-with-matches
```

期待 hit: `apps/web/src/lib/env.ts` のみ（`readRawEnv()` 経由で間接参照されるためソース上は 0 件想定。Sentry instrumentation は task-03 で `getEnv().SENTRY_DSN_WEB` 経由に統一）。

## 8.3 helper 重複排除

| 既存実装 | 移行先 | 削除対象 |
|---------|--------|---------|
| 任意の `apiBaseUrl()` 系 helper（存在すれば） | `getEnv().NEXT_PUBLIC_API_BASE_URL` | 個別 helper 関数を削除し import 元を `@/lib/env` に統一 |
| `process.env.ENVIRONMENT` 直参照 | `getEnv().ENVIRONMENT` | 全置換 |
| `if (process.env.NODE_ENV === "production")` 系の分岐 | `getEnv().ENVIRONMENT === "production"` に置換（任意・既存ロジックを壊さない範囲で） | 既存 NODE_ENV 分岐は影響範囲が広いため本タスクでは強制しない。task-04/05 で必要に応じ移行 |

> 移行範囲は本 task の §3 変更対象ファイル表に列挙されたファイルに限る。`apps/web/src/**` 全域の grep clean は task-18 regression smoke で最終確認する。

## 8.4 Sentry 系 env と Auth 系 env の境界

| 系統 | env キー | owner | 利用層 |
|------|---------|-------|--------|
| Sentry | `SENTRY_DSN_WEB` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` | 本 task で `EnvSchema` に定義、task-03 で instrumentation 接続 | server / client（DSN は build 時に NEXT_PUBLIC_SENTRY_DSN_WEB として再公開する場合は task-03 で決定） |
| Auth | `AUTH_URL` / `AUTH_SECRET` | 本 task で `EnvSchema` に定義、Auth.js 結線は別 task | server only（`AUTH_SECRET` は client 公開禁止） |
| API base | `NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` | 本 task | server / client（NEXT_PUBLIC_ のみ client） |
| 環境識別 | `ENVIRONMENT` | 本 task | server / client 双方 |

### 境界規則

- **Sentry 系を Auth 系に流用しない**（例: `SENTRY_ENVIRONMENT` を Auth.js の env 判定に使い回さない。Auth は `ENVIRONMENT` を見る）
- **`AUTH_SECRET` を NEXT_PUBLIC_ 経由で公開しない**（zod schema 上も `NEXT_PUBLIC_AUTH_SECRET` は禁止キーとして増やさない）
- **`SENTRY_DSN_WEB` は本 task では server-side env として扱う**。client 側 DSN 公開（NEXT_PUBLIC_SENTRY_DSN_WEB）の判断は task-03 に委譲し、必要になった時点で `EnvSchema` に追加する

## 8.5 task-03 との naming 整合

task-03 sentry-workers-sdk-unify が参照する env キー名を本 task で先行定義することで、merge order に依らず両 task が同じ key 名で env を読めるようにする。

| キー | 値の型 | local | staging | production | 備考 |
|------|--------|-------|---------|------------|------|
| `SENTRY_DSN_WEB` | URL | op 参照 | Cloudflare Secret | Cloudflare Secret | server-side のみ |
| `SENTRY_ENVIRONMENT` | enum(local/staging/production) | `local` | `staging` | `production` | wrangler.toml `[vars]` |
| `SENTRY_TRACES_SAMPLE_RATE` | number(0..1) | `1.0` | `0.2` | `0.1` | `z.coerce.number()` で string→number |

> task-03 はこの 3 キーを `getEnv()` 経由でのみ参照する。task-03 内で独自 helper を作らない。

## 8.6 重複排除チェックリスト

- [ ] `apps/web/src/lib/env.ts` 以外で `process.env.NEXT_PUBLIC_*` の直接参照が 0 件（`lib/env.ts` の `getPublicEnv()` 内 1 箇所のみ許可）
- [ ] env を返す独自 helper（例: `getApiBaseUrl()`, `apiUrl()`）が存在しない
- [ ] Sentry / Auth / API base / 環境識別の 4 系統が `EnvSchema` 内で論理的にグルーピング（コメントで境界を可視化）されている
- [ ] task-03 が参照する 3 キー（SENTRY_*）が本 task の `EnvSchema` に存在する

## 8.7 next.config.ts の最小修正

`next.config.ts` での `env` 公開キー許可リスト追記は **NEXT_PUBLIC_* で十分にカバーされる場合は不要**。OpenNext for Cloudflare では Workers `[vars]` 経由で注入されるため、`env` block への明示登録は build 時 fallback 用途に限る。本 task では既存 `next.config.ts` を変更せずに済むよう優先し、build error が出た場合のみ最小追記する。

## 8.8 次フェーズへの引き渡し

Phase 9 品質保証では、本フェーズの集約原則に対する grep ゲートを実コマンドとして実行し、evidence を `outputs/phase-09/` に固定する。
