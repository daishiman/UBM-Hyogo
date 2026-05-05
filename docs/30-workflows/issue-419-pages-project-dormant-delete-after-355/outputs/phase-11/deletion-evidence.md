# Deletion Evidence

state: PENDING_RUNTIME_EXECUTION
date: -
operator: -
redaction: -
runtime_pass: PENDING
ac_link: AC-4, AC-5

## Command

```bash
bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes
```

## Runtime Result

| Field | Value |
| --- | --- |
| project_name | - |
| command_help_checked | - |
| exit_code | - |
| redacted_output_path_or_excerpt | - |

## PASS Criteria

- AC-1 through AC-4 were PASS before deletion.
- Exit code is 0.
- Output is redacted before persistence.
