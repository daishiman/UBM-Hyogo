# Phase 9 成果物: QA サマリ

詳細は [../../phase-9.md](../../phase-9.md) を参照。

| Gate | コマンド | 期待 |
|------|---------|------|
| typecheck | `pnpm typecheck` | 0 error |
| lint | `pnpm lint` | 0 |
| web test | `pnpm --filter @ubm-hyogo/web test` | green |
| PR ready | `bash scripts/verify-pr-ready.sh` | green |
| Phase 12 compliance | `pnpm verify:phase12-compliance -- --workflow docs/30-workflows/completed-tasks/login-stale-link-and-profile-me-safe-fetch` | pass |

## 実行結果

- `pnpm --filter @ubm-hyogo/web typecheck`: PASS
- `pnpm --filter @ubm-hyogo/web lint`: PASS
- `pnpm --filter @ubm-hyogo/web test -- app/\(member\)/profile/page.spec.tsx src/lib/url/login-query.spec.ts src/lib/url/login-redirect.spec.ts src/lib/url/login-state.spec.ts`: `apps/web` 全体 160 files / 1162 tests PASS
- `pnpm verify:phase12-compliance -- --workflow docs/30-workflows/completed-tasks/login-stale-link-and-profile-me-safe-fetch`: PASS
