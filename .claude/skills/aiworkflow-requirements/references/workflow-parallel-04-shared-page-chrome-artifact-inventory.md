# Workflow Artifact Inventory: parallel-04 Shared Page Chrome

## Summary

| item | value |
|------|-------|
| parent workflow | `docs/30-workflows/ui-prototype-design-system-foundation/` |
| sub workflow | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/` |
| status | `spec_created / implementation / VISUAL / Phase 11 evidence captured (EV-01..16)` |
| created | 2026-05-19 |
| commit | 549ec713a20313bd2dbc9fed9658514ee9cc355f |
| parent artifacts | `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json` |
| parent outputs artifacts | `docs/30-workflows/ui-prototype-design-system-foundation/outputs/artifacts.json` |
| Phase 12 集約方針 | sub-workflow には Phase 12 strict 7 を複製せず parent root `outputs/phase-12/` に集約 |

## Scope

`apps/web/app/**` の root fallback 4 ファイル（layout / error / not-found / loading）を `claude-design-prototype/` の primitives + tokens + rhythm に整合させ、19 routes 全ページから参照される共通 chrome を確立する。

## Canonical Sources

| source | purpose |
|--------|---------|
| `docs/00-getting-started-manual/claude-design-prototype/app.jsx` | shell / nav source |
| `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` | Card / EmptyState 等 primitive source |
| `docs/00-getting-started-manual/claude-design-prototype/styles.css` | rhythm / token source |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | OKLch token contract |
| `docs/00-getting-started-manual/specs/09c-primitives.md` | primitive contract |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` | shell / fixture / fallback contract |

## Implementation Targets

| ファイル | 変更内容 |
|---------|---------|
| `apps/web/app/layout.tsx` | warm theme / OKLch token 読込順整合 / metadata template / viewport export / `ToastProvider` root mount 維持 |
| `apps/web/app/error.tsx` | Card primitive 採用 / `logger.error` を mount 時 1 回（`useEffect` 依存配列 `[]`） |
| `apps/web/app/not-found.tsx` | Card + EmptyState primitive 採用 |
| `apps/web/app/loading.tsx` | Card 内 skeleton grey 帯 |
| `apps/web/app/__tests__/error.component.spec.tsx` | error boundary + 単発 logger 呼出のテスト |
| `apps/web/app/__smoke__/loading-state/{page,loading}.tsx` | `/smoke/loading-state` fixture（task-25 follow-up 由来） |

## Workflow Outputs

| output | purpose |
|--------|---------|
| `parallel-04-shared-page-chrome/SCOPE.md` | sub-workflow scope |
| `parallel-04-shared-page-chrome/phase-01..13-*.md` | Phase 1-13 仕様 |
| `parallel-04-shared-page-chrome/outputs/phase-11/{typecheck,lint,vitest,build,design-tokens,test-suffix,pr-ready}.log` | EV-01..07 静的 gate ログ |
| `parallel-04-shared-page-chrome/outputs/phase-11/toast-provider-grep.txt` | EV-08 ToastProvider 単一 mount runtime source-only grep |
| `parallel-04-shared-page-chrome/outputs/phase-11/hex-direct-grep.txt` | EV-09 HEX 直書き禁止 grep |
| `parallel-04-shared-page-chrome/outputs/phase-11/screenshot-plan.json` | EV-10 capture plan |
| `parallel-04-shared-page-chrome/outputs/phase-11/phase11-capture-metadata.json` | EV-11 capture provenance |
| `parallel-04-shared-page-chrome/outputs/phase-11/{root-layout,fallback-error,fallback-not-found,fallback-loading}.png` | EV-12..15 root chrome / fallback visual evidence |
| `parallel-04-shared-page-chrome/outputs/phase-11/ui-sanity-visual-review.md` | EV-16 viewport / overlap / token / CTA 人手レビュー |
| parent `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` | Phase 12 strict 7（parent root に集約） |

## Evidence Inventory

| evidence ID | 種別 | 紐付 gate |
|-------------|-----|----------|
| EV-01 | typecheck.log | QG-01 |
| EV-02 | lint.log | QG-02 |
| EV-03 | vitest.log | QG-03 |
| EV-04 | build.log | QG-04 |
| EV-05 | design-tokens.log | QG-05 |
| EV-06 | test-suffix.log | QG-06 |
| EV-07 | pr-ready.log | QG-07 |
| EV-08 | toast-provider-grep.txt | QG-08 (`__tests__` 除外 runtime source-only) |
| EV-09 | hex-direct-grep.txt | QG-09 (`bg-[#xxx]` / `text-[#xxx]` ゼロ確認) |
| EV-10 | screenshot-plan.json | VISUAL plan |
| EV-11 | phase11-capture-metadata.json | VISUAL provenance |
| EV-12 | root-layout.png | root chrome |
| EV-13 | fallback-error.png | error fallback |
| EV-14 | fallback-not-found.png | not-found fallback |
| EV-15 | fallback-loading.png | loading fallback |
| EV-16 | ui-sanity-visual-review.md | human visual review |

## Implementation Boundary

- 新規 API endpoint / D1 schema / Google Form 仕様変更なし。
- 既存 `apps/web/app/**` root 配置を維持し、`/login` / `/profile` / `/privacy` / `/terms` の root app path は変更しない。
- 19 routes 全体 visual regression は serial-07 の責務。本 sub-workflow は root fallback 4 PNG (EV-12..15) のみを必須証跡として保持する。
- production build は OpenNext Workers 互換のため `next build --webpack` を正本とし Turbopack を deploy bundle に混入させない。
- commit / push / PR は user-gated（本 sub-workflow では作成しない）。

## Lessons / Cross-link

- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-parallel-04-root-chrome-2026-05.md` (L-PARA04-001..007)
- `.claude/skills/aiworkflow-requirements/changelog/20260519-parallel-04-shared-page-chrome.md`
- 親 artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-ui-prototype-design-system-foundation-artifact-inventory.md`
