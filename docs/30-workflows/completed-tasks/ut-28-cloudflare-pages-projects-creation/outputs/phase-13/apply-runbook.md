# Apply Runbook

## Status

NOT EXECUTED

## Preflight

- Confirm 01b and UT-05 are completed.
- Confirm `bash scripts/cf.sh pages project create --help` supports the planned flags. If not, use a documented API/PATCH fallback after approval.
- Confirm OpenNext deployment form. `pages_build_output_dir = ".next"` is a blocker unless UT-05 records a Pages-form exception.

## Apply

Use `bash scripts/cf.sh` for all Cloudflare commands. Do not run bare CLI commands.

