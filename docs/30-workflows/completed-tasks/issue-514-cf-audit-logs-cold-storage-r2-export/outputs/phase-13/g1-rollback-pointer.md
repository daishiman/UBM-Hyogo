# G1 Rollback Pointer

Status: `PENDING_USER_APPROVAL`

Before G1 deploy, record current production Worker version:

```bash
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
```

Rollback command template:

```bash
bash scripts/cf.sh rollback <version-id> --config apps/api/wrangler.toml --env production
```

No rollback target version has been captured in this task-spec cycle.
