# Phase 12 Implementation Guide: ut-web-cov-04-admin-lib-ui-primitives-coverage

## Part 1: 中学生レベル

このタスクは、道具箱の中の基本道具がどれも使えるか確かめる作業に似ている。管理画面の通信道具と、ボタンの土台になる小さな画面部品を確認する。開く、閉じる、設定を変える、押した時に反応する、という基本の動きをテストで見る。

結果: 2026-05-03 の実装レビューサイクルで PASS。`@app/web` は存在しない package filter だったため、現行 package 名 `@ubm-hyogo/web` と script `test:coverage` に修正し、通常テストと coverage を実測した。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| admin lib | 管理画面が使う裏方道具 |
| UI primitive | 画面の小さな基本部品 |
| contract test | 約束どおり動くかの確認 |
| barrel file | まとめて取り出す入口 |
| callback | 押した後に呼ばれる約束 |

## Part 2: 技術者レベル

対象は `lib/admin/{server-fetch,api,types}` と `components/ui/{Toast,Modal,Drawer,Field,Segmented,Switch,Search,icons,index}`、`lib/url/login-state.ts`。admin lib は authed fetch / error mapping / type guard、UI primitives は open/close、prop variant、callback invocation を最低限確認する。

admin component 本体、public component、auth/fetch lib の責務は他 workflow へ委譲し、本タスクは admin lib と primitive boundary に限定する。

## Coverage Evidence Contract

| Evidence | Status | Meaning |
| --- | --- | --- |
| `outputs/phase-11/coverage-before.json` | RESERVED | Baseline target table exists. |
| `outputs/phase-11/coverage-after.json` | PASS | Populated from `apps/web/coverage/coverage-summary.json` after `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage`. |
| `outputs/phase-11/coverage-diff.md` | PASS | 13 target rows now contain measured before -> after values. |

## Target Test Files

| Target | Test file |
| --- | --- |
| `apps/web/src/lib/admin/server-fetch.ts` | `apps/web/src/lib/admin/__tests__/server-fetch.test.ts` |
| `apps/web/src/lib/admin/api.ts` | `apps/web/src/lib/admin/__tests__/api.test.ts` |
| `apps/web/src/lib/admin/types.ts` | `apps/web/src/lib/admin/__tests__/types.test.ts` |
| `apps/web/src/components/ui/Toast.tsx` | `apps/web/src/components/ui/__tests__/Toast.test.tsx` |
| `apps/web/src/components/ui/Modal.tsx` | `apps/web/src/components/ui/__tests__/Modal.test.tsx` |
| `apps/web/src/components/ui/Drawer.tsx` | `apps/web/src/components/ui/__tests__/Drawer.test.tsx` |
| `apps/web/src/components/ui/Field.tsx` | `apps/web/src/components/ui/__tests__/Field.test.tsx` |
| `apps/web/src/components/ui/Segmented.tsx` | `apps/web/src/components/ui/__tests__/Segmented.test.tsx` |
| `apps/web/src/components/ui/Switch.tsx` | `apps/web/src/components/ui/__tests__/Switch.test.tsx` |
| `apps/web/src/components/ui/Search.tsx` | `apps/web/src/components/ui/__tests__/Search.test.tsx` |
| `apps/web/src/components/ui/icons.ts` | `apps/web/src/components/ui/__tests__/icons.test.ts` |
| `apps/web/src/components/ui/index.ts` | `apps/web/src/components/ui/__tests__/index.test.ts` |
| `apps/web/src/lib/url/login-state.ts` | `apps/web/src/lib/url/login-state.test.ts` |

## Verification Commands

- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm --filter @ubm-hyogo/web test`
- `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage`
- `mise exec -- pnpm --filter @ubm-hyogo/web build`

## Measured Result

| Command | Result |
| --- | --- |
| `mise exec -- pnpm --filter @ubm-hyogo/web test` | PASS: 44 files / 322 tests |
| `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | PASS: 44 files / 322 tests; all 13 target files meet Stmts/Lines/Funcs >=85% and Branches >=80% |
| `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web lint` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/web build` | PASS; existing Next.js middleware deprecation warning only |

## Invariants

- Production code remains unchanged unless a later implementation cycle explicitly justifies otherwise.
- apps/web tests must not import D1 repositories or `apps/api` internals directly.
- `vitest.config.ts` coverage excludes and thresholds are not changed to force a pass.
