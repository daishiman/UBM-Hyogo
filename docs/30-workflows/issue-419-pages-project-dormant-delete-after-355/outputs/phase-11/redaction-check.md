# Redaction Check

state: PENDING_RUNTIME_EXECUTION
date: -
operator: -
redaction: -
runtime_pass: PENDING
ac_link: AC-5

## Command

```bash
rg -i '(CLOUDFLARE_API_TOKEN|bearer|token=|sink|secret|account_id)' \
  docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/
```

## Runtime Result

| Field | Value |
| --- | --- |
| executed_at | - |
| match_count | - |
| remediation_needed | - |

## PASS Criteria

- Match count is 0 after approved redaction.
- No token, Bearer value, sink URL query, OAuth value, or account identifier intended for masking remains in evidence.
