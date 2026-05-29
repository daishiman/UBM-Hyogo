# fix-admin-fetch-cf-1042-service-binding

[実装区分: 実装完了ローカル検証済み / runtime pending]

status: `implemented_local_runtime_pending / implementation / NON_VISUAL`

## 主問題（1文）

`apps/web` の `fetchAdmin` が staging/production の Cloudflare Workers 上で同一 account の `*.workers.dev` API Worker を raw HTTP fetch しており、Cloudflare の Worker-to-Worker loopback 制限により HTTP 404 + body `error code: 1042` を返してしまい、`/admin/dashboard` を始めとする全 admin Server Component 経路が落ちる。

## why now / why this way

- 公開層 (`fetchPublic`) と auth 層 (`apps/web/src/lib/auth.ts`) は既に同一 issue を解決済みで、`env.API_SERVICE.fetch()` (Service Binding) 経由に切り替え + 非 Workers runtime では HTTP fallback、という pattern が確立している。
- admin 層 (`apps/web/src/lib/admin/server-fetch.ts`) だけが 移行されておらず、`apps/web/wrangler.toml` には既に `API_SERVICE` binding が staging / production 両方に配置されているにも拘らず未使用。
- 既存 pattern の機械的適用で fix できる。新規仕様/設計判断は不要。

## scope

| 対象 | 種別 |
|-----|------|
| `apps/web/src/lib/admin/server-fetch.ts` `fetchAdmin()` | 編集（transport 切替） |
| `apps/web/src/lib/env.ts` | 編集（admin fetch 用 env accessor 追加） |
| `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` | 新規（service binding 経路） |
| `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` | 新規（HTTP fallback 経路） |
| `apps/web/src/lib/env.ts` | 既存 `getEnv()` / accessor を再確認のみ（既に `API_SERVICE` を露出済み） |
| `docs/00-getting-started-manual/specs/` | 影響範囲を Phase 12 で軽く参照更新 |

## scope out（先送りではなく今回サイクル外）

- admin mutation 用 hook 等の client-side fetch（Browser → web Worker → API は今回の loopback 問題と無関係）
- production deploy 実行と production runtime smoke（staging で fix を検証してから user-gated）

## acceptance criteria

| AC | 条件 |
|----|------|
| AC-1 | `fetchAdmin` は Cloudflare Workers runtime かつ `env.API_SERVICE` が存在する場合、必ず `API_SERVICE.fetch()` を経由する |
| AC-2 | `NODE_ENV=test` / `PLAYWRIGHT_TEST=1` で `INTERNAL_API_BASE_URL` が明示されているとき、HTTP fetch にフォールバックする（既存 spec のための backdoor 維持） |
| AC-3 | service binding 経路でも `cookie` / `x-internal-auth` / `content-type` の header と request body は HTTP fetch 経路と同一の意味で伝搬する |
| AC-4 | `unit test` (binding / fallback / error body propagation) すべて green |
| AC-5 | staging deploy 後 `/admin` ダッシュボードが HTTP 200 で render される（runtime smoke は user-gated） |
| AC-6 | `apps/web` の他の admin Server Component 経路（members / meetings / schema 等）も同じ helper を経由するため副次的に CF 1042 が解消する |

## phase 一覧

| Phase | 名称 | 状態 |
|-------|------|------|
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | テスト作成 | completed |
| 5 | 実装 | completed |
| 6 | テスト拡充 | completed |
| 7 | カバレッジ確認 | completed |
| 8 | リファクタリング | completed |
| 9 | 品質保証 | completed |
| 10 | 最終レビュー | completed |
| 11 | 手動テスト | local_evidence_captured_runtime_pending |
| 12 | ドキュメント更新 | completed |
| 13 | PR作成 | spec_created |

implementation_mode: `new`（既存 helper の transport 移行）
visual classification: `NON_VISUAL`（admin page は UI 変更なし、error banner が消えるだけ）
runtime boundary: staging deploy / authenticated `/admin` smoke / tail log / commit / push / PR は user-gated。

## 関連先行 task

- `task-05a-fetchpublic-service-binding-001`（fetchPublic 側の service binding 化、本タスクの参照 pattern）
- `fix-admin-server-components-render-error-stg`（admin SSR error の env accessor 整理、本タスクとは独立）
