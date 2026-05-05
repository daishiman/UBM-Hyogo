# Phase 12 implementation guide - 06c-C-admin-tags

## Part 1: 中学生レベル

/admin/tags はタグがまだ決まっていない会員を順番に確認する受付係です。管理者は候補を見て、正しいタグを選ぶか、今回は採用しない理由を書くかを決めます。

## Part 2: 技術者向け

- UI 正本: apps/web admin tags page + TagQueuePanel。
- API 正本: GET /admin/tags/queue, POST /admin/tags/queue/:queueId/resolve。
- Schema 正本: tagQueueResolveBodySchema。
- 禁止: new CRUD route, alias editor, direct member_tags mutation route, apps/web D1 direct access。
- Evidence: focused tests は既存 07a/06c の範囲、visual は 08b/09a で取得。

## Screenshot / visual evidence reference

- Local Phase 11 screenshot: not captured in this docs-only remaining-only close-out because authenticated admin session + D1 fixture runtime is delegated to 08b/09a. See `outputs/phase-11/runtime-evidence-handoff.md`.
- Handoff target: `docs/30-workflows/08b-A-playwright-e2e-full-execution/outputs/phase-11/` and `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/`.
- Expected screenshot name: `admin-tags` from `apps/web/playwright/tests/admin-pages.spec.ts` via `AdminTagsPage.assertQueueShell()`.
