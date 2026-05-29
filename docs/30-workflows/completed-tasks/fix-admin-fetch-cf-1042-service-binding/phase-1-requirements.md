# Phase 1: 要件定義

## タスク分類

- task type: bug fix / runtime infra fix
- visual classification: NON_VISUAL（UI 変更なし）
- implementation_mode: `new`

## 現状観測（staging 2026-05-28）

- URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin`
- UI 表示: `ダッシュボード の読み込みに失敗しました / admin api /admin/dashboard failed: 404 body=error code: 1042 / code ADMIN_FETCH_404`
- network: dashboard ページ自体は 200 で返るが、その内側で行われる SSR fetch `GET /admin/dashboard` が 404 + body `error code: 1042` を返す

## 主問題

Cloudflare Workers が同一 account の別 Worker (`*.workers.dev`) に対して raw HTTP fetch すると、Cloudflare edge が loopback を拒否し HTTP 404 + body `error code: 1042` を返す。`apps/web/src/lib/admin/server-fetch.ts` の `fetchAdmin()` がこの経路を使っている。

## 根拠（コード調査）

- `apps/web/wrangler.toml` L41-43 / L68-70: `API_SERVICE` service binding は staging / production の両環境で既に配置済み
  ```
  [[env.staging.services]]
  binding = "API_SERVICE"
  service = "ubm-hyogo-api-staging"
  ```
- `apps/web/src/lib/fetch/public.ts`: `getServiceBinding()` で `env.API_SERVICE.fetch()` を最優先する pattern が確立済み（コメント L1-15 に「同一 account workers.dev への外向き fetch loopback 404 を回避」と明記）
- `apps/web/src/lib/auth.ts` L124: auth 層も `e.API_SERVICE` を優先利用
- `apps/web/src/lib/admin/server-fetch.ts` L最終ブロック: raw `fetch(url, ...)` のみ。Service binding 未使用

## 既存 API surface 命名規則（揃えるべき pattern）

- 同期関数: `getServiceBinding()` / `getBaseUrl()` / `isTestOrPlaywright()`
- transport log: `logTransport(transport: "service-binding" | "http-fallback", path, status)`
- env accessor は必ず `getEnv()` / `getPublicFetchEnv()` 経由（invariant: process.env 直参照禁止）

## 受入条件

index.md の AC-1〜AC-6 を継承。

## 制約

- CLAUDE.md invariant #5: `apps/web` から D1 binding 直接アクセス禁止 → 引き続き API Worker 経由
- env 参照は `apps/web/src/lib/env.ts` の accessor 経由（`task-02 wrangler-env-injection` 不変条件）
- service binding 経由の request では URL の host は無視されるが、URL parse のための placeholder host を渡す必要がある（`https://service-binding.local${path}` パターン）

## inventory

- 編集: `apps/web/src/lib/admin/server-fetch.ts`
- 新規 spec: `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts`
- 新規 spec: `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts`
- 参照確認のみ: `apps/web/src/lib/env.ts`, `apps/web/wrangler.toml`

## artifact 命名 canonical

| phase | artifact name |
|-------|---------------|
| 4 | `outputs/phase-4/test-design.md` |
| 5 | `outputs/phase-5/implementation-summary.md` |
| 10 | `outputs/phase-10/final-review-result.md` |
| 11 | `outputs/phase-11/main.md` |
| 12-1 | `outputs/phase-12/implementation-guide.md` |
| 12-2 | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 | `outputs/phase-12/documentation-changelog.md` |
| 12-4 | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 | `outputs/phase-12/skill-feedback-report.md` |
| 12-6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
