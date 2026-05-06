# Cloudflare API Token Rotation Log

> Append-only. Do not record token values, token identifiers, scope details, hashes, or screenshots of secret pages.

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

### YYYY-MM-DD Rotation N

Use the template above and replace placeholders during an approved rotation cycle.
