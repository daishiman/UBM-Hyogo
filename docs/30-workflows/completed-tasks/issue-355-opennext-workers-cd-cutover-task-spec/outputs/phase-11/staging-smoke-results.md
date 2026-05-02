# Staging Smoke Results Evidence Contract

## Status

`PENDING_IMPLEMENTATION_FOLLOW_UP`

## Boundary

This workflow is NON_VISUAL and deploy-deferred. Staging smoke must be captured only after the Workers deploy path exists and user-approved execution has occurred.

## Required Evidence On Execution

| Case | Required outcome |
| --- | --- |
| Public landing | HTTP success from staging Worker route |
| Member directory | HTTP success and API service binding path works |
| Login route | HTTP success without exposing email address after submit |
| Profile gate | unauthenticated redirect remains intact |
| Admin gate | unauthorized access remains blocked |
| Rollback readiness | previous Workers version id is recorded before production promotion |

