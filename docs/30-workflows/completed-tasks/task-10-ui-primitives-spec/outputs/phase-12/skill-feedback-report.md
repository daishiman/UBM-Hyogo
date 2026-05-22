# Skill Feedback Report

## テンプレート改善

| item | promotion target | evidence path |
| --- | --- | --- |
| UI primitive task では、Phase 1 の P50 check で既存 `apps/web/src/components/ui` inventory を必須にする | `task-specification-creator` future template candidate（大規模テンプレ変更のため今回は no-op） | `phase-01.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## ワークフロー改善

| item | promotion target | evidence path |
| --- | --- | --- |
| `VISUAL_ON_EXECUTION` の UI task は local implementation PASS と runtime screenshot PASS を分離する | already covered by `phase-11-guide.md`; no-op | `outputs/phase-11/main.md` |
| `build:cloudflare` が environment blocker で失敗した時に `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を使わない | `task-specification-creator` future pitfall candidate（今回 docs に明記） | `outputs/phase-11/evidence/build.log` |

## ドキュメント改善

| item | promotion target | evidence path |
| --- | --- | --- |
| 既存 UI baseline と新規 contract が二重正本化した場合は、C/M/R 表と barrel export owner 表を Phase 2 必須にする | `aiworkflow-requirements` UI primitive section updated | `.claude/skills/aiworkflow-requirements/references/ui-ux-components.md` |
