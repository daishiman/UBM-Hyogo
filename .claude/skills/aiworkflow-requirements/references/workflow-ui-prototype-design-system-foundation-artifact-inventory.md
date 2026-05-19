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

## Sub-workflows

| sub-workflow | scope | inventory | status |
|--------------|-------|-----------|--------|
| `parallel-04-shared-page-chrome` | `apps/web/app/{layout,error,not-found,loading}.tsx` の共通 chrome 実装と root fallback visual evidence | [workflow-parallel-04-shared-page-chrome-artifact-inventory.md](workflow-parallel-04-shared-page-chrome-artifact-inventory.md) | `spec_created / implementation / VISUAL / Phase 11 evidence captured (EV-01..16)` (2026-05-19) |

Phase 12 strict 7 outputs は parent root `outputs/phase-12/` に集約し、sub-workflow には
複製しない（parent-sub-workflow strict7 aggregation parity）。
