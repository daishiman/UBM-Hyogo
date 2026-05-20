# Future OIDC Supported Path

| Gate | Requirement | Current cycle result |
|---|---|---|
| G1 | Official Cloudflare Workers deploy OIDC support documents supported inputs and exchange behavior | Not satisfied; keep API token path. |
| G2 | Staging proof succeeds with redacted logs and claim pin validation | Blocked by G1. |
| G3 | Production cutover succeeds with `main` / `production` subject claim | Blocked by G2. |
| G4 | Observation proves fallback count zero, then legacy token revocation may proceed | Blocked by G3. |

Rollback:

- Until G4 is complete, keep step-scoped `CLOUDFLARE_API_TOKEN` as the rollback path.
- If OIDC deploy fails in a future cycle, revert the workflow change and return to the current safe baseline.
