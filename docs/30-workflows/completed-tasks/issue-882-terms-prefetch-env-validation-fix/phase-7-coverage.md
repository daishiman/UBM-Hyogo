# Phase 7 — カバレッジ

## 目標

- `apps/web/src/lib/env.ts` line coverage: 既存ライン維持 + `getPublicEnvSafe` 100%。
- `apps/web/src/lib/seo/site-metadata.ts` line coverage: 既存維持 + fallback path 100%。

## 実行

```
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage -- src/lib/__tests__/env.spec.ts src/lib/seo/__tests__/site-metadata.spec.ts
```

## 完了条件

- 上記 2 ファイルの新規 line に対し 0% coverage の追加なし。
- workspace 全体 coverage gate (`scripts/coverage-guard.sh --changed`) green。
