---
name: app-router-metadata-spec-env-injection
description: app router の metadata 系 spec は CI で getPublicEnv 経由のため NEXT_PUBLIC_API_BASE_URL / ENVIRONMENT を必ず注入する
metadata:
  type: project
---

# app router metadata 系 spec の env 注入要件

- 日時: 2026-05-20
- 起源 PR: feat/parallel-04-shared-page-chrome (#839)
- 不変条件への接続: `apps/web` ランタイムの env アクセスは `apps/web/src/lib/env.ts` の `getEnv()` / `getPublicEnv()` 経由のみ。これは task-02 wrangler-env-injection の主要不変条件（CLAUDE.md「apps/web env アクセス不変条件」）
- 派生 spec 規約:
  - `apps/web/app/**/__tests__/*.spec.tsx` で `generateMetadata` / `viewport` / `metadata` をテストする際は env 注入を必須とする
  - 注入方法は `beforeAll/afterAll` での `process.env` 一時上書き、または `vi.spyOn(envMod, "getPublicEnv").mockReturnValue(...)` を選択
- 検証方法:
  - CI 等価再現: `unset NEXT_PUBLIC_API_BASE_URL ENVIRONMENT && pnpm --filter @ubm-hyogo/web test`
  - 該当 spec を新規 add する際は Phase 11 evidence 採取前に CI 等価再現を1度実施
- 関連:
  - [[root-layout-spec-public-env-required]] (task-specification-creator/changelog)
  - `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` (既存の mock パターン参照)
