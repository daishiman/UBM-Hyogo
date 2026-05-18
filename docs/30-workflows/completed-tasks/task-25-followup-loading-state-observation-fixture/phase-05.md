# Phase 5: 実装

`[実装区分: 実装仕様書]`

## 目的

Phase 2 の設計に従い、fixture route 2 ファイル + smoke spec 編集 + matrix 更新を 1 サイクルで完了させる。

## 変更対象ファイル（CONST_005 必須項目）

| パス | 変更種別 | 主要シグネチャ / 構造 |
|------|---------|----------------------|
| `apps/web/app/__smoke__/loading-state/page.tsx` | 新規 | private source: `export default async function SmokeLoadingStateFixture(...)` |
| `apps/web/app/__smoke__/loading-state/loading.tsx` | 新規 | private source: `export default function SmokeLoadingStateBoundary()` |
| `apps/web/app/smoke/loading-state/page.tsx` | 新規 | routable wrapper export |
| `apps/web/app/smoke/loading-state/loading.tsx` | 新規 | routable loading wrapper export |
| `apps/web/tests/e2e/staging-smoke.spec.ts` | 編集 | Phase 4 で確定した `staging smoke / loading state` describe block を追記 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | 編集 | 行 19（`app/loading.tsx`）の `N/A-runtime-observation` を runtime 観測値へ置換、summary 行を 18/19 → 19/19 に更新 |

## 実装手順

### Step 1: fixture page 新規作成

`apps/web/app/__smoke__/loading-state/page.tsx` を Phase 2 設計の通り作成し、`apps/web/app/smoke/loading-state/page.tsx` から export する。
- import: `notFound` from `next/navigation`、`readRawEnv` from `../../../src/lib/env`
- `smokeFixtureEnabled()` は既存 `__smoke__/error-boundary/page.tsx:4-7` と同一実装（重複は Phase 8 でリファクタ判断）
- `clampDelay()` で query param を 0–3000ms クランプ、既定 1500ms
- 非有効時 `notFound()`、有効時 `await new Promise(r => setTimeout(r, ms))` 後に `<main data-page="smoke-loading-state-fixture">` を返す

### Step 2: fixture loading boundary 新規作成

`apps/web/app/__smoke__/loading-state/loading.tsx` を Phase 2 設計の通り作成し、`apps/web/app/smoke/loading-state/loading.tsx` から export する。
- `role="status"`, `aria-live="polite"`, `data-page="smoke-loading-state"`
- 「読み込み中」テキストを `<p className="text-sm">` で配置
- 親 `<main>` は `apps/web/app/loading.tsx` の class 構成（`mx-auto max-w-xl px-6 py-12`）を流用

### Step 3: staging-smoke spec に describe block 追記

`apps/web/tests/e2e/staging-smoke.spec.ts` の既存 `staging smoke / error boundary`（行 116 付近）の直後に Phase 4 の skeleton を追記。

### Step 4: SMOKE-COVERAGE-MATRIX 更新

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` の以下を編集:
- 行 19 (`app/loading.tsx`): `N/A-runtime-observation` を実観測値へ置換
  - Status: `loading-boundary-200` (boundary 観測 → 最終 200)
  - DOM marker: `[data-page="smoke-loading-state"]` → `[data-page="smoke-loading-state-fixture"]`
  - Token axis: `TOKEN-SSOT`
  - A11y axis: `A11Y-DEFAULT`（`role=status` + aria-live で minimal semantic 確認）
  - Note: replace previous「deterministic network-throttle observation is not present」→「observed via `apps/web/app/smoke/loading-state/` fixture」
- 行 15: `2 component-only surfaces` → `1 component-only surface`（error.tsx も既に観測済のため `0 component-only surface` の可能性あり。Phase 12 で合算して決定）
- `Coverage by axis` セクション: A11y runtime `17/19` → `18/19` または `19/19` を Phase 12 で最終確定

注: 行 18（`app/error.tsx`）は本タスクのスコープ外だが、現状コードでは既に観測済（`__smoke__/error-boundary`）のため、matrix の整合性確認時に同時更新の要否を Phase 12 で判定する。

## 入力・出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | HTTP GET `/smoke/loading-state?delay=N` |
| 出力（valid） | 200 + HTML（`data-page="smoke-loading-state-fixture"`、Suspense fallback 経由で先に `data-page="smoke-loading-state"` を観測可能） |
| 出力（invalid） | 404 + `not-found.tsx` |
| 副作用 | server side `setTimeout` 遅延のみ。D1 / API / ログ書込なし |

## テスト方針

Phase 4 で skeleton を確定済。Phase 5 実装後の期待:
- TC-01 / TC-02 が **green**
- TC-03 はローカル env 操作前提のため Phase 11 の手動テストでカバー

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build   # OpenNext build に fixture route が含まれることを確認

# fixture を有効化してローカル smoke
ENABLE_STAGING_SMOKE_FIXTURE=1 ENVIRONMENT=staging \
  mise exec -- pnpm --filter @ubm-hyogo/web dev &
BASE=http://localhost:3000 \
  mise exec -- pnpm exec playwright test apps/web/tests/e2e/staging-smoke.spec.ts \
  --grep "staging smoke / loading state"
```

## DoD（Phase 5）

- `pnpm typecheck` / `pnpm lint` / `pnpm build`（web）が pass。
- Playwright `staging smoke / loading state` 2 ケースが local で **green**。
- `/smoke/loading-state` の env ガード分岐が `notFound()` を呼ぶことを目視確認（ガード OFF で curl が 404）。
- `verify-design-tokens` grep gate（task-18）が pass。
