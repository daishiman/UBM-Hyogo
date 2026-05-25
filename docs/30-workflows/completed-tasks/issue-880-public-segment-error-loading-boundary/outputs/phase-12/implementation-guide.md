# Implementation guide

## なぜこの変更が必要か（中学生レベル説明）

Webサイトには、エラーが起きた時に表示する画面と、読み込み中に表示する画面があります。
このサイトの一般公開エリアには専用の画面がまだ無く、共通画面に頼っています。
そのため、エラー時に「会員一覧へ戻る」のような公開エリア向けの案内を出しにくい状態です。

このタスクでは、一般公開エリア専用の `error.tsx` と `loading.tsx` を作ります。
画面の部品は既存の `Card` や `Button` を使い、新しい仕組みを増やさずに不足だけを埋めます。

## Technical summary

Add explicit `(public)` route-group boundaries under `apps/web/app/(public)/`.
The implementation should mirror existing root/admin boundary patterns while
using `scope: "public"` for structured logging and public-facing navigation.

## Implementation steps

1. Add `apps/web/app/(public)/error.tsx` as a client component.
2. Add `apps/web/app/(public)/loading.tsx` as a server component.
3. Add `apps/web/app/(public)/error-boundary-smoke/page.tsx` with a production
   `notFound()` guard.
4. Add `apps/web/playwright/tests/public-error-boundary.spec.ts`.
5. Backfill the serial-06 compliance note after implementation evidence exists.

## Verification commands

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/issue-880-public-segment-error-loading-boundary/outputs/phase-11/evidence pnpm --filter @ubm-hyogo/web exec playwright test public-error-boundary.spec.ts --project=desktop-chromium
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify:design-tokens
bash scripts/verify-pr-ready.sh
```

## Evidence

- Screenshot: `outputs/phase-11/screenshots/public-error-boundary.png`
- Playwright report: `outputs/phase-11/evidence/playwright-report/results.json`
- Local result: `public-error-boundary.spec.ts --project=desktop-chromium` passed 2/2 on 2026-05-25 JST

## Known limits

The Playwright config `webServer` ready wait timed out in this worktree before
tests started. Manual dev-server startup with the same Playwright env plus
`PLAYWRIGHT_SKIP_WEB_SERVER=1` produced the runtime evidence above.
