# Phase 4 Output: I/O and CLI Contract

Verdict: `COMPLETED`

CLI implemented through:

```bash
bash scripts/cf.sh audit-log feature-export
```

Supported inputs:

- `--days <positive integer>`
- `--from <ISO UTC> --to <ISO UTC>`
- `--out <jsonl path>`
- `--manifest-out <json path>`
- `--fixture <path>` for local evidence
- `CF_AUDIT_REDACT_SECRET`

Invalid window combinations fail before D1 access: `--days` cannot be mixed with `--from/--to`, and `--from` / `--to` must be provided together.
