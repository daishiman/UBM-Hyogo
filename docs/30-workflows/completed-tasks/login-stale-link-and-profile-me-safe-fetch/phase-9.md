# Phase 9: 品質保証

## チェックリスト

| 項目 | コマンド | 期待 |
|------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | 0 error |
| lint | `mise exec -- pnpm lint` | 0 error / 0 warning |
| web 単体テスト | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 全 green |
| Phase 12 compliance | `pnpm verify:phase12-compliance -- --workflow docs/30-workflows/completed-tasks/login-stale-link-and-profile-me-safe-fetch` | pass |
| PR ready | `bash scripts/verify-pr-ready.sh` | green（gate-metadata / phase12-compliance / indexes drift なし） |
| design tokens | `mise exec -- pnpm verify:design-tokens`（CI gate 互換） | HEX 直書き 0 |
| test suffix | lefthook `block-test-suffix` | `.test.ts(x)` 新規 0 |

## line budget

- `outputs/phase-12/implementation-guide.md` は 300 行以下に収める
- 他 outputs は 200 行以下が目安

## 実行済みローカル evidence

- `pnpm --filter @ubm-hyogo/web typecheck`: PASS
- `pnpm --filter @ubm-hyogo/web lint`: PASS
- `pnpm --filter @ubm-hyogo/web test -- app/\(member\)/profile/page.spec.tsx src/lib/url/login-query.spec.ts src/lib/url/login-redirect.spec.ts src/lib/url/login-state.spec.ts`: 引数解釈により `apps/web` 全体が実行され、160 files / 1162 tests PASS
- `pnpm verify:phase12-compliance -- --workflow docs/30-workflows/completed-tasks/login-stale-link-and-profile-me-safe-fetch`: PASS

## mirror parity

- `.claude` 配下の skill 変更は本タスクでは発生しない見込み（Phase 12 同 wave で必要時のみ）
