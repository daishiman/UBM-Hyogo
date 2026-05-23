# Runtime Pending Evidence — recovery-rootcause.md

## Required Fields

| Field | Value |
| --- | --- |
| `classification` | `infrastructure` / `production-code` / `configuration` / `unknown` |
| `sample_run_url` | GitHub Actions run URL |
| `job_failure_excerpt` | Redacted log excerpt |
| `d_prime_zero_candidate` | ISO8601 UTC after root-cause fix |

## Boundary

This file is a template. The real `recovery-rootcause.md` must be produced
from read-only `gh run list` / `gh api .../jobs` evidence and must not include
secret values.
