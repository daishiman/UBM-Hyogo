# Phase 11 Manual Test Result — responsive-mobile-tablet-ui-fixes

workflow_state: `implemented_local_visual_present_staging_pending` / generated_at: 2026-06-11T22:34:00+09:00 / updated_at: 2026-06-12T09:10:40+09:00

## Summary

Same-cycle implementation was completed for the `apps/web` responsive CSS / drawer / visual guard scope. Focused local
tests, local runtime smoke, and local physical PNG capture passed. Authenticated admin staging screenshots and commit / push / PR remain user-gated.

2026-06-12 update: Phase 5 仕様との突合で残ギャップ 2 件を検出・是正し、全 gate を再実行して PASS を確認した。

| # | Gap（Phase 5 仕様明記・未実装だった項目） | 是正 |
| --- | --- | --- |
| 1 | `globals.css` `@media (max-width: 720px)`（member route ブロック）が非標準境界のまま残存（Phase 5 §2 は `767.98px` を明記、Phase 10 の「720 が 0」主張と矛盾していた） | `767.98px` へ統一。boundary-740 viewport smoke で是正帯の単カラム化を確認 |
| 2 | `viewports.ts` の `mobileNarrow`(375×812) additive 追加（Phase 5 §9 / 変更ファイル一覧明記）が未実施 | additive 追加（既存定数不変・playwright.config.ts は明示キー参照のみで非影響） |

| Gate | Status | Evidence |
| --- | --- | --- |
| Local focused vitest | PASS | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` → 5 tests passed（2026-06-12 再実行） |
| Token gate | PASS | `mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens` → 9 tests passed（2026-06-12 再実行） |
| Typecheck / lint | PASS | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint`（monorepo 全体）exited 0（2026-06-12 再実行） |
| Local runtime smoke | PASS | `outputs/phase-11/runtime-smoke-result.json`: 9 routes × 4 viewports（375/390/740/768）= 36 checks 全て `overflow=false`（2026-06-12 post-gap-fix 再実行） |
| Boundary grep gate | PASS | `grep "max-width: 900px\|max-width: 720px" apps/web/src/styles/` → メディアクエリ残存 0（`legacy-public.css:814` は要素プロパティで対象外） |
| apps/api unchanged | PASS | `git diff --name-only -- apps/api` returned empty |
| Local physical PNG | PASS | `outputs/phase-11/screenshots/*.png` 5 files; `screenshot-plan.json`, `phase11-capture-metadata.json`, `screenshot-coverage.md` present; all captured routes `overflowX=false` |
| Staging visual screenshot | PENDING_USER_APPROVAL | authenticated staging baseline remains external/user-gated |

> Playwright visual-full baseline PNG は `-linux` suffix（CI 生成）のため darwin ローカルでは screenshot 比較不能。
> 追加した `scrollWidth <= clientWidth + 1` poll guard の挙動は上記 runtime smoke（同一アサート式）で代替検証した。

## Runtime Boundary

Local smoke used `AUTH_SECRET=local-dev-secret pnpm --filter @ubm-hyogo/web dev --hostname 127.0.0.1 --port 3210`. The Codex in-app
Browser backend `iab` was unavailable, so local Playwright Chromium was used against the same dev server for PNG capture. Admin pages
redirected to `/login` without an authenticated session; this still verifies the narrow unauthenticated shell path, while
authenticated admin visual baselines remain pending user approval.
