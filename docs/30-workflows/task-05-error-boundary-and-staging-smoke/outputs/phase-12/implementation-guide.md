# Implementation Guide

## Part 1: 中学生レベル

Web ページが表示できないとき、学校の掲示板に「今日は準備中です」と紙を貼るように、見ている人へ分かりやすい別の画面を出したい。何も出ないままだと、見ている人は自分の操作が悪いのか、サイトが壊れているのか分からない。

このタスクでは、表示に失敗したときの画面、ページが見つからないときの画面、読み込み中の画面、もっと大きな失敗が起きたときの画面を用意する。さらに、本番の前に試す場所で、全部で 19 個のページが開けるかを同じ表で確認できるようにする。

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| error boundary | 失敗した画面の代わりに出す案内板 |
| staging | 本番に出す前の試し場所 |
| smoke test | 大きな問題がないかを見る短い点検 |
| Sentry | 失敗を記録して管理者へ知らせる記録帳 |
| fixture | テストのために用意した決まった見本 |

## Part 2: 技術者レベル

### Interfaces

```ts
type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

type StagingSmokeRoute = {
  route: string;
  layer: "public" | "member" | "admin" | "common" | "fixture";
  allowedStatuses: number[];
  requiresFixtureFlag?: boolean;
};
```

### API Signatures And Usage

```tsx
export default function RouteError({ error, reset }: RouteErrorProps): JSX.Element;
export default function GlobalError(props: RouteErrorProps): JSX.Element;
export default function NotFound(): JSX.Element;
export default function Loading(): JSX.Element;
```

Usage:

```bash
ENABLE_STAGING_SMOKE_FIXTURE=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke
```

### Edge Cases

| Case | Required handling |
| --- | --- |
| missing digest | Do not render the error id row |
| production URL in `STAGING_BASE_URL` | fail before any smoke request |
| missing `ENABLE_STAGING_SMOKE_FIXTURE` | fail before fixture route execution |
| logger failure | rely on task-04 no-throw logger contract; do not make boundary rendering depend on telemetry success |
| Sentry server/browser ambiguity | record browser boundary event and server test event as separate evidence |

### Constants

| Constant | Value |
| --- | --- |
| allowed status set | `200, 301, 302, 307, 401, 403, 404` |
| route source of truth | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/specs/staging-smoke-checklist.md` |
| fixture flag | `ENABLE_STAGING_SMOKE_FIXTURE=1` |
| E2E coverage threshold | `lines.pct >= 80` |

## Part 3: 実装サイクル実行結果（2026-05-09）

### 実装したファイル

| 種別 | path | 概要 |
| --- | --- | --- |
| M | `apps/web/app/error.tsx` | route segment error boundary（dev/prod 分岐 + digest + reset + `logger.error({event:"error.boundary.caught"})`、`role="alert"`、token 経由色） |
| M | `apps/web/app/global-error.tsx` | 最上位 fallback（`<html><body>` + `logger.error({event:"error.global-boundary.caught"})`、`role="alert"`） |
| M | `apps/web/app/not-found.tsx` | 404 UI（仮 markup、token 経由色、`Link` で `/` と `/members` へ復帰導線） |
| C | `apps/web/app/loading.tsx` | Suspense fallback（`role="status"` + `aria-busy` + `aria-live="polite"`、token skeleton） |
| C | `apps/web/app/__tests__/error.test.tsx` | TC-U-01〜07 を `vitest` + `@testing-library/react` で reify（7 ケース pass） |
| C | `apps/web/tests/e2e/staging-smoke.spec.ts` | 19 routes smoke（公開 6 / 会員/管理 10 / 404 / fixture 2）、production guard・fixture flag guard 付 |
| M | `apps/web/playwright.config.ts` | `staging-smoke` project 追加（`retries: 2`、`baseURL=STAGING_BASE_URL`、`STAGING_AUTH_BEARER` 任意） |
| M | `apps/web/package.json` | `e2e:staging` script 追加 |

### path 整合

本リポジトリの App Router app 配置は `apps/web/app/` であり、仕様書と実装の対象 path は同一である。`@/lib/logger` の path alias は他の `apps/web/app/*` 既存ファイルでも採用されておらず、vitest の root config に `@` alias が無いため、`error.tsx` / `global-error.tsx` は相対パス `../src/lib/logger` で `logger` を import している。

### ローカル検証結果（実行済み）

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm exec vitest run apps/web/app/__tests__/error.test.tsx` | 1 file / 7 tests pass |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | pass |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | pass（既存 script 対象） |
| `pnpm --filter @ubm-hyogo/web exec eslint apps/web/app/error.tsx apps/web/app/global-error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx apps/web/app/__smoke__/error-boundary/page.tsx apps/web/app/__smoke__/members-list/page.tsx apps/web/app/__tests__/error.test.tsx` | pass |
| `mise exec -- pnpm --filter @ubm-hyogo/web build` | pass（`/`, `/admin/*`, `/members/*`, `/login`, `/profile`, `/privacy`, `/terms`, `/register` 全 route 出力） |
| `pnpm --filter @ubm-hyogo/web exec playwright test tests/e2e/staging-smoke.spec.ts --project=staging-smoke --list` | Total: 19 tests in 1 file |

### ユーザー承認後に残る作業（runtime gated）

- staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`）
- staging smoke 実行（`ENABLE_STAGING_SMOKE_FIXTURE=1 STAGING_BASE_URL=… pnpm --filter @ubm-hyogo/web e2e:staging`）
- Sentry dashboard 上での browser boundary event / server test event 目視確認
- commit / push / PR 作成
