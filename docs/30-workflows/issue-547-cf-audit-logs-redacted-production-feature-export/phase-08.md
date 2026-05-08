# Phase 8: Error Handling and Security

## Fail Closed Cases

- Missing or short redaction secret.
- `--from >= --to`.
- `--days <= 0`.
- D1 query failure.
- Invalid `RedactedFeatures` schema.
- `guardJsonlOrThrow()` violation.
- `scanForSecrets()` hit.
- Output path write failure.

## Security Rules

- Do not log raw D1 rows.
- Do not print actor email, full IP, full UA, token values, or `raw_json`.
- Positive leakage fixtures are allowed only under `tests/fixtures/cf-audit/` and must never be copied into Phase 11 evidence.
- Runtime production command must be user-gated.

## Completion

- Unit tests cover every fail-closed branch that can be exercised locally.
