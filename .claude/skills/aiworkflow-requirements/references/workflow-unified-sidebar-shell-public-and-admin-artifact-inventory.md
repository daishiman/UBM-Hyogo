# workflow-unified-sidebar-shell-public-and-admin artifact inventory

作成日: 2026-05-28

## Summary

`unified-sidebar-shell-public-and-admin` is a `spec_created / implementation / VISUAL` parent workflow. It defines a unified collapsible sidebar shell for public, member, and admin route groups. Task A/B/C/E implementation evidence is present through PR #1028 / commit `278001606`; Task D admin migration and Task F staging visual baseline remain Gate-C/user-gated.

## Canonical workflow

| Artifact | Path | Status |
| --- | --- | --- |
| root | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/` | present |
| index | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/index.md` | present |
| root artifacts | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/artifacts.json` | present |
| output artifacts | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/artifacts.json` | present |
| Phase 1-13 | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/phase-*.md` | present |
| strict 7 | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/*.md` | present |
| A-F task specs | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/*.md` | present |
| task-A sub-workflow | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive/` | present |
| task-A standalone root | `docs/30-workflows/task-A-sidebar-shell-primitive/` | collapsed into parent |
| Task B sub-workflow | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/` | present |
| Task B root artifacts | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/artifacts.json` | present |
| Task B output artifacts | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/artifacts.json` | present |
| Task B compliance | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-12/phase12-task-spec-compliance-check.md` | present |
| Task B screenshot: viewer | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots/user-menu-viewer.png` | present |
| Task B screenshot: member | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots/user-menu-member.png` | present |
| Task B screenshot: admin | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots/user-menu-admin.png` | present |
| Task B screenshot: collapsed | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/outputs/phase-11/screenshots/user-menu-collapsed.png` | present |

## Planned implementation targets

| Target | Purpose |
| --- | --- |
| `apps/web/src/components/shell/**` | New SidebarShell primitive, nav config, user menu, drawer, tests |
| `apps/web/app/(public)/layout.tsx` | Public layout integration |
| `apps/web/app/(member)/layout.tsx` | Member layout integration |
| `apps/web/app/(admin)/layout.tsx` | Admin layout migration |
| `apps/web/src/styles/tokens.css` | Shell tokens |
| `apps/web/tests/e2e/sidebar-shell-smoke.spec.ts` | Role x viewport smoke |
| `apps/web/tests/e2e/sidebar-shell-visual.spec.ts` | Visual baseline |

## Current code anchors

| Anchor | Path |
| --- | --- |
| admin sidebar current nav | `apps/web/src/components/layout/AdminSidebar.tsx` |
| public header | `apps/web/src/components/public/PublicHeader.tsx` |
| member header | `apps/web/src/components/layout/MemberHeader.tsx` |
| sign out | `apps/web/src/components/auth/SignOutButton.tsx` |

## Gates

| Gate | Status | Boundary |
| --- | --- | --- |
| Gate-A | passed | spec / strict 7 / aiworkflow sync |
| Gate-B | partial | Task A/B/C/E apps/web implementation, focused tests/typecheck/lint, grep gate, and local source evidence present; Task D and Task F staging visual baseline still pending |
| Gate-C | pending | commit, push, PR, CI visual baseline |

## Sub-workflows

| ID | Path | Status | Strict 7 owner |
| --- | --- | --- | --- |
| Task A sidebar shell primitive | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-A-sidebar-shell-primitive/` | `implemented_local_evidence_captured / implementation / VISUAL` | parent root `outputs/phase-12/` |
| Task B user menu and role handling | `docs/30-workflows/completed-tasks/unified-sidebar-shell-task-b-user-menu-and-role-handling/` | `implementation_verified / implementation / VISUAL` | parent root `outputs/phase-12/` |
| Task C public/member layout integration | `docs/30-workflows/task-c-public-member-sidebar-shell-integration/` | `implemented_local_evidence_captured / implementation / VISUAL / runtime_visual_pending` | own root `outputs/phase-12/` |

Sub-workflow Phase 12 rule: Task B owns only `outputs/phase-12/phase12-task-spec-compliance-check.md`. Parent root remains the strict 7 SSOT.

## Lessons Learned

参照: `lessons-learned/lessons-learned-unified-sidebar-shell-task-a-2026-05.md` および Task B wave (L-USERMENU-001..005)

### Task A wave (L-USS-*)

- **L-USS-001**: parent workflow + nested sub-workflow の topology — standalone root を作らず `tasks/<task-id>/` に nest し `hasCompletedTasksAncestor=true` を維持
- **L-USS-002**: Server / Client component の境界を slot で固定 — `SidebarShellServer` のみ session 解決、`SidebarShell` は plain props + `ReactNode` slot
- **L-USS-003**: `useSidebarState` は SSR 初期値 deterministic — 初期 `collapsed=false`、`useEffect` で localStorage `ubm:shell:collapsed` を hydrate
- **L-USS-003b**: `apps/web` の `localStorage` lint は substring 検出 — `safe-local-storage` util に集約し path allowlist で抜く (現状 `useSidebarState.ts` は lint fail / Gate-B follow-up)
- **L-USS-004**: `buildNavForRole(role, ctx)` を pure 関数化 — viewer=3 / member=4 / admin=13、`shell-config.spec.ts` で全 branch 網羅
- **L-USS-005**: Task B 先行実装でも Task A 契約は崩さない — UserMenu props は slot に閉じ、上流の test を守る
- **L-USS-006**: tokens.css は `[data-theme='cool']` variant 同時追加 — `verify-design-tokens` fail と cool theme drift を予防

### Task B wave (L-USERMENU-*)

| ID | Lesson | Why | How to apply |
| --- | --- | --- | --- |
| L-USERMENU-001 | sidebar user menu の popover は外部ライブラリではなく native `<details>` 契約で実装する | Cloudflare Workers の bundle size と SSR/CSR 境界の単純化を最優先するため。外部 popover library は client island を肥大化させる | role x action の単純な開閉のみが要件である UI primitive では `<details>/<summary>` で表現し、a11y/keyboard handling をブラウザ標準に委譲する |
| L-USERMENU-002 | role→action 集合は `user-menu-config.ts` の pure function に固定する | role 判定が複数 component に散ると drift する。`viewer`/`member`/`admin` の語彙統一が Task B 同期境界の本体 | UI で表示する actions を component に書かず、pure function `getUserMenuActions(role)` 等の単一 source からのみ取得する。focused vitest はこの contract を直接検証する |
| L-USERMENU-003 | SidebarUserMenu は client component、parent layout は server component、橋渡しは props のみで行う | server-only auth resolution と client-side popover state を一つの component に同居させると Next.js App Router の render boundary が壊れる | sidebar shell では `getAuthView()` 等を server で解決し、`role` と `displayName` を client `SidebarUserMenu` に props として渡す。`use client` directive は user menu component に限定する |
| L-USERMENU-004 | focused vitest + visual harness (`app/visual-harness/[name]`) の 2 段 evidence を Phase 11 の正本にする | Playwright single-spec 実行は CI baseline 整備前でも local で再現でき、focused vitest が role/action 契約を逐語検証する | role バリエーション (viewer/member/admin/collapsed) ごとの screenshot は visual-harness で role を URL param 経由で切替えて撮影し、focused vitest log と並べて Phase 11 evidence に置く |
| L-USERMENU-005 | sub-workflow の strict 7 は親 root に集約し、sub は `phase12-task-spec-compliance-check.md` のみ所有する | Phase 12 SSOT を sub と parent で二重化すると documentation-changelog / unassigned-task-detection / skill-feedback-report が drift する | parent + sub 構成の workflow では、sub の `outputs/phase-12/` に compliance-check のみ置き、他 6 種は parent root に write-through する。inventory `## Sub-workflows` 節で `strict 7 owner` 列を明示する |
