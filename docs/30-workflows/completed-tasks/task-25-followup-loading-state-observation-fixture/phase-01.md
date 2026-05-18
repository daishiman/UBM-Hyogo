# Phase 1: 要件定義

`[実装区分: 実装仕様書]`

## 目的

`apps/web/app/loading.tsx`（および route group 単位の `loading.tsx`）の runtime 観測を、flaky network sleep に依存せず deterministic に行える staging smoke fixture を確立する。これにより `SMOKE-COVERAGE-MATRIX.md` 行 19 の `N/A-runtime-observation` を実観測ステータスへ置換する。

## 背景

- Issue #711 は CLOSED だが、根本問題（runtime 観測の欠如）は未解決。
- 同 follow-up の error-boundary 側（Issue #710）は `apps/web/app/smoke/error-boundary/page.tsx` で実装済。同じ pattern を踏襲することで設計コストを最小化できる。
- `apps/web/playwright/tests/auth-and-shared.spec.ts` の `*-loading` ケースは `parallel-07-harness?view=*-loading` query 経由の静的 visual snapshot で、Next.js Suspense / `loading.tsx` を route-level に発火させた runtime 観測ではない。

## 機能要件

| ID | 要件 |
|----|------|
| FR-01 | `/smoke/loading-state` への GET は、`loading.tsx` を deterministic に発火させ、loading UI を smoke spec から観測可能にする |
| FR-02 | 最終 render は server component の固定遅延（既定 1500ms、`?delay=N` で 0–3000ms にクランプ）後に完了し、`data-page="smoke-loading-state-fixture"` を持つ要素を返す |
| FR-03 | fixture 専用 `loading.tsx` は `role="status"`、`aria-live="polite"`、`data-page="smoke-loading-state"`、可視テキスト「読み込み中」を持つ |
| FR-04 | `ENABLE_STAGING_SMOKE_FIXTURE !== "1"` または `ENVIRONMENT === "production"` のとき、route は `notFound()` で 404 を返す |
| FR-05 | Playwright spec が「loading UI が見える → 遅延終了後に最終 render が見える」を deterministic に assert する |
| FR-06 | `SMOKE-COVERAGE-MATRIX.md` 行 19（`app/loading.tsx`）が runtime 観測ステータス（DOM marker / a11y profile）に更新される |

## 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | smoke spec 1 ケースの平均実行時間は遅延 1500ms + 通信 < 3.5s 以内 |
| NFR-02 | テストは flake 率 0%（CI 上で 10 回連続 pass を Phase 11 で確認） |
| NFR-03 | production bundle に fixture route が含まれてよい（条件分岐で 404 になるため）。ただし production runtime での `throw` / `setTimeout` 副作用は発火させない |
| NFR-04 | 既存 design token（`apps/web/src/styles/tokens.css`）以外の色値・raw HEX を導入しない |

## 受入基準

- `pnpm typecheck` / `pnpm lint` / `pnpm exec playwright test apps/web/tests/e2e/staging-smoke.spec.ts` が pass。
- `verify-design-tokens` CI gate が pass。
- `SMOKE-COVERAGE-MATRIX.md` 行 19 が `loading-state-runtime` 観測 status に更新済み。
- Issue #711 検証方法 3 項目（deterministic latency / loading selector assert / matrix 置換）がすべて充足。

## スコープ外（CONST_007 準拠の意図的非対象）

- error-boundary fixture の改修（Issue #710 で実装済、本タスクの対象外）
- visual baseline 拡張（task-25 のスコープ外と Issue 本文で明示）
- admin / profile / login route 個別の `loading.tsx` 観測（root `loading.tsx` 観測で matrix 行 19 を充足できるため。CONST_007 例外条件には該当せず単一サイクルに収める）
