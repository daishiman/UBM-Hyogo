# Failure Cases

| Case | Expected Handling |
| --- | --- |
| Empty member id list | Return empty map without query |
| More than chunk size ids | Split into 80-id chunks |
| Missing schema/index | Stop and route schema diff to 02b |
| Deleted meeting session | Exclude from profile attendance |
| D1 timeout | Surface API error through existing route error handling |
| Duplicate attendance rows | Preserve deterministic order and document DB constraint follow-up if needed |
