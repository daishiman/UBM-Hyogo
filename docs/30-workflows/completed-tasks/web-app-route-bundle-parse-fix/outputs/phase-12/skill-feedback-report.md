# Skill Feedback Report

## テンプレ改善

Build pipeline tasks should require Phase 11 to include both command evidence and artifact grep evidence. For OpenNext Workers, `build:cloudflare` alone is insufficient unless `.open-next/worker.js` is generated and checked for known bad virtual specifiers.

| Routing | Decision |
| --- | --- |
| promotion target | `task-specification-creator` Phase 11 evidence guidance |
| decision | no same-wave skill edit |
| reason | Existing Phase 11/12 rules already require canonical evidence paths, command exit codes, and grep-gate evidence. This workflow contributes an applied example, not a missing structural rule. |
| evidence path | `outputs/phase-11/evidence/build.log`, `outputs/phase-11/evidence/grep-gate.log` |

## ワークフロー改善

Phase directory references must use zero-padded output paths (`outputs/phase-04/`) even when `artifacts.json` phase keys use `phase-4`. A link drift grep should run before Phase 12 PASS.

| Routing | Decision |
| --- | --- |
| promotion target | `task-specification-creator` Phase 12 compliance checklist |
| decision | no same-wave skill edit |
| reason | Current workflow was normalized to zero-padded output paths. Existing rules already require strict output filenames and path parity; no new template surface is required. |
| evidence path | `phase12-task-spec-compliance-check.md` |

## ドキュメント改善

Next.js major-version default builder changes can be runtime-breaking even if TypeScript and route code are unchanged. Phase 1 root cause templates should include builder default drift (`Turbopack` vs `webpack`) as a first-class hypothesis for Cloudflare Workers App Route failures.

| Routing | Decision |
| --- | --- |
| promotion target | `aiworkflow-requirements` lessons |
| decision | promoted same-wave |
| reason | This is project-specific OpenNext Workers operational knowledge, so the owning home is aiworkflow requirements lessons rather than a generic task template edit. |
| evidence path | `.claude/skills/aiworkflow-requirements/references/lessons-learned-web-app-route-bundle-parse-fix-2026-05.md` |
