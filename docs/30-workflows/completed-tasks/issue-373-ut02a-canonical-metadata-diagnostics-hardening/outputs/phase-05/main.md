# Phase 5: 実装ランブック — 実行結果

| Step | 変更ファイル | 状態 |
|------|-------------|------|
| 1 | `apps/api/src/repository/_shared/generated/static-manifest.json` (schema 拡張) | DONE |
| 2 | `scripts/regenerate-static-manifest.mjs` (新規) | DONE |
| 3 | `scripts/verify-static-manifest.mjs` (新規) | DONE |
| 4 | `package.json` (`verify:static-manifest` / `regenerate:static-manifest`) | DONE |
| 5 | `apps/api/src/repository/_shared/metadata.ts` (logger import + retirement comment + import-time schema check) | DONE |
| 6 | `apps/api/src/repository/_shared/builder.ts` (logWarn 統合) | DONE |
| 7 | `apps/api/src/repository/_shared/__tests__/alias-queue-adapter.contract.test.ts` (新規) | DONE |
| 8 | `.github/workflows/ci.yml` (`Verify static manifest` step) | DONE |
| 9 | `docs/00-getting-started-manual/specs/01-api-schema.md` (`Static Manifest Retirement Condition` 節) | DONE |

加えて `apps/api/src/lib/logger.ts` を新規追加（仕様書記載の logger が repo 不在だったため最小実装を提供）。
