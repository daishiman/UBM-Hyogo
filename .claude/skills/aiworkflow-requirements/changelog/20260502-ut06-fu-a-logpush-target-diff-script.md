# UT-06-FU-A Logpush Target Diff Script Sync

## Summary

UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 を implementation_complete として正本同期。

## Updated Canonical References

- `references/deployment-cloudflare-opennext-workers.md`
- `references/task-workflow-active.md`
- `indexes/quick-reference.md`
- `indexes/resource-map.md`

## Current Facts

- Public command: `bash scripts/cf.sh observability-diff --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web --config apps/web/wrangler.toml`
- Internal script: `scripts/observability-target-diff.sh`
- Redaction module: `scripts/lib/redaction.sh`
- Tests: `bash tests/unit/redaction.test.sh` = 11 PASS / 0 FAIL, `bash tests/integration/observability-target-diff.test.sh` = 18 PASS / 0 FAIL
- Boundary: read-only diff only. Production deploy, DNS cutover, Logpush mutation, and legacy Worker deletion remain separate approval operations.
