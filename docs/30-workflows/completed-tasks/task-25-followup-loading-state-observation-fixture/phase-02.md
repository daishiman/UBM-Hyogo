# Phase 2: 設計

`[実装区分: 実装仕様書]`

## アーキテクチャ概要

```
Browser (Playwright)
  └─ GET /smoke/loading-state?delay=1500
       └─ Next.js App Router
            ├─ apps/web/app/smoke/loading-state/loading.tsx   ← routable wrapper
            ├─ apps/web/app/smoke/loading-state/page.tsx      ← routable wrapper
            ├─ apps/web/app/__smoke__/loading-state/loading.tsx ← Suspense fallback source
            │    (role=status, aria-live=polite, data-page="smoke-loading-state")
            └─ apps/web/app/__smoke__/loading-state/page.tsx    ← Server component source
                 ├─ smokeFixtureEnabled() ガード（env 二重チェック）
                 ├─ 不一致 → notFound() (404)
                 └─ 一致 → await sleep(clampedDelay) → render data-page="smoke-loading-state-fixture"
```

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/__smoke__/loading-state/page.tsx` | 新規 | Private source。env ガード + 遅延 + 最終 render |
| `apps/web/app/__smoke__/loading-state/loading.tsx` | 新規 | Private source。role=status + 読み込み中テキスト |
| `apps/web/app/smoke/loading-state/page.tsx` | 新規 | Routable `/smoke/loading-state` wrapper |
| `apps/web/app/smoke/loading-state/loading.tsx` | 新規 | Routable loading wrapper |
| `apps/web/tests/e2e/staging-smoke.spec.ts` | 編集 | `staging smoke / loading state` describe block 追加 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` | 編集 | 行 19 の `N/A-runtime-observation` を実観測ステータスへ置換、`Coverage by axis` セクションを 18/19 → 19/19 へ更新 |

## 関数・モジュール設計

### `apps/web/app/__smoke__/loading-state/page.tsx`

```ts
import { notFound } from "next/navigation";
import { readRawEnv } from "../../../src/lib/env";

const DEFAULT_DELAY_MS = 1500;
const MAX_DELAY_MS = 3000;

function smokeFixtureEnabled(): boolean {
  const env = readRawEnv();
  return env["ENABLE_STAGING_SMOKE_FIXTURE"] === "1" && env["ENVIRONMENT"] !== "production";
}

function clampDelay(raw: string | string[] | undefined): number {
  if (typeof raw !== "string") return DEFAULT_DELAY_MS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_DELAY_MS;
  return Math.min(n, MAX_DELAY_MS);
}

export default async function SmokeLoadingStateFixture({
  searchParams,
}: {
  searchParams: Promise<{ delay?: string }>;
}) {
  if (!smokeFixtureEnabled()) {
    notFound();
  }
  const { delay } = await searchParams;
  const ms = clampDelay(delay);
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
  return (
    <main className="mx-auto max-w-xl px-6 py-12" data-page="smoke-loading-state-fixture">
      <h1 className="text-xl font-semibold">Loading state smoke fixture</h1>
      <p className="mt-2 text-sm">delay-ms: {ms}</p>
    </main>
  );
}
```

副作用:
- `setTimeout` ベースの遅延（テスト前提のため許容）
- production / fixture 無効時は副作用ゼロ（notFound 経由）

### `apps/web/app/__smoke__/loading-state/loading.tsx`

```tsx
export default function SmokeLoadingStateBoundary() {
  return (
    <main
      className="mx-auto max-w-xl px-6 py-12"
      role="status"
      aria-live="polite"
      data-page="smoke-loading-state"
    >
      <p className="text-sm">読み込み中</p>
    </main>
  );
}
```

注: root `apps/web/app/loading.tsx` の primitive と同等の class 構成のみを使用し、design token に揃える。新規 CSS class を作らない。

### `apps/web/tests/e2e/staging-smoke.spec.ts`（追記部分）

```ts
test.describe("staging smoke / loading state", () => {
  test("GET /smoke/loading-state shows loading boundary then final render", async ({ page }) => {
    const navigation = page.goto(`${BASE}/smoke/loading-state?delay=1500`, { waitUntil: "commit" });
    await expect(page.locator('[data-page="smoke-loading-state"]')).toBeVisible();
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByText("読み込み中")).toBeVisible();
    await navigation;
    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
  });

  test("GET /smoke/loading-state?delay=0 skips boundary visibility", async ({ page }) => {
    await page.goto(`${BASE}/smoke/loading-state?delay=0`, { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-page="smoke-loading-state-fixture"]')).toBeVisible();
  });
});
```

## エラーハンドリング

- env 不一致時は `notFound()` で Next.js 標準 404 へ委譲（既存 `not-found.tsx` が描画される）。
- `searchParams` の `delay` 解釈は `clampDelay` で完結し throw しない。

## TOKEN-SSOT 整合

- fixture の className は `mx-auto max-w-xl px-6 py-12` / `text-sm` / `text-xl font-semibold` のみで構成し、root `apps/web/app/loading.tsx` で既に使われている Tailwind utility に揃える。
- 色指定は token css の semantic class（既存）に依存し、HEX 直書きをしない。
- `verify-design-tokens` CI gate（task-18 由来）の grep ルールに該当しないことを確認する。
