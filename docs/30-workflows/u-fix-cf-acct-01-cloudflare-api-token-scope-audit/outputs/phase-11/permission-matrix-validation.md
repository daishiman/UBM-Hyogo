# Phase 11 Permission Matrix Validation (planned)

## Status

| Item | Value |
| --- | --- |
| Task ID | U-FIX-CF-ACCT-01 |
| Evidence state | planned template |
| Runtime/dashboard execution | not executed |
| Reason | Cloudflare Dashboard Token inspection and Token reissue require explicit user approval |

## Required Permission Matrix

| Resource | Permission | Required | Evidence source | Result |
| --- | --- | --- | --- | --- |
| Account / Workers Scripts | Edit | yes | Cloudflare Dashboard permission name only | planned |
| Account / D1 | Edit | yes | Cloudflare Dashboard permission name only | planned |
| Account / Cloudflare Pages | Edit | yes | Cloudflare Dashboard permission name only | planned |
| Account / Account Settings | Read | yes | Cloudflare Dashboard permission name only | planned |
| Account / Workers KV Storage | Edit | conditional | add only if Phase 11 dry-run proves required | planned |
| User / User Details | Read | conditional | add only if token verify proves required | planned |
| Other permissions | none | must be zero | Dashboard permission list | planned |

## Recording Rules

- Record permission names only.
- Do not record Token value, Token ID, Account ID value, Dashboard URL, IP restriction values, or TTL values.
- If any non-required permission is present, AC-1 remains FAIL until the Token is reduced and smoke is rerun.
- If a conditional permission is needed, update Phase 2, Phase 5, Phase 11, Phase 12, and the ADR in the same wave.

