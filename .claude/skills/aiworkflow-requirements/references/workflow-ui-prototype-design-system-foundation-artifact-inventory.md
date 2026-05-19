# Workflow Artifact Inventory: UI Prototype Design System Foundation

## Summary

| item | value |
|------|-------|
| workflow | `docs/30-workflows/ui-prototype-design-system-foundation/` |
| status | `spec_created / implementation / VISUAL`（parallel-01: `runtime_pending`） |
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
| `parallel-01-globals-css-rhythm/outputs/phase-11/` | local CSS selector evidence for P1-1〜P1-5 and admin shell width |

## Implementation Boundary

The review cycle added minimal `apps/web` hooks for AppShell data attributes,
member-card hover, tag-pill selector, `data-visibility` markers, and
parallel-01 P1-1〜P1-5 `globals.css` selectors plus the admin shell `272px`
width hook (09h SSOT). Admin grid 240px → 272px alignment is now SSOT'd to
`docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` (L20 / L42 /
L107 / L138) and `apps/web/app/(admin)/layout.tsx`
(`md:grid-cols-[272px_1fr]`).

`apps/web/src/styles/tokens.css` is the **color token SSOT** (`--ubm-color-*` and
`[data-theme="warm"|"cool"]` overrides only); `apps/web/src/styles/globals.css`
owns Tailwind v4 `@theme inline` bridge + rhythm / typography / data-attr
selector hooks. SRP: never declare color token values inside `globals.css`,
never declare rhythm / selector / shadow rules inside `tokens.css`.
See [[lessons-learned-ui-prototype-design-system-foundation-globals-css-rhythm-2026-05]]
(L-UIPROTO-001..005) for the responsibility split rationale and recovery
patterns.

Full 19-route blueprint binding and runtime visual screenshots
remain owned by the active workflow phases.
Future implementation must use `PROTOTYPE-COVERAGE.md` and keep the current
`apps/web/app/**` paths, including root app paths for `/login`, `/profile`,
`/privacy`, and `/terms`.

## Sub-workflows

| sub-workflow | scope | inventory | status |
|--------------|-------|-----------|--------|
| `parallel-04-shared-page-chrome` | `apps/web/app/{layout,error,not-found,loading}.tsx` の共通 chrome 実装と root fallback visual evidence | [workflow-parallel-04-shared-page-chrome-artifact-inventory.md](workflow-parallel-04-shared-page-chrome-artifact-inventory.md) | `spec_created / implementation / VISUAL / Phase 11 evidence captured (EV-01..16)` (2026-05-19) |

Phase 12 strict 7 outputs は parent root `outputs/phase-12/` に集約し、sub-workflow には
複製しない（parent-sub-workflow strict7 aggregation parity）。

## P1-1〜P1-5 Selector ↔ Token ↔ 09 Spec Mapping (parallel-01)

`apps/web/src/styles/globals.css` の `@layer components` に追加した data-attr
selector と、参照する `--ubm-*` token、対応する 09 spec section の対応表。
追加位置と詳細は `parallel-01-globals-css-rhythm/phase-05-implementation-guide.md`
を参照。

| P# | selector | 主 token (`--ubm-*`) | 09 spec section |
|----|----------|----------------------|------------------|
| P1-1 | `[data-route]` | `color-surface-bg`, `color-text-primary` | 09h-shell-and-fixtures §shell 切替 / 09a §App shell |
| P1-2 | `[data-section]`, `[data-section-rhythm="compact|comfortable|loose"]` | `space-4`, `space-8`, `space-12` | 09e/09f/09g screen blueprints (section rhythm) / prototype `.content-area` L262-268 |
| P1-3 | `[data-card]`, `[data-card-tone="panel|surface|emphasis|flat"]` | `color-surface-panel`, `color-surface-panel-2`, `color-surface-bg-2`, `color-border-default`, `color-border-strong`, `radius-md`, `radius-lg`, `shadow-xs`, `shadow-md` | 09c-primitives §card / prototype `.card` / `.card-flat` L303-323 |
| P1-4 | `[data-shell="topbar|sidebar|footer"]` | `color-surface-panel`, `color-surface-bg-2`, `color-border-default` | 09h-shell-and-fixtures §AdminSidebar 272px / §Topbar / prototype `app.jsx` shells |
| P1-5 | `[data-text="display|title|section|card|body|caption|eyebrow"]` | `text-3xl`, `text-2xl`, `text-xl`, `text-lg`, `text-base`, `text-sm`, `text-xs`, `color-text-primary`, `color-text-secondary`, `color-text-muted` | 09b-design-tokens §typography scale / 09c-primitives §Heading/Text |

### Related selector hooks (shared with parallel-02 review cycle)

| selector | 主 token | 用途 |
|----------|---------|------|
| `[data-component="member-card"]` (+ `:hover` / `:focus-within`) | `radius-md`, `color-border-default`, `color-border-strong`, `color-surface-panel`, `shadow-xs`, `shadow-sm` | 公開メンバー一覧の card hover/focus 強調 |
| `[data-component="member-tags"] [data-component="badge"]`, `[data-component="tag-pill"]` | radius (999px), `color-accent`, `color-accent-soft`, `color-accent-ink` | tag pill / selected 状態 |
| `[data-visibility="public|member|admin"]` | `color-ok`, `color-info`, `color-warn`, `color-border-default` | visibility marker (border-inline-start) |
