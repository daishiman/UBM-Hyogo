---
name: root-layout-spec-public-env-required
description: apps/web の RootLayout / generateMetadata を呼ぶ vitest は CI で NEXT_PUBLIC_API_BASE_URL / ENVIRONMENT を必ず注入する
metadata:
  type: project
---

# RootLayout 系 spec で env 注入を忘れると CI coverage-gate-shard(web) が落ちる

- 日時: 2026-05-20
- 検出: parallel-04-shared-page-chrome PR の CI `coverage-gate-shard (web)`
- 事象: `apps/web/app/__tests__/layout.spec.tsx` の `generateMetadata()` 呼び出しが内部で `apps/web/src/lib/seo/site-metadata.ts → getSiteUrl() → getPublicEnv()` を経由し、CI で `NEXT_PUBLIC_API_BASE_URL` / `ENVIRONMENT` が未設定のため zod parse fail → `apps/web test:coverage` が exit 1 → coverage-gate-shard(web) failure → coverage-gate aggregate failure
- ローカル成功・CI失敗の罠: ローカルでは direnv / .env 由来の env が process.env に乗っているため通る。CI では空のため落ちる
- 解消パターン（2種）:
  1. spec 内で `beforeAll` / `afterAll` により `process.env` を一時上書き＋復元（簡易・本ケースで採用）
  2. `vi.spyOn(envMod, "getPublicEnv").mockReturnValue({...})` で関数mock（`apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` パターン）
- 一般化ルール:
  - `apps/web/app/**/__tests__/*layout*.spec.tsx` や `*page*.spec.tsx` で `generateMetadata` / `buildBaseMetadata` / `buildPageMetadata` を呼ぶ場合、env 注入を必須とする
  - **Why**: `apps/web/src/lib/env.ts` の `getPublicEnv()` は zod schema で `NEXT_PUBLIC_API_BASE_URL` / `ENVIRONMENT` を厳格 parse する（task-02 wrangler-env-injection の不変条件）
  - **How to apply**: app router 配下に metadata 系 spec を新規追加する際、Phase 11 evidence 取得前にローカルで `unset NEXT_PUBLIC_API_BASE_URL && pnpm --filter @ubm-hyogo/web test` で CI 等価再現を一度確認する
- 反映先:
  - 本 changelog エントリ（task-specification-creator）
  - `task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の coverage-gate セクションに「app router の metadata 系 spec は env 注入必須」を追記推奨
