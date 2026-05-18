# Inventory before runtime mutation

Status: `PENDING_USER_GATE`

This file is intentionally a template placeholder. The live inventory requires GitHub
repository and environment reads, and any subsequent secret or variable mirroring is
user-gated.

After explicit approval, collect name-only inventory with:

```bash
gh secret list --repo daishiman/UBM-Hyogo
gh secret list --repo daishiman/UBM-Hyogo --env production
gh variable list --repo daishiman/UBM-Hyogo
gh variable list --repo daishiman/UBM-Hyogo --env production
```

Record only names and timestamps. Do not record secret values, webhook URLs, token
material, provider responses, or raw Cloudflare account identifiers.

Expected local YAML state before push:

- `.github/workflows/cf-audit-log-monitor.yml` has no `environment: production`
  line in the `fetch-and-analyze` job.
- Secret and variable reference names remain unchanged so approved repository-level
  mirroring can use the same names.
