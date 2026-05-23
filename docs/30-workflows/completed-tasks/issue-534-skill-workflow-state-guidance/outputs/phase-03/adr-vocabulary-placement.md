# ADR: Vocabulary Placement

## Decision

Place workflow state vocabulary in
`.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
and Phase 12 compliance guidance in
`.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`.

## Rationale

The vocabulary is used across Phase 1, Phase 11, Phase 12, and Phase 13. Keeping
it in a dedicated reference avoids burying root state rules inside a Phase 12
only document.

## Alternatives

| Alternative | Decision |
| --- | --- |
| Add only to `phase-12-spec.md` | Rejected: too narrow for Phase 11 and archive/delete gates. |
| Add to aiworkflow-requirements only | Rejected: owning behavior is task-specification-creator. |
| Keep only in workflow issue-534 | Rejected: future tasks need one-hop access from SKILL.md. |
