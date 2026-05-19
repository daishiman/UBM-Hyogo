# Workflow Artifact Inventory: UI Prototype Design System Foundation

## Summary

| item | value |
|------|-------|
| workflow | `docs/30-workflows/ui-prototype-design-system-foundation/` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_RUNTIME_PENDING` |
| created | 2026-05-18 |
| last synced | 2026-05-19 (parallel-02 close-out) |
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
| `parallel-02-prototype-css-rules-port/outputs/phase-12/phase12-task-spec-compliance-check.md` | sub-workflow compliance check |

## Implementation Boundary

The review cycle added minimal `apps/web` hooks for AppShell data attributes
and normalized parallel-02 G3 CSS marker blocks for member-card hover,
tag-pill selector, and `data-visibility` markers. Full
19-route blueprint binding and runtime visual screenshots remain owned by the
active workflow phases. Future implementation must use `PROTOTYPE-COVERAGE.md`
and keep the current `apps/web/app/**` paths, including root app paths for
`/login`, `/profile`, `/privacy`, and `/terms`.

## parallel-02 prototype CSS rules port (2026-05-19 close-out)

| item | value |
|------|-------|
| sub-workflow | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-02-prototype-css-rules-port/` |
| status | `implemented_local_evidence_captured / VISUAL_RUNTIME_PENDING` |
| implementation files | `apps/web/src/styles/globals.css` (G3-1 / G3-2 / G3-3 start/end markers), `apps/web/src/components/public/MemberFilters.client.tsx` (`data-component="tag-pill"` + `aria-selected`), `apps/web/app/visual-harness/[name]/{page.tsx,VisualScenarios.client.tsx}`, `apps/web/playwright/tests/visual/parallel-02-css-rules.spec.ts` |
| evidence (present) | Phase 11: 9 screenshots + 5 logs, canonical 9 headings PASS, strict 7 outputs (root + sub-workflow) present |
| evidence (pending) | production-equivalent runtime screenshots (user-gated; tracked by UT-DSF-07) |
| lessons learned | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-parallel-02-prototype-css-rules-port-2026-05.md` |

## Follow-up unassigned tasks (proto-spec)

| id | path | scope |
|----|------|-------|
| UT-DSF-01 | `docs/30-workflows/unassigned-task/UT-DSF-01-parallel-01-globals-css-rhythm-implementation.md` | parallel-01 globals.css rhythm / spacing token block implementation |
| UT-DSF-02 | `docs/30-workflows/unassigned-task/UT-DSF-02-parallel-03-appshell-layouts-implementation.md` | parallel-03 AppShell layout implementation |
| UT-DSF-03 | `docs/30-workflows/unassigned-task/UT-DSF-03-parallel-04-shared-page-chrome-implementation.md` | parallel-04 shared page chrome (header / footer / nav) implementation |
| UT-DSF-04 | `docs/30-workflows/unassigned-task/UT-DSF-04-serial-05-page-routes-blueprint-binding-implementation.md` | serial-05 19-route blueprint binding implementation |
| UT-DSF-05 | `docs/30-workflows/unassigned-task/UT-DSF-05-serial-06-form-response-binding-implementation.md` | serial-06 form response binding implementation |
| UT-DSF-06 | `docs/30-workflows/unassigned-task/UT-DSF-06-serial-07-regression-evidence-implementation.md` | serial-07 regression evidence implementation |
| UT-DSF-07 | `docs/30-workflows/unassigned-task/UT-DSF-07-visual-runtime-production-equivalent-screenshots.md` | production-equivalent runtime visual screenshot recapture |

## Difficulties summary (parallel-02)

1. 共有 `globals.css` の並列編集マーカー prefix ルール（`/* === parallel-XX <subid> <intent> (start/end) === */`、先着優先、`merge=union` 不可）
2. `VISUAL_RUNTIME_PENDING` / `implemented_local_evidence_captured` の status vocabulary 正式登録（local screenshot ≠ production runtime visual 境界）
3. Phase 11 evidence 表の二層運用（`present` のみ validator 物理検証、`pending` は inventory ledger 記録）
4. `apps/web/src/styles/globals.css` は `merge=union` 不可ファイル（`.gitattributes` 対象外維持）
5. `unassigned-task/` 単一ファイル proto-spec → Phase 1-13 spec 昇格パス
6. design-tokens fallback 併記ルール（`var(--ubm-dur-fast, .15s)` / `var(--ubm-ease-standard, ease)`）
7. canonical 9 headings の root と sub-workflow 本文密度差（1.x 中学生説明節有無）許容方針

詳細は `lessons-learned-parallel-02-prototype-css-rules-port-2026-05.md` L-P02-001..007 を参照。
