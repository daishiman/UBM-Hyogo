# Phase 1 — 要件定義

## 背景

staging `/admin/meetings` (および類似の admin route 群) で SSR から `safeServerFetch` を経由した API 呼び出しが `ADMIN_FETCH_404` を返す。`AdminSectionErrorClient` が "section が表示できません" を出して画面全体が機能しない状態が再現する。

API 側ルート (`apps/api/src/routes/admin/meetings.ts` の `GET /meetings`) は正常実装・mount 済 (`app.route("/admin", adminMeetingsRoute)`)。`/healthz` `/admin/healthz` は 200 を返すため API 自体は到達可能。

## 根本原因

`apps/web/src/lib/admin/server-fetch.ts` の `fetchAdmin` が HTTP fetch (`${INTERNAL_API_BASE_URL}${path}`) のみで実装されており、`API_SERVICE` Workers service-binding を使っていない。同一 Cloudflare アカウントの `*.workers.dev → *.workers.dev` 外向き HTTP fetch は loopback 404 を返す既知挙動が staging で再現する。

公開 fetch (`apps/web/src/lib/fetch/public.ts`) は service-binding 経由 (`env.API_SERVICE.fetch()`) を最優先しており、この問題を構造的に回避済み。admin 経路だけ未対応。

## 受け入れ基準 (AC)

- AC-1: `fetchAdmin` が production / staging で `env.API_SERVICE.fetch()` を最優先で使うこと(HTTP fetch は test / Playwright / local dev で fallback)
- AC-2: service-binding 経由でも `x-internal-auth` ヘッダと `cookie` が同等に転送されること
- AC-3: error path で response body snippet (256 文字) を message に含める既存契約を維持
- AC-4: 既存 fixture 経路 (`PLAYWRIGHT_TASK18_SMOKE` / `PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE` 等) は変更しない
- AC-5: 新規 vitest spec で「service-binding 提供時は binding.fetch を呼び、HTTP fetch を呼ばない」を assert
- AC-6: 新規 vitest spec で「service-binding 未提供時は INTERNAL_API_BASE_URL の HTTP fetch を呼ぶ」を assert
- AC-7: 新規 vitest spec で「test / Playwright runtime かつ service-binding 提供時でも HTTP fallback を許容する分岐」を assert
- AC-8: 既存 admin server-fetch 系 vitest が全て pass
- AC-9: 既存 `safe-server-fetch-404-vs-401.spec.ts` 等 SafeResult 系 spec が全て pass
- AC-10: staging deploy 後、authenticated `/admin/meetings` が 200 を返し UI に list が描画されること(user-gated runtime evidence)

## スコープ

含む:
- `apps/web/src/lib/admin/server-fetch.ts` の `fetchAdmin` を service-binding 優先に書き換え
- 必要に応じ `apps/web/src/lib/env.ts` の admin 系 env accessor から `API_SERVICE` を expose する経路の整流(既存 `getAuthEnv` / `getEnv` 内で取得可能であれば追加せず)
- 新規 vitest spec 追加 (`apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts`)

含まない:
- API 側 (`apps/api/`) のコード変更
- D1 schema 変更
- 他 admin route の UI / contract 変更
- `safe-server-fetch.ts` の signature 変更(内部呼び出しのみ更新)
- Public fetch (`apps/web/src/lib/fetch/public.ts`) の変更
