# Phase 5: 実装（TDD Green）

## 目的

Phase 4 の Red を緑にする。3 lane を **1 実装サイクル / 1 PR（CONST_007）** で完結する。
各変更は lane task spec（`tasks/task-{a,b,c}-*.md`）の Before/After スニペットを正本とし、それを逐語実装する。

> **不変条件**: env 参照は `apps/web/src/lib/env.ts` アクセサ経由のみ（`process.env.*` 直接禁止）。
> D1 直接アクセス禁止（#5）。認証境界は fail-closed（#11）。cf 系 CLI は `scripts/cf.sh` 経由のみ。

## 新規作成 / 修正ファイル一覧（必須・Feedback RT-03）

### Lane A（server fetch service-binding 統一）

| # | パス | 種別 | 参照 |
|---|------|------|------|
| A1 | `apps/web/src/lib/fetch/transport.ts` | **新規** | task-a §2-1 / §3-1 |
| A2 | `apps/web/src/lib/env.ts` | 編集（`getEnvironment` / `getTransportRuntimeIsTest` 追記） | task-a §2-2 / §3-4(B) |
| A3 | `apps/web/src/lib/fetch/authed.ts` | 編集（`getAuthEnv` + `resolveApiFetch` 化） | task-a §3-4(A) |
| A4 | `apps/web/app/api/me/[...path]/route.ts` | 編集（`FALLBACK_INTERNAL_API` 削除 → transport） | task-a §3-4(C) |
| A5 | `apps/web/app/api/admin/[...path]/route.ts` | 編集（`LOCAL_DEV_FALLBACK` 削除 + `process.env` 直参照除去） | task-a §3-4(D) |
| A6 | `apps/web/app/api/auth/magic-link/route.ts` | 編集 | task-a §3-4(E) |
| A7 | `apps/web/app/api/auth/magic-link/verify/route.ts` | 編集 | task-a §3-4(E) |
| A8 | `apps/web/app/api/auth/gate-state/route.ts` | 編集 | task-a §3-4(E) |
| A9 | `apps/web/src/lib/auth/verify-magic-link.ts` | 編集（override 維持 + transport） | task-a §3-4(F) |

### Lane B（client localhost 焼き込み根絶）

| # | パス | 種別 | 参照 |
|---|------|------|------|
| B1 | `apps/web/src/lib/fetch/public.ts` | 編集（`getBaseUrl` を NEXT_PUBLIC 優先 + local 限定 + 非 local throw） | task-b §4-1 |
| B2 | `apps/web/src/lib/env.ts` | 編集（`PublicFetchEnv` に `NEXT_PUBLIC_API_BASE_URL` + `getPublicFetchEnv` 拡張） | task-b §4-2 / §4-3 |
| B3 | `apps/web/wrangler.toml` | 確認のみ（3 ブロックに `NEXT_PUBLIC_API_BASE_URL` 存在＝維持） | task-b §4-4 |
| B4 | `.github/workflows/web-cd.yml` | 確認のみ（両 build step に build env 存在＝維持） | task-b §4-5 |

### Lane C（CF secret parity + grep gate + smoke・全新規）

| # | パス | 種別 | 参照 |
|---|------|------|------|
| C1 | `scripts/diagnose-auth-secret-parity.sh` | **新規**（read-only） | task-c §8.1 |
| C2 | `scripts/cf-secret-put-auth-secret.sh` | **新規**（mutation・user-gated） | task-c §8.2 |
| C3 | `scripts/verify-no-localhost-bake.sh` | **新規**（CI gate） | task-c §8.3 |
| C4 | `scripts/smoke-staging-me.sh` | **新規**（runtime read・user-gated） | task-c §8.4 |
| C5 | `.github/workflows/verify-no-localhost-bake.yml` | **新規**（CI workflow） | task-c §2.5 |

> テストファイル（transport.spec / authed.spec / me route.route.spec / public.spec / env.spec / verify-no-localhost-bake.spec）は Phase 4 で作成済み。

## 実装手順（順序付き）

依存順: **A2（env.ts の `getEnvironment` 等）を最初に置く** → A1（transport.ts）→ A3-A9（consumer）→ B（Lane B が `getEnvironment` を参照するため A2 完了後）→ C（独立・並行可）。

1. **A2 env.ts 追記**: `getEnvironment(rawEnv?)`（`ENVIRONMENT` が staging/production ならその値・他は local）と `getTransportRuntimeIsTest(rawEnv?)`（`NODE_ENV==="test"` or `PLAYWRIGHT_TEST==="1"`）を追加。`getAuthEnv` の戻り値型は変えない（task-a 補足 §2）。
2. **A1 transport.ts 新規**: `ApiTransportEnv` / `ApiTransport` 型 + `resolveApiFetch` + `SERVICE_BINDING_ORIGIN="https://service-binding.local"`。判定優先順は task-a §3-1 の (a)〜(e) を逐語実装。(e) は `throw new Error("resolveApiFetch: API transport unresolved ... in non-local runtime")`。`127.0.0.1` は使わず local fallback は `http://localhost:8787`。
3. **A3 authed.ts**: `getApiBaseEnv` → `getAuthEnv` + `getEnvironment` + `getTransportRuntimeIsTest` + `resolveApiFetch` 経由へ。binding 時は `${SERVICE_BINDING_ORIGIN}${path}`、http 時は `${baseUrl}${path}`。cookie 転送 / accept / `cache:"no-store"` / `AuthRequiredError`（401）/ `FetchAuthedError`（非 2xx）は現状維持。
4. **A4 me route**: `FALLBACK_INTERNAL_API` 定数削除。`subpath = "/me" + tail + url.search` を transport へ。`requireSession`（401）/ cookie・content-type・`x-ubm-dev-session` forward は維持。
5. **A5 admin route**: `LOCAL_DEV_FALLBACK` 削除。`route.ts:22` の `process.env["NODE_ENV"]` / `process.env["ENVIRONMENT"]` 直参照を `getEnvironment()` / `getTransportRuntimeIsTest()` へ置換（AC-5）。`resolveApiFetch` throw は try/catch で既存 500（`internal_api_base_url_missing`）へマップ。`x-internal-auth` / sync bearer / `requireAdmin`(403) は維持。
6. **A6/A7/A8 auth route 3 本**: 各ファイル内 local helper `selectTransport()` で `resolveApiFetch` を呼ぶ。`FALLBACK_INTERNAL_API` 削除。gate-state は `encodeURIComponent(email)` query を subpath に保持。`cf-connecting-ip` forward 維持。
7. **A9 verify-magic-link.ts**: `input.apiBaseUrl` override 時は HTTP 直叩き（既存テスト互換）、無い時は `resolveApiFetch`。`input.fetchImpl` override 維持（無い時のみ binding.fetch 使用）。`temporary_failure` fail-closed / shape 検証は完全維持。
8. **B1 public.ts**: `getBaseUrl()` を `env.NEXT_PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL` 優先、無 + local は `LOCAL_FALLBACK_BASE_URL`（`// localhost-allow:local-fallback` 付き）、無 + 非 local は throw。import に `getEnvironment` 追加。
9. **B2 env.ts**: `PublicFetchEnv` に `NEXT_PUBLIC_API_BASE_URL?:string` 追加。`getPublicFetchEnv` で `processEnv`→`rawEnv` の順に NEXT_PUBLIC を解決（task-b §4-3 After）。
10. **B3/B4 確認**: `wrangler.toml` 3 ブロック + `web-cd.yml` 両 build step に `NEXT_PUBLIC_API_BASE_URL` が存在することを grep 確認（変更不要・削除禁止）。
11. **C1-C4 script 新規**: task-c §8.1-8.4 の骨子を正本に実装。全 script `set -euo pipefail`・cf 系は `scripts/cf.sh` 経由・secret 値/cookie/bearer 非表示。`verify-no-localhost-bake.sh` の検出パターンは `(localhost|127\.0\.0\.1):(8787|8888)`、allowlist タグ `localhost-allow:local-fallback`、test/spec/__tests__ 除外。
12. **C5 CI workflow**: task-c §2.5 の yaml。self-test step + build + gate 実走。

## Lane 間の引き渡し（state）

| from → to | 引き渡し |
|-----------|---------|
| A2 → A1,A3-A9,B1 | `getEnvironment` / `getTransportRuntimeIsTest` を全 consumer が共有（重複定義禁止） |
| A1 → A3-A9 | `resolveApiFetch` / `SERVICE_BINDING_ORIGIN` が transport 選択の単一実装 |
| A,B → C | grep gate allowlist 対象が `env.ts` の local fallback と `public.ts`/`transport.ts` の local 分岐に確定 |

## このフェーズの完了判定（Green）

Phase 4 の全対象 spec が緑。`FALLBACK_INTERNAL_API` / `LOCAL_DEV_FALLBACK` 定数が消滅。
詳細な品質一括判定は Phase 9。
