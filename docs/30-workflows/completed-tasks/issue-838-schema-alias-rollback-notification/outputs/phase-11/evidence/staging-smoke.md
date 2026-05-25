# Staging Runtime Smoke Evidence — issue-838 schema alias rollback notification

## Status

`placeholder_created_runtime_pending`

This evidence file is intentionally tracked before the user-gated staging run so local metadata and Phase 12 gates can point at a real path. Runtime values must be added only after the operator runs `scripts/runtime-smoke/schema-alias-rollback.sh` and redacts output through the helper.

## Execution Command

```bash
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias <TEST_ALIAS_ID> --scenario sent
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias <TEST_ALIAS_ID> --scenario skipped
bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias <TEST_ALIAS_ID> --scenario failed
```

## Scenario S-sent

| Field | Value |
| --- | --- |
| Status | `runtime_pending` |
| Rollback HTTP status | pending |
| Notification channel | pending |
| Audit `after_json.status` | pending |
| Audit `after_json.attempts` | pending |

## Scenario S-skipped

| Field | Value |
| --- | --- |
| Status | `runtime_pending` |
| Reason | pending staging configuration check |
| Audit `after_json.status` | pending |

## Scenario S-failed

| Field | Value |
| --- | --- |
| Status | `runtime_pending` |
| Failure injection | pending |
| Rollback response preserved | pending |
| Audit `after_json.errorClass` | pending |

## AC Mapping

| AC | Status | Evidence |
| --- | --- | --- |
| AC-1 helper syntax/dry-run | pending local verification | `bash -n` + `--dry-run` |
| AC-2 secret redaction | pending local verification | helper `redact()` pipe |
| AC-3 staging runtime 3 cases | runtime_pending | S-sent / S-skipped / S-failed tables |
| AC-4 parent manual-test-result cross-link | pending | `../manual-test-result.md` |
| AC-5 parent artifacts Gate-C path | pending | parent `artifacts.json` |

## Redaction Note

Do not paste raw webhook URLs, bearer tokens, Cloudflare tokens, `X-Auth-Key`, actor email values, or provider response bodies containing secret material. Use only output passed through the helper `redact()` pipeline.
