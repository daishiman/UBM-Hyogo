# Manual Smoke Log

Status: non-canonical / superseded-by-manual-evidence

This file is retained as a non-canonical scratch template. Canonical Phase 11 evidence is:

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-evidence.md`
- `outputs/phase-11/link-checklist.md`

Legacy template:

| Check | Command family | Result |
| --- | --- | --- |
| staging D1 baseline | `bash scripts/cf.sh d1 ...` | pending execution |
| 2-step migration | `bash scripts/cf.sh d1 migrations ...` | pending execution |
| 10,000 row fixture | `bash scripts/cf.sh d1 execute ...` | pending execution |
| retryable response | `curl` + response JSON | pending execution |
| idempotent retry | D1 count/audit queries | pending execution |
| UNIQUE reject | D1 insert rejection | pending execution |
| secret/PII grep | `rg` | pending execution |
