# Documentation Changelog

## 2026-05-16

| Path | Change |
| --- | --- |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/index.md` | Added workflow state, user-gated runtime boundary, formal follow-up path, outputs inventory |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/phase-1-requirements.md` | Replaced overbroad PR blocker wording with PR check activation boundary |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/phase-2-design.md` | Added user-gated checkpoint and canonical baseline PR import method |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/phase-3-design-review.md` | Reclassified runtime capture as same-task user-gated checkpoint |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/phase-5-implementation.md` | Added user approval marker step |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/phase-10-final-review.md` | Linked branch-protection follow-up |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/phase-12-documentation.md` | Added strict 7 output inventory and formal follow-up path |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/phase-13-pr.md` | Replaced premature checked boxes with unchecked runtime checklist |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/artifacts.json` | Added root workflow ledger |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/artifacts.json` | Added parity mirror |
| `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-12/*.md` | Added Phase 12 strict 7 outputs |
| `docs/30-workflows/unassigned-task/task-709-fu-branch-protection-required-check.md` | Formalized governance follow-up |
| `.claude/skills/aiworkflow-requirements/*` | Added same-wave canonical registration |

## Validator Notes

- `cmp -s artifacts.json outputs/artifacts.json` must be green.
- `outputs/phase-12/` must contain the strict 7 files listed in `phase-12-spec.md`.
- Runtime command logs remain pending until user approval.
