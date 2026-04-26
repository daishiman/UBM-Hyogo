# DRY Config Policy

Keep D1 binding metadata in `wrangler.toml`; keep runtime contention policy in the runbook.

| Concern | Policy |
| --- | --- |
| Binding name | Use one stable binding name, `DB`. |
| Database IDs | Environment-specific values are managed by the owning runtime task. |
| WAL policy | Do not duplicate mutation commands across environments unless official support is proven. |
| Comments | One concise comment should point to the runbook decision flow. |
