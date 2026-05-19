# Documentation Changelog

## 2026-05-18

| file | change |
|------|--------|
| `PROTOTYPE-COVERAGE.md` | prototype source inventory / route coverage / 30-method compact evidence / four-condition gate を追加 |
| `SCOPE.md` | AppShell / page.tsx の現状を「存在しない」から「data-* / prototype reflection 不足」へ補正 |
| `index.md` | Prototype Coverage SSOT セクションと `serial-00-design` 例外を追加 |
| `serial-00-design/phase-03-task-breakdown.md` | 旧 `src/app` 系 path を `apps/web/app` へ補正し、root 配下 routes を明記 |
| `serial-05-page-routes-blueprint-binding/phase-03-task-breakdown.md` | `current_app_path` 優先ルールを追加 |
| `parallel-03-appshell-layouts/phase-13-commit-pr.md` | docs-only / split PR 前提を撤回し、同一 PR 方針へ統一 |
| `parallel-04-shared-page-chrome/phase-11-evidence-inventory.md` | VISUAL screenshot を必須化 |
| `parallel-04-shared-page-chrome/phase-03/04/05/07/08/10/11/12/13` | 旧 worktree 絶対パス、非実在 verify script、alias import drift、並列境界表現を補正 |
| `serial-07-regression-evidence/phase-12-compliance.md` | canonical 9 headings の対象を Phase 12 compliance に限定 |
| `artifacts.json`, `outputs/artifacts.json` | root / outputs parity ledger を追加 |
| `outputs/phase-12/*` | strict 7 成果物を追加 |
| `docs/00-getting-started-manual/specs/09a-prototype-map.md`, `09h-shell-and-fixtures.md` | stale `apps/web/src/app` path を `apps/web/app` へ補正 |
| `apps/web/app/{layout.tsx,error.tsx,not-found.tsx,loading.tsx,(public)/layout.tsx,(admin)/layout.tsx,(member)/layout.tsx}` | root fallback chrome と AppShell `data-theme` / `data-shell` / `data-route` hook を追加 |
| `apps/web/src/styles/globals.css`, `MemberTags.tsx`, `MemberDetailSections.tsx` | prototype selector hook（member-card / tag-pill / data-visibility）を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL.md`, `SKILL-changelog.md`, `LOGS/_legacy.md`, `changelog/20260518-ui-prototype-design-system-foundation.md` | aiworkflow-requirements 変更履歴を同 wave 同期 |

## Entry Checklist

```bash
git status --porcelain apps/ packages/
```

Result: `apps/web` dirty diff introduced by this cycle for minimal AppShell / selector hooks. `packages/` remains unchanged.
