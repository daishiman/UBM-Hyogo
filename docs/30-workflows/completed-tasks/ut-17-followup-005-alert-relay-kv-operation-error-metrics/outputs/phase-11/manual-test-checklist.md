# Manual Test Checklist

NON_VISUAL task. Manual runtime check is limited to user-gated Workers Logs tail after deploy.

- [ ] Deploy staging after user approval.
- [ ] Run `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging --format pretty | grep alert_relay_kv_op_failed`.
- [ ] Confirm emitted JSON matches the runbook field table.
