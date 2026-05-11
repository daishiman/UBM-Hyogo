# Phase 12 Task Spec Compliance Check

| Gate | Result | Evidence |
| --- | --- | --- |
| Phase 12 strict 7 files | PASS | `outputs/phase-12/*.md` |
| Phase 1-13 output references | PASS | `outputs/phase-01..13/main.md` exist where declared |
| Root/output artifacts parity | PASS | `cmp -s artifacts.json outputs/artifacts.json` |
| Apps/packages real diff present | PASS | `package.json`, `pnpm-lock.yaml`, `apps/web/src/components/ui/Stat.tsx`, smoke route/spec |
| Build evidence | PASS | `outputs/phase-11/evidence/after-build-cloudflare.log` |
| Typecheck/lint/test evidence | PASS | `root-typecheck.log`, `root-lint.log`, `web-typecheck.log`, `web-lint.log`, `web-ui-test.log` |
| Wrangler wrapper evidence | PASS | `cf-sh-wrapper-version.log` |
| aiworkflow followup-001 sync | PASS | lesson / changelog / artifact inventory files added |
| Visual/axe downstream evidence | PASS | parent task-10 screenshot + `axe-report.json` |
| No commit/PR/push | PASS | Not executed |

## 4 Conditions

| Condition | Result |
| --- | --- |
| 矛盾なし | PASS |
| 漏れなし | PASS |
| 整合性あり | PASS |
| 依存関係整合 | PASS |
