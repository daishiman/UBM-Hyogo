# Workflow Artifact Inventory: UI Prototype Design System Foundation

## Summary

| item | value |
|------|-------|
| workflow | `docs/30-workflows/ui-prototype-design-system-foundation/` |
| status | `spec_created / implementation / VISUAL` |
| created | 2026-05-18 |
| root artifacts | `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json` |
| outputs artifacts | `docs/30-workflows/ui-prototype-design-system-foundation/outputs/artifacts.json` |
| prototype coverage SSOT | `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md` |

## Canonical Sources

| source | purpose |
|--------|---------|
| `docs/00-getting-started-manual/claude-design-prototype/app.jsx` | shell / nav source |
| `docs/00-getting-started-manual/claude-design-prototype/data.jsx` | fixture source |
| `docs/00-getting-started-manual/claude-design-prototype/icons.jsx` | icon source |
| `docs/00-getting-started-manual/claude-design-prototype/index.html` | prototype boot / embedded style source |
| `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` | public screens |
| `docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx` | member / auth screens |
| `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | admin screens |
| `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` | prototype primitives |
| `docs/00-getting-started-manual/claude-design-prototype/styles.css` | rhythm / selector source |
| `docs/00-getting-started-manual/specs/09a-prototype-map.md` | source map |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | token contract |
| `docs/00-getting-started-manual/specs/09c-primitives.md` | primitive contract |
| `docs/00-getting-started-manual/specs/09d-icons.md` | icon contract |
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | public blueprint |
| `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` | member blueprint |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | admin blueprint |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` | shell / fixture / fallback |

## Workflow Outputs

| output | purpose |
|--------|---------|
| `SCOPE.md` | workflow scope and 19-route contract |
| `index.md` | root metadata and sub-workflow topology |
| `PROTOTYPE-COVERAGE.md` | source-to-route implementation matrix |
| `outputs/phase-12/main.md` | Phase 12 summary |
| `outputs/phase-12/implementation-guide.md` | implementation guidance |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow sync summary |
| `outputs/phase-12/documentation-changelog.md` | changed docs log |
| `outputs/phase-12/unassigned-task-detection.md` | open task detection |
| `outputs/phase-12/skill-feedback-report.md` | skill feedback |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical compliance check |

## Implementation Boundary

The review cycle added minimal `apps/web` hooks for AppShell data attributes,
member-card hover, tag-pill selector, and `data-visibility` markers. Full
19-route blueprint binding and runtime visual screenshots remain owned by the
active workflow phases. Future implementation must use `PROTOTYPE-COVERAGE.md`
and keep the current `apps/web/app/**` paths, including root app paths for
`/login`, `/profile`, `/privacy`, and `/terms`.

## Sub-workflow: parallel-03 AppShell Layouts（2026-05-19）

| item | value |
|------|-------|
| sub-workflow | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL (public chrome only; admin/member deferred-to-serial-07)` |
| implementation_mode | `existing-layout-alignment`（既存 layout に data-* 契約と shell chrome を機械的に当てる mode。新規 primitive / API / D1 schema 追加なし） |
| edited files | `apps/web/app/(public)/layout.tsx`, `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(member)/layout.tsx` |
| added specs | `apps/web/app/(public)/layout.spec.tsx`, `apps/web/app/(member)/layout.spec.tsx`, `apps/web/app/(admin)/layout.spec.tsx` |
| data-* 契約 | wrapper `data-theme="warm"\|"cool"\|"neutral"` / `data-route-group="public"\|"member"\|"admin"` / `data-testid="{group}-shell"`、`<main data-route="{group}">`、admin は `<header data-shell="topbar">` を追加 |
| color tokens | OKLch tokens via `var(--ubm-color-*)` 経由のみ。HEX 直書きなし（`hex-scan.log` no matches） |
| primitive preservation | `PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader` / `SignOutButton` 全て props / signature 無改変 |
| admin auth defense | `getSession()` ベースで 2 段 redirect（未認証 → `/login?next=/admin`、non-admin → `/login?gate=forbidden`）を維持。Server Component (async) + `next/navigation` redirect で test し、`vi.mock('next/navigation')` の `redirect` throw + `RedirectError` で分岐検証 |
| visual evidence boundary | public shell の実 screenshot を本 sub-workflow で取得、admin/member full chrome は親 workflow `serial-07-regression-evidence/` に `deferred-to-serial-07` ラベルで委譲 |
| Phase 11 evidence | `outputs/phase-11/{evidence-inventory.md, screenshot-coverage.md, screenshots/, typecheck.log, lint.log, verify-design-tokens.log, hex-scan.log, layout-specs.log, admin-layout-spec.log, web-build.log, dom-scrape-public.txt, diff-stat.txt, verify-test-suffix.log}` |
| Phase 12 evidence | `outputs/phase-12/implementation-guide.md`（strict 7 のうち本 sub-workflow scope 分） |
| DoD trace | DoD-01..10 すべて充足（既存 primitive 無改変 / data-* 契約 / OKLch only / spec coverage / axe critical 0 / typecheck / lint / token gate / hex scan / build） |
| out-of-scope | `/privacy` / `/terms` / `/profile` の route group 再配置は serial-05、admin/member runtime full chrome screenshot は serial-07 |
| user gate | commit / push / PR / serial-07 visual evidence capture |
