# Phase 5: 実装ランブック

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 5 |
| task | task-05-error-boundary-and-staging-smoke |
| state | implemented-local / implementation / runtime evidence pending_user_approval |

## 目的

この Phase で task-05 の実装仕様、検証条件、または close-out 条件を固定する。

## 実行タスク

- [ ] 本 Phase の本文に記載された設計・検証・ドキュメント作業を実施する
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-05-w4-par-error-boundary-and-staging-smoke.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-05/main.md`

## 統合テスト連携

`apps/web/tests/e2e/staging-smoke.spec.ts` は `staging-smoke-checklist.md` の 19 routes を正本として実装サイクルで接続する。

このフェーズは「後続実装者がそのまま手を動かせる」粒度で書く。

## 実装手順（順序厳守）

### Step 1: error boundary 4 ファイル新設

#### 1-1. `apps/web/app/error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RouteError({ error, reset }: Props) {
  useEffect(() => {
    logger.error({
      event: "error.boundary.caught",
      digest: error.digest,
      err: error,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div role="alert" aria-live="assertive" className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-[var(--ubm-color-danger)]">
        画面を表示できませんでした
      </h1>
      <p className="mt-2 text-sm text-[var(--ubm-color-fg-muted)]">
        時間をおいて再試行してください。問題が続く場合は管理者にご連絡ください。
      </p>
      {error.digest && (
        <p className="mt-4 text-xs text-[var(--ubm-color-fg-muted)]">
          エラーID: <code>{error.digest}</code>
        </p>
      )}
      {isDev && (
        <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-[var(--ubm-color-surface-2)] p-3 text-xs">
          {error.stack ?? error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[var(--ubm-color-primary)] px-4 py-2 text-sm text-[var(--ubm-color-on-primary)]"
        >
          再試行する
        </button>
        <a
          href="/"
          className="rounded-md border border-[var(--ubm-color-border)] px-4 py-2 text-sm"
        >
          トップへ戻る
        </a>
      </div>
    </div>
  );
}
```

#### 1-2. `apps/web/app/global-error.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ event: "error.global-boundary.caught", digest: error.digest, err: error });
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>システムエラーが発生しました</h1>
        <p>ページを読み込めませんでした。再読込みしてください。</p>
        {error.digest && <p>ID: {error.digest}</p>}
        <button type="button" onClick={reset}>再読込み</button>
      </body>
    </html>
  );
}
```

#### 1-3. `apps/web/app/not-found.tsx`

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <p className="text-sm text-[var(--ubm-color-fg-muted)]">404</p>
      <h1 className="mt-2 text-2xl font-semibold">ページが見つかりません</h1>
      <p className="mt-3 text-sm text-[var(--ubm-color-fg-muted)]">
        URL をご確認のうえ、トップから再度アクセスしてください。
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-[var(--ubm-color-primary)] px-4 py-2 text-sm text-[var(--ubm-color-on-primary)]"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
```

#### 1-4. `apps/web/app/loading.tsx`

```tsx
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-6 py-12" aria-busy="true" aria-live="polite">
      <div className="h-8 w-2/3 animate-pulse rounded bg-[var(--ubm-color-surface-2)]" />
      <div className="h-4 w-full animate-pulse rounded bg-[var(--ubm-color-surface-2)]" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--ubm-color-surface-2)]" />
      <div className="h-64 animate-pulse rounded bg-[var(--ubm-color-surface-2)]" />
    </div>
  );
}
```

### Step 2: 単体テスト

ファイル: `apps/web/app/__tests__/error.test.tsx`

Phase 4 の TC-U-01〜07 を `describe("RouteError", () => { ... })` に reify。`@testing-library/react` の `render` / `userEvent` を使う。

### Step 3: Playwright spec

ファイル: `apps/web/tests/e2e/staging-smoke.spec.ts`。route 配列は `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` の 19 行を正本にし、spec 内に派生コメントで checklist path を記録する。冒頭に production URL guard と `ENABLE_STAGING_SMOKE_FIXTURE=1` guard を置く。

### Step 4: `apps/web/playwright.config.ts` への staging project 追加

```ts
{
  name: "staging-smoke",
  testMatch: /tests\/e2e\/staging-smoke\.spec\.ts/,
  retries: 2,
  use: {
    baseURL: process.env.STAGING_BASE_URL,
    extraHTTPHeaders: process.env.STAGING_AUTH_BEARER
      ? { Authorization: `Bearer ${process.env.STAGING_AUTH_BEARER}` }
      : undefined,
  },
}
```

### Step 5: `apps/web/package.json` への script 追加

```jsonc
{
  "scripts": {
    "e2e:staging": "playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke"
  }
}
```

### Step 6: `staging-smoke-checklist.md` 作成

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` に 19 routes × 5 状態（unauth / member / admin / 404 / boundary）の格子表を作成（原典 §5.2 拡張）。

## 検証コマンド

```bash
# 単体テスト
mise exec -- pnpm --filter @ubm-hyogo/web test app/__tests__/error.test.tsx

# 型チェック / lint / build
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build

# staging smoke（要事前 deploy）
export STAGING_BASE_URL=https://<staging>.workers.dev
export STAGING_MEMBER_FIXTURE_ID=fixture-1
ENABLE_STAGING_SMOKE_FIXTURE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke
```

## テスト常時実行可能性 DoD

| 項目 | 固定値 |
| --- | --- |
| 対象 spec | `apps/web/tests/e2e/staging-smoke.spec.ts` |
| 1 行実行コマンド | `ENABLE_STAGING_SMOKE_FIXTURE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke` |
| browser binary 自動 install | 実装サイクルで `apps/web/package.json` script または CI step に `pnpm exec playwright install --with-deps chromium` を固定 |
| dev/staging server | staging は `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`、local list は Playwright config の `webServer` or existing dev server script を使う |
| CI gate | 実装サイクルで `.github/workflows` の E2E gate または existing Playwright workflow に `e2e:staging` 呼び出しを接続 |
| un-skip | staging smoke spec で `test.describe.skip` / `test.skip(true)` / `it.skip` 禁止 |
| E2E coverage | `coverage/e2e/coverage-summary.json` の total と task-touched modules の `lines.pct >= 80` |

## 完了条件

- [ ] Step 1〜6 のファイル変更が全て完了している
- [ ] Phase 4 のテストが pass（local）
- [ ] `pnpm --filter @ubm-hyogo/web build` が pass
