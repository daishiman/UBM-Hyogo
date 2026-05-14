# Phase 11 main

## Status

`runtime_partial` (NON_VISUAL):

- ローカル実装・disjoint 検証は完了
- CI matrix wall-clock 計測は PR push 後に行う (本 spec 実装サイクル内では取得不可)

## 実行コマンド記録 (2026-05-11)

| Command | Exit | Notes |
| --- | --- | --- |
| `mise exec -- pnpm install --frozen-lockfile` | 0 | 98s |
| `mise exec -- pnpm typecheck` | 0 | 全 5 workspace project PASS |
| `mise exec -- pnpm lint` | 0 | 全 5 workspace project PASS |
| `mise exec -- node --test scripts/__tests__/coverage-merge.test.mjs` | 0 | 3/3 case PASS |
| `mise exec -- pnpm exec vitest list --config=vitest.d1.config.ts` | 0 | 94 d1 files |
| `mise exec -- pnpm exec vitest list --config=vitest.config.ts apps/api` | 0 | 44 unit files |
| disjoint check (`comm`) | 0 | intersection=0, union=138 |
| `bash scripts/coverage-guard.sh --no-run` | 1 | coverage 未生成のため MISSING (期待動作) |
| `bash scripts/coverage-guard.sh --group invalid` | 2 | CLI 検証 PASS |
| `bash scripts/coverage-guard.sh --group api-unit --no-run` | 1 | MISSING 通知 (期待動作) |
| `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit` | 1 | 既知 flake `notification-mail-config.spec.ts` Vite SSR transform timeout (240/240 assertion PASS、44 ファイル中 43 import PASS) |

## Evidence

| Evidence | Path | State |
| --- | --- | --- |
| before/after CI timing | `outputs/phase-11/before-after.md` | `runtime_partial` |
| manual smoke log | `outputs/phase-11/manual-smoke-log.md` | `runtime_partial` |
| link checklist | `outputs/phase-11/link-checklist.md` | `runtime_partial` |
| classification | `outputs/phase-04/classification.md` | `runtime_classified` |

## 未実行理由

- CI matrix wall-clock evidence は実装 PR push 後にのみ取得可能
- D1 group の実 coverage 実行はローカル時間制約により後段で実施
