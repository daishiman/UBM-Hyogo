# Skill Feedback Report

## テンプレ改善

なし。Phase 12 strict 7 files and artifacts parity rules already caught the missing outputs.

## ワークフロー改善

Promotion target: `task-specification-creator` Phase 12 / Phase 11 boundary guidance.

Evidence path: `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log`.

Applied lesson: implementation workflows must be reclassified from `spec_created` to `implemented-local` in the same cycle that `apps/` or `packages/` code changes are present. `CONTRACT_READY_IMPLEMENTATION_PENDING` is valid only before code changes exist. Once code is changed and logs are captured, use `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` for local evidence + runtime pending.

## ドキュメント改善

Promotion target: `aiworkflow-requirements`.

Evidence path: `.claude/skills/aiworkflow-requirements/{SKILL.md,indexes/quick-reference.md,indexes/resource-map.md,references/task-workflow-active.md}`.

Applied lesson: aiworkflow-requirements should keep a quick-reference row for UT-02A follow-up architecture tasks so source stubs can be traced to promoted workflow roots.
