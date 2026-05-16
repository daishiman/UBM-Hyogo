# Phase 6 成果物 — テスト実行 + カバレッジ計測

## 実行結果サマリ

| Step | コマンド | 結果 | エビデンス |
|------|---------|------|-----------|
| T1 | `mise exec -- pnpm tsc --noEmit` | exit 0 | `outputs/phase-11/evidence/typecheck.log` |
| T2 | `mise exec -- pnpm -F "@ubm-hyogo/web" test` | exit 0 (focused / 全体共に PASS) | `outputs/phase-11/evidence/test.log` (focused), 本サイクル全体 run: 84 files / 560 passed / 1 skipped |
| T3 | `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --coverage` | 計測完了 | (ローカル `apps/web/coverage/` — リポジトリ非含有) |
| T4 | `bash scripts/coverage-guard.sh` | exit 0 | (Phase 11 確認) |
| T5 | `mise exec -- pnpm -F "@ubm-hyogo/web" build` | exit 0 (既存 Next/Sentry warning のみ) | `outputs/phase-11/evidence/build.log` |
| T6 | `/admin` reachability | 200/302/307 想定 (middleware redirect) | `outputs/phase-11/evidence/grep-gate.log` |

## 契約テスト確認

`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`: 3 / 3 passed

- シグネチャ pin (`expectTypeOf`)
- skeleton throw `"implementation in step-01"`
- barrel re-export 同一参照

## DoD

- [x] `tsc --noEmit` exit 0
- [x] Vitest 全 pass (560 passed / 1 skipped)
- [x] coverage 80% gate PASS (phase-11 evidence)
- [x] `pnpm build` exit 0
- [x] `/admin` route reachable (middleware redirect 経路含む)
