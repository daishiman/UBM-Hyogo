# Unassigned Task Detection

Detected follow-ups:

| ID | Task | Status | Enable condition | Owner |
|---|---|---|---|---|
| 1 | Real OIDC cutover in `web-cd.yml` with `id-token: write` and supported exchange | blocked | G1: official Cloudflare support documented | issue-717-followup-001 remaining scope |
| 2 | Staging OIDC proof run | blocked | Real cutover implementation merged to staging path | issue-717-followup-001 remaining scope |
| 3 | Production OIDC cutover | blocked | Staging proof and observation pass | issue-717-followup-001 remaining scope |
| 4 | Replace `oidc-observation-window.yml` no-op with real fallback-count verifier | blocked | Real OIDC cutover merged and fallback signal source defined | issue-717-followup-001 remaining scope |
| 5 | Legacy `CLOUDFLARE_API_TOKEN` physical revocation | blocked | G4: fallback count zero | `docs/30-workflows/issue-718-legacy-cf-token-revocation/` canonical path |
| 6 | apps/api D1 token cutover | existing | Independent app-layer credential scope | issue-717-followup-002 |
| 7 | 1Password restructure | existing | OIDC cutover contract fixed | issue-717-followup-003 |

No new backlog item is needed for this cycle because the remaining work already has an owner or is the unconsumed portion of `issue-717-followup-001`. The no-op observation verifier replacement is now explicitly folded into that remaining scope instead of being left implicit.

Dependency order:

```text
G1 official support -> real OIDC cutover -> staging proof -> production cutover -> observation -> legacy token revocation
```
