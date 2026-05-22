# Phase 7 Output: Coverage Check

## Acceptance Coverage

| AC | Coverage |
| --- | --- |
| AC-1 actionlint gate | T-5 / T-7 / CI job step |
| AC-2 shellcheck gate | T-2 / T-3 / T-4 / CI job steps |
| AC-3 target scope limited | command paths use `post-release-observation-reminder.yml` and `scripts/observation/*.sh` only |
| AC-4 local reproducibility | `pnpm observation:lint` plus temporary actionlint download |
| AC-5 broken YAML / shell detected | Phase 6 failure cases |
| AC-6 specs synced | Phase 12 outputs and aiworkflow references |

## Gate

All acceptance criteria have local static evidence or a documented runtime boundary.
