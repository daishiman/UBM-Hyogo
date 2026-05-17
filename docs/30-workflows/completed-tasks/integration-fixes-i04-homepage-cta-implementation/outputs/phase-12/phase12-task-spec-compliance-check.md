# Phase 12 compliance check

| Phase | 必須 output | 存在 | 備考 |
|-------|-------------|------|------|
| 1 | requirements.md | ✅ | |
| 2 | design.md | ✅ | token mapping 追記 |
| 3 | design-review.md | ✅ | |
| 4 | test-plan.md | ✅ | jest-dom 不採用注記 |
| 5 | implementation-plan.md | ✅ | |
| 6 | test-expansion.md | ✅ | |
| 7 | coverage-check.md | ✅ | |
| 8 | refactor.md | ✅ | |
| 9 | qa.md | ✅ | |
| 10 | final-review.md | ✅ | |
| 11 | screenshot-plan.json / manual-test-result.md / screenshots 3 件 | ✅ / ✅ / ✅ | local mock API + Playwright chromium |
| 12 | 6 成果物 | ✅ | 本ファイル含む |

## 実コード変更確認

`git diff --stat`:
- `apps/web/app/page.tsx`（+3）
- `apps/web/src/styles/legacy-public.css`（+52）

untracked 新規:
- `apps/web/src/components/public/CallToActionCTA.tsx`
- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx`
- `apps/web/src/lib/constants/form.ts`
- `apps/web/src/lib/constants/__tests__/form.spec.ts`
- `apps/web/app/(public)/register/page.tsx`
- `apps/web/app/login/_components/LoginStatus.tsx`
- `apps/web/playwright/tests/public-top-and-list.spec.ts`

## ゲート

| ゲート | 結果 |
|--------|------|
| `pnpm typecheck` | PASS |
| `pnpm -F "@ubm-hyogo/web" typecheck` | PASS |
| targeted ESLint | PASS |
| `pnpm lint` | PASS |
| vitest targeted (10 tests) | PASS |
| targeted Playwright smoke (`/` case) | PASS |
| HEX grep (call-to-action) | 0 件 |
| responder URL hardcode 一覧 | constants/form.ts + form.spec.ts のみ |
| Phase 11 screenshots | PASS（3 PNG） |
| parent spec / unassigned-task / integration-fixes index sync | PASS |
