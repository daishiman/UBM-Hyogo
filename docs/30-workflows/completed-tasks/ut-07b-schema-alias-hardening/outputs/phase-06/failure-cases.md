# Failure Cases

Status: spec_created

| Failure | Expected handling |
| --- | --- |
| repository pre-check collision | 409 without mutation |
| DB UNIQUE collision race | 409 mapped from constraint failure |
| CPU budget exhaustion | retryable response with persisted cursor/status |
| partial back-fill failure | Stage 1 remains committed; Stage 2 resumes or fails explicitly |
| stale cursor | reject or recompute from DB state without double update |
| deleted member rows | excluded from back-fill |
| invalid stable key | 422 |
