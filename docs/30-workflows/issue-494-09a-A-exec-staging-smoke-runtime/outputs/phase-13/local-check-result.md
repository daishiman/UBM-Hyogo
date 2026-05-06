# Local check result

Status: prepared_runtime_pending

Local structural checks are recorded by the review cycle. Runtime checks require G1-G4 approvals and have not been executed.

Required before G4:

- `git status`
- `git diff --stat`
- artifact parity check
- secret / PII grep on `outputs/phase-11/evidence/`
- `pnpm lint` if available and scoped to changed docs/code
