# Workflow artifact inventory: admin-sidebar-collapsed-icon-spacing-parity

## Summary

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-sidebar-collapsed-icon-spacing-parity/` |
| status | `implemented_local_runtime_pending / implementation / VISUAL_ON_EXECUTION / staging_visual_pending_user_gate` |
| purpose | collapsed admin sidebar の nav / public-return icon-box 高さを expanded と同じ `18px` リズムへ揃える |
| predecessor | `admin-sidebar-collapse-layout-fix`（中央軸補正）。本件は縦ピッチ補正で重複しない |
| visual boundary | local capture harness/spec added; PNG capture blocked by Next dev webServer timeout; staging authenticated visual screenshot remains user-gated |
| user gate | staging authenticated visual screenshot, commit, push, PR |

## Implementation

| Area | Files |
| --- | --- |
| shell components | `apps/web/src/components/shell/SidebarNavItem.tsx`, `apps/web/src/components/shell/SidebarShell.tsx` |
| focused tests | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`, `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` |
| local visual capture | `apps/web/app/visual-harness/[name]/VisualScenarios.client.tsx`, `apps/web/app/visual-harness/[name]/page.tsx`, `apps/web/playwright/tests/visual/admin-sidebar-spacing.spec.ts`, `apps/web/playwright.parallel09.config.ts` |
| workflow evidence | `docs/30-workflows/completed-tasks/admin-sidebar-collapsed-icon-spacing-parity/outputs/phase-11/evidence/{vitest-sidebar,typecheck,lint,tokens,git-diff-apps-api}.log`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Evidence

| Check | Result |
| --- | --- |
| focused Vitest | `SidebarNavItem.spec.tsx` / `SidebarShell.spec.tsx`: 2 files / 20 tests PASS |
| web typecheck | PASS |
| web lint | PASS |
| design token gate | `tokens.runtime.spec.ts`: 9 tests PASS |
| apps/api diff | empty |
| local screenshot capture | blocked_before_test_execution: Next dev webServer did not return `/visual-harness/admin-sidebar-spacing-collapsed` within 240s; manual retry also timed out while compiling instrumentation/middleware/visual-harness |
| staging screenshot | pending_user_gate |

## Invariants

- API endpoint / D1 schema / Google Form schema / auth middleware are unchanged.
- `ShellIcon` glyph remains fixed 18x18px; only collapsed icon-box height changes.
- `w-10`, `w-full`, `justify-center`, `sr-only`, `aria-current`, and tooltip wiring remain unchanged.
- `SidebarBrand` and `SidebarUserMenu` intentionally keep their `h-10 w-10` mark/avatar boxes because they are not nav-row rhythm items.

## Lessons Learned

| ID | Lesson |
| --- | --- |
| L-ASCISP-001 | Collapsed nav rhythm is a height problem, not a width problem. The predecessor `admin-sidebar-collapse-layout-fix` already fixed the horizontal center axis via `w-10 justify-center`; this follow-up shrinks only the icon-box **height** (`h-10` -> `h-[18px]`) and keeps `w-10`. Touching width would regress the predecessor's center-axis fix. |
| L-ASCISP-002 | Not every collapsed `h-10 w-10` box should be unified. `SidebarBrand` mark and `SidebarUserMenu` avatar are identity/decoration boxes outside the nav-row pitch, so they intentionally stay `h-10`. Distinguishing nav-rhythm items from identity boxes is why OOS-1/OOS-2 stay candidate-only and were not ticketed. The focused spec asserts both sides (`h-[18px]` for nav/public-return, `h-10` for brand/avatar) to lock the distinction against regression. |
| L-ASCISP-003 | When local PNG capture is blocked by a Next dev webServer timeout, deterministic local contracts (className assertion / DOM shape / typecheck / lint / design-token gate / focused Vitest) can be present-ized in the same wave while only the authenticated staging screenshot stays `pending`. A blocked PNG must never be claimed as PASS; classify it as `capture_spec_added_runtime_blocked`. |

## Follow-up relationship

This workflow is a later refinement of `admin-sidebar-collapse-layout-fix`, not a duplicate. The predecessor fixed the collapsed center axis and list padding; this follow-up keeps that center axis while shrinking only nav/public-return icon-box height from `h-10` to `h-[18px]`. Brand mark and user avatar keep their intentional `h-10 w-10` boxes.
