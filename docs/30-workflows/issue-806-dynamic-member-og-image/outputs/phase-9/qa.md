# Phase 9 成果物: QA

| 検証項目 | 結果 |
|---|---|
| `pnpm typecheck` | ✓ PASS |
| `pnpm lint` | ✓ PASS |
| `pnpm --filter @ubm-hyogo/web test`（全 vitest） | ✓ 704 PASS / 1 skipped |
| `pnpm --filter @ubm-hyogo/web build` (`ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=...`) | ✓ PASS |
| Workers bundle に `[project]/...` 仮想 specifier 混入 | 未検出 |
| 不変条件 #5 (D1 直接アクセス) | 維持（`fetchPublicOrNotFound` 経由のみ） |
| publicConsent ガード | API contract に委譲 |

> 注: production build 時に `ENVIRONMENT`/`NEXT_PUBLIC_API_BASE_URL` が未設定だと既存 `getPublicEnv()` の zod parse が throw する（既存仕様）。今回の変更はこの不変条件を維持。
