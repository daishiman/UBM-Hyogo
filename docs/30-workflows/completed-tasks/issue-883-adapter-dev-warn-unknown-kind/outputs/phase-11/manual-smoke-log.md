# Manual Smoke Log — issue-883 adapter-dev-warn-unknown-kind

## 判定

PASS / NON_VISUAL。

## 実行内容

| check | command | result |
| --- | --- | --- |
| adapter focused spec | `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 10 tests PASS |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | PASS |
| lint | `pnpm --filter @ubm-hyogo/web lint` | PASS |
| visual baseline status | `git status --short -- apps/web/playwright/tests/visual-full 'apps/web/app/(public)/members/[id]' apps/web/src/components/public` | visual baseline / public components diffなし |

## スクリーンショット

NON_VISUAL のため撮影不要。
