# Manual Smoke Log

NON_VISUAL task. No browser screenshot is required.

## Local Commands

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test tagCandidateEnqueue
rg "TAG_QUEUE_PAUSED|parsePaused|UBM-TAGQ-PAUSED" apps/api/src apps/api/wrangler.toml
test -f docs/30-workflows/runbooks/tag-queue-pause.md
```

## Runtime Boundary

Cloudflare deploy, production D1 inspection, commit, push, and PR creation require explicit user approval and are not part of this local evidence capture.
