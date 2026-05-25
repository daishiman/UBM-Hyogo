# Phase 13 — PR 作成

## Status

`blocked` until explicit user approval.

## User-Gated Actions

- commit
- push
- PR creation
- staging deploy（必要時のみ）

## Issue 状態方針

Issue #882 は CLOSED のまま維持する（ユーザー指示）。本タスクの PR では Issue を reopen せず、PR description に `Refs #882`（`Closes` ではなく `Refs`）で関連付ける。

## Draft PR Scope

PR 作成承認時に含める内容:

- `apps/web/src/lib/env.ts` への `getPublicEnvSafe` 追加。
- `apps/web/src/lib/seo/site-metadata.ts` を `getPublicEnvSafe` + `DEFAULT_PUBLIC_ENV` fallback へ置換。
- `apps/web/src/lib/__tests__/env.spec.ts` / `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` の追加ケース。
- `apps/web/playwright/tests/terms-prefetch.spec.ts` 新規。
- `docs/30-workflows/issue-882-terms-prefetch-env-validation-fix/` 配下（本仕様書群）。
- Phase 11 evidence（NON_VISUAL runtime smoke: `manual-test-result.md` + Playwright JSON/HTML report）。

## ローカル検証コマンド（PR 作成前必須）

```
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

## PR base

既定: `dev`。
