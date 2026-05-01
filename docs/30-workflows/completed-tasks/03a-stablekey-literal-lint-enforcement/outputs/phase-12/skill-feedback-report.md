# Skill Feedback Report

| Finding | Promotion target | Decision | Evidence path |
| --- | --- | --- | --- |
| Phase 11 evidence names drifted between artifacts and phase docs | task-specification-creator | Promote as checklist reminder if repeated | `phase-11.md`, `artifacts.json` |
| Phase 12 canonical filenames drifted | task-specification-creator | Already covered by strict filename table; no skill change needed | `phase-12.md` |
| spec_created workflow needs explicit NOT_EXECUTED evidence placeholders | task-specification-creator | Defer; current guidance covers boundary, but examples may help | `outputs/phase-11/*` |
| invariant #1 sync waits for actual enforcement evidence | aiworkflow-requirements | No-op for this wave; sync during implementation/release wave | `system-spec-update-summary.md` |
| root/output artifacts parity drift can be masked by stale template text | task-specification-creator | Promote: Phase 12 compliance must check actual file existence before choosing the root-only or parity wording | `artifacts.json`, `outputs/artifacts.json`, `phase12-task-spec-compliance-check.md` |
| spec_created workflow can become enforced_dry_run during review | task-specification-creator | Promote: once implementation files and runtime evidence exist, lifecycle state must be reclassified in root/output artifacts and Phase 12 | `scripts/lint-stablekey-literal.mjs`, `outputs/phase-11/manual-smoke-log.md` |

No direct skill file edit is required in this pass; the promotion items above are recorded as concrete skill feedback.
