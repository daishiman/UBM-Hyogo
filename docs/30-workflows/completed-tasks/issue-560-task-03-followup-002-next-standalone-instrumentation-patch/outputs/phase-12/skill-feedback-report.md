# Skill Feedback Report

## Template Improvement

| Field | Value |
| --- | --- |
| symptom | Phase plan used `RED` / `spec_created` wording even though a patch script already existed. |
| cause | Template assumes greenfield implementation unless Phase 2 explicitly records current implementation files. |
| recurrence condition | Follow-up task formalizes an existing workaround into a hardened implementation. |
| 5-minute resolution | Add a Phase 2 gate: inspect existing target files before freezing phase labels and artifact state. |
| evidence path | `scripts/patch-next-standalone-instrumentation.mjs`, `apps/web/open-next.config.ts` |
| promoted-to | `.claude/skills/task-specification-creator/references/phase-template-core.md` candidate; no direct skill edit required in this cycle because the issue is recorded as skill feedback. |

## Workflow Improvement

| Field | Value |
| --- | --- |
| symptom | CI workflow placeholder could drift to a non-owner workflow. |
| cause | Spec creation did not force real workflow file discovery before CI gate design. |
| recurrence condition | Build artifact or CI-only tasks that name a workflow generically. |
| 5-minute resolution | Require `rg --files .github/workflows` and select an existing owner before Phase 3. |
| evidence path | `.github/workflows/pr-build-test.yml` |
| promoted-to | task-specification-creator skill feedback; same-wave implementation used the existing workflow file. |

## Documentation Improvement

| Field | Value |
| --- | --- |
| symptom | Phase 12 evidence omitted `topic-map.md` / `keywords.json` and source follow-up consumed marker. |
| cause | System spec summary focused on human-authored docs and under-described generated index outputs. |
| recurrence condition | aiworkflow-requirements sync creates both reference files and generated indexes. |
| 5-minute resolution | Phase 12 summary must list generated indexes and the source follow-up consumed marker when present. |
| evidence path | `outputs/phase-12/system-spec-update-summary.md`, `docs/30-workflows/completed-tasks/task-03-followup-002-next-standalone-instrumentation-patch-001.md` |
| promoted-to | No-op direct skill edit; this report is sufficient because the main task-spec skill already has generated-index sync guidance. |
