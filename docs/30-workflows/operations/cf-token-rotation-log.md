# Cloudflare API Token Rotation Log

> Append-only. Do not record token values, token identifiers, scope details, hashes, or screenshots of secret pages.
> RETIRED: 90 day calendar rotation was retired on 2026-06-08. New entries should use the provisioning/revocation event format in `cf-token-provisioning-and-revocation-runbook.md`.

## Template

| Field | Value |
| --- | --- |
| Rotation date | YYYY-MM-DD |
| Operator | @username |
| Reminder issue | #NNN |
| Staging new token issue time | YYYY-MM-DDTHH:MM:SSZ |
| Staging smoke pass time | YYYY-MM-DDTHH:MM:SSZ |
| Staging old token disable time | YYYY-MM-DDTHH:MM:SSZ |
| Staging old token delete time | YYYY-MM-DDTHH:MM:SSZ |
| Production approval time | YYYY-MM-DDTHH:MM:SSZ |
| Production new token issue time | YYYY-MM-DDTHH:MM:SSZ |
| Production smoke pass time | YYYY-MM-DDTHH:MM:SSZ |
| Production old token disable time | YYYY-MM-DDTHH:MM:SSZ |
| Production old token delete time | YYYY-MM-DDTHH:MM:SSZ |
| CF_TOKEN_ISSUED_AT after rotation | YYYY-MM-DD |
| Validation summary | PASS / FAIL summary without secret values |
| Rollback used | no / yes, with short reason |
| Related PR | #NNN |

## Entries

### 2026-06-08 Policy Retirement

| Field | Value |
| --- | --- |
| Change date | 2026-06-08 |
| Operator | Codex local implementation |
| Policy change | 90 day calendar rotation retired |
| Replacement | Non-expiring, least-privilege, environment-scoped tokens with event-based revocation |
| Canonical runbook | `docs/30-workflows/operations/cf-token-provisioning-and-revocation-runbook.md` |
| Related workflow | `docs/30-workflows/completed-tasks/cf-token-env-contract-and-rotation-retirement/` |
| Validation summary | Local verifier/actionlint/tests recorded in the workflow Phase 11 evidence directory; token creation and GitHub secret mutation remain user-gated |
| Rollback used | no |

### YYYY-MM-DD Rotation N

Use the template above and replace placeholders during an approved rotation cycle.
