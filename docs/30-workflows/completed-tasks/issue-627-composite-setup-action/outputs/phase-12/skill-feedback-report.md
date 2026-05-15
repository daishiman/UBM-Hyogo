# Skill Feedback Report

## Template Improvements

| finding | route |
| --- | --- |
| `spec_created` phase files used `[x]` completion phrasing that could be mistaken for executed evidence. | Addressed in workflow files by changing wording to `仕様記述済`. No skill change required. |
| Closed issue workflows need early `Refs #NNN` enforcement. | Already covered by task-specification-creator Closed Issue Reference Rule; applied here. |

## Workflow Improvements

| finding | route |
| --- | --- |
| The contract terms `engine`, `setup-mode`, `runner`, and `setup-strategy` drifted. | Normalized to `setup-strategy`. |
| The checkout boundary was ambiguous. | Fixed as checkout-less composite action; callers retain checkout. |

## Documentation Improvements

| finding | route |
| --- | --- |
| Phase 12 strict 7 files were missing. | Materialized under `outputs/phase-12/`. |
| aiworkflow current registration was missing. | Added same-wave registration files. |
