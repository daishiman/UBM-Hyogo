# Phase 05 — 実装

## 1. 新規作成 / 修正ファイル一覧（FB-RT-03・必須）

| # | パス | 区分 | 内容 |
| --- | --- | --- | --- |
| F-1 | `apps/web/src/lib/fetch/transport-select.ts` | **新規** | 共通 util。`TransportKind` / `SelectTransportResult` / `stripTrailingSlash` / `resolveServiceBinding` / `selectAndFetch` を export |
| F-2 | `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` | **新規** | util 単体テスト（Phase 04・T-1〜T-14） |
| F-3 | `apps/web/app/api/admin/[...path]/route.ts` | 修正 | admin mutation の transport 分岐（96-113 相当）を util 経由へ切替。`adminServiceBinding` は呼び出し側固有 boolean を保存する delegate wrapper として維持 |
| F-4 | `apps/web/src/lib/admin/server-fetch.ts` | 修正 | admin read の transport 分岐（554-562 相当）を util 経由へ切替。`getAdminServiceBinding` は delegate wrapper として維持・`logAdminTransport` を log fn 注入 |
| F-5 | `apps/web/src/lib/fetch/public.ts` | 修正 | public read の transport 分岐（66-77 相当）を util 経由へ切替。`getServiceBinding` は delegate wrapper として維持・`logTransport` を log fn 注入 |

> 回帰 5 spec（`route.spec.ts` / `server-fetch.{binding,http-fallback,env}.spec.ts` / `public.spec.ts`）は**編集しない**。

## 2. 実装順序（直列・依存: util → 呼び出し側）

1. **F-1 util 新規作成**（phase-02 §2 のコードをそのまま実装）。`stripTrailingSlash` / `resolveServiceBinding` / `selectAndFetch` を export。util 内で `process.env.*` を直接参照しない・127.0.0.1 系文字列を一切書かない。
2. **F-2 spec を red → green 化**（Phase 04 のケースが PASS）。
3. **F-3 route.ts 切替** → typecheck/lint → `route.spec.ts` 緑確認。
4. **F-4 server-fetch.ts 切替** → typecheck/lint → `server-fetch.*.spec.ts` 緑確認。
5. **F-5 public.ts 切替** → typecheck/lint → `public.spec.ts` 緑確認。
6. 静的締め: 焼き込み grep / 真理値表整合確認。

各呼び出し側は 1 ファイルずつ切替・回帰確認する（drift を局所化し、red が出た時点で原因ファイルを一意に特定できる）。

## 3. 呼び出し側 Before/After（挙動不変マッピング）

### 3.1 F-3 `route.ts`（admin mutation）

| 観点 | Before | After |
| --- | --- | --- |
| binding 解決 | `adminServiceBinding(env)` ヘルパー（`isTestOrPlaywright(env) && env.INTERNAL_API_BASE_URL ? undefined : env.API_SERVICE`） | `resolveServiceBinding({ binding: env.API_SERVICE, disableBinding: isTestOrPlaywright(env) && Boolean(env.INTERNAL_API_BASE_URL) })` |
| 分岐実行 | `if (binding) binding.fetch(...) else { base=apiBase(env); base===null → 500; fetch(...) }` | `selectAndFetch({ binding, resolveBase: () => apiBase(env) }, upstreamPath, init)`（**log 渡さない＝ログ無し維持**） |
| base-unavailable | `apiBase(env)===null` で 500 JSON Response | `result.kind==="base-unavailable"` で同一 500 JSON Response |
| 据え置き | `isTestOrPlaywright`（`process.env["NODE_ENV"]==="test" \|\| process.env["PLAYWRIGHT_TEST"]==="1" \|\| env.ENVIRONMENT==="local"`）・`apiBase`・`LOCAL_DEV_FALLBACK`（127.0.0.1:8787）・secret/header 構築・`upstream.text()` 後処理 | 同左（util へ移送しない） |

- import: `import { resolveServiceBinding, selectAndFetch } from "../../../../src/lib/fetch/transport-select";`
- `adminServiceBinding` ヘルパーは route.ts 固有の `disableBinding` 計算を閉じ込める delegate wrapper として維持する。
- `LOCAL_DEV_FALLBACK` は route.ts に残す（task-18 gate・util へ移送禁止）。

### 3.2 F-4 `server-fetch.ts`（admin read）

| 観点 | Before | After |
| --- | --- | --- |
| binding 解決 | `getAdminServiceBinding()`（`isTestOrPlaywright() && INTERNAL_API_BASE_URL ? undefined : API_SERVICE`） | `resolveServiceBinding({ binding: getAdminFetchEnv().API_SERVICE, disableBinding: isTestOrPlaywright() && Boolean(getAdminFetchEnv().INTERNAL_API_BASE_URL) })` |
| 分岐実行 | `if (binding) binding.fetch(...)+logAdminTransport else { base=resolveApiBase(); fetch(...)+logAdminTransport }` | `selectAndFetch({ binding, resolveBase: () => resolveApiBase(), log: logAdminTransport }, path, init)` |
| base-unavailable | 発生しない（`resolveApiBase()` は常に string） | `result.kind==="base-unavailable"` は**到達しない防御分岐**（型網羅性のため throw `AdminFetchError` などで握り、実行時は常に response 経路） |
| log | `logAdminTransport(kind, path, status)`（`scope:"admin"`） | 同 fn を `log` として注入（scope:admin 維持） |
| 据え置き | `isTestOrPlaywright`（`env.NODE_ENV==="test" \|\| env.PLAYWRIGHT_TEST==="1"`・`local` 条件なし）・`resolveApiBase`・`!res.ok` / 404 warn / `AdminFetchError` throw 後処理 | 同左 |

- import: `import { resolveServiceBinding, selectAndFetch } from "../fetch/transport-select";`
- `getAdminServiceBinding` は admin read 固有の env 判定を閉じ込める delegate wrapper として維持する。
- `resolveApiBase()` は常に string を返すため base-unavailable 非到達。型上の網羅のための防御のみ実装する（実行時挙動は不変）。

### 3.3 F-5 `public.ts`（public read）

| 観点 | Before | After |
| --- | --- | --- |
| binding 解決 | `getServiceBinding()`（`isTestOrPlaywright() && PUBLIC_API_BASE_URL ? undefined : API_SERVICE`） | `resolveServiceBinding({ binding: getPublicFetchEnv().API_SERVICE, disableBinding: isTestOrPlaywright() && Boolean(getPublicFetchEnv().PUBLIC_API_BASE_URL) })` |
| 分岐実行 | `if (binding) binding.fetch(...)+logTransport else { base=getBaseUrl(); fetch(...)+logTransport }` | `selectAndFetch({ binding, resolveBase: () => getBaseUrl(), log: logTransport }, path, effectiveInit)` |
| base-unavailable | 発生しない（`getBaseUrl()` は常に string・DEFAULT `http://localhost:8787`） | 到達しない防御分岐 |
| log | `logTransport(kind, path, status)`（scope 無し） | 同 fn を `log` として注入（scope 無し維持） |
| 据え置き | `isTestOrPlaywright`（`env.NODE_ENV==="test" \|\| env.PLAYWRIGHT_TEST==="1"`）・`getBaseUrl`・**PLAYWRIGHT cache bypass（`effectiveInit`）は `doFetch` に残す** | 同左 |

- import: `import { resolveServiceBinding, selectAndFetch } from "./transport-select";`
- `getServiceBinding` は public read 固有の env 判定を閉じ込める delegate wrapper として維持する。
- cache bypass は transport 選択の外側（request 構築）であり util に持ち込まない。`effectiveInit` を `selectAndFetch` の `init` 引数として渡す。

## 4. 実装・検証コマンド

```bash
# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# Lint
mise exec -- pnpm --filter @ubm-hyogo/web lint

# util 単体 + 回帰 5 ファイル（ルートから config 指定）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/app/api/admin/[...path]/route.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/fetch/public.spec.ts

# 焼き込み gate（127.0.0.1:8888 が apps/web/src 配下に新規追加されていないこと）
grep -rn "127.0.0.1:8888" apps/web/src || echo "OK: 8888 焼き込みなし"
grep -rn "127.0.0.1" apps/web/src/lib/fetch/transport-select.ts || echo "OK: util に 127.0.0.1 系なし"
```

## 5. DoD（Definition of Done）

- [x] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` がエラー 0。
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web lint` が違反 0。
- [x] util 単体（`transport-select.spec.ts`）+ 回帰 5 ファイルが**全 PASS**（6 files / 44 tests）。
- [x] 焼き込み grep: `apps/web/src` 配下に `127.0.0.1:8888` の新規追加なし。`transport-select.ts` に 127.0.0.1 系文字列なし。
- [x] 旧ヘルパー `adminServiceBinding` / `getAdminServiceBinding` / `getServiceBinding` は delegate wrapper として残し、transport 選択本体は `resolveServiceBinding` / `selectAndFetch` へ統一されている。
- [x] 挙動不変: phase-01 §4-7 真理値表（isTestOrPlaywright / 無効化条件 / fallback 解決 / ログ shape）と実装が完全整合。route.ts はログ無し維持・base-unavailable 時 500 維持。
- [x] util から `process.env.*` 直接参照なし。route.ts の既存 `process.env` 併用を新規に増やしていない。
