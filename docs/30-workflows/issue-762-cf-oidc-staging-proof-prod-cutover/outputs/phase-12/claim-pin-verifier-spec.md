# Claim Pin Verifier Spec

CLI:

```bash
scripts/oidc/verify-claim-pin.sh --repository <owner/repo> --ref <ref> --environment <environment> --event-name <event_name>
```

Expected constants:

| Field | Value |
|---|---|
| repository | `daishiman/UBM-Hyogo` |
| event_name | `push` |
| ref/environment | `refs/heads/main` + `production`, or `refs/heads/dev` + `staging` |

Exit codes:

| Code | Meaning |
|---|---|
| 0 | All values match. |
| 1 | One or more claim values mismatch. |
| 2 | Missing or unknown CLI argument. |

Side effects: none. The script does not request or decode a real OIDC token and does not call external APIs.
