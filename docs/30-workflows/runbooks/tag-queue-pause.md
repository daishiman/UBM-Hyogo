# Tag Queue Pause Runbook

## Overview

`TAG_QUEUE_PAUSED` stops only Forms sync candidate enqueue into `tag_assignment_queue`.
It does not stop `/admin/tags/queue` listing, existing queue resolve/reject operations, retry tick, or `member_tags` writes performed by the guarded resolve workflow.

The parser is strict:

| Value | Meaning |
| --- | --- |
| unset | enqueue enabled |
| `"false"` | enqueue enabled |
| `"true"` | enqueue paused |
| any other value | enqueue enabled |

Use lower-case `true` only. Values such as `True`, `TRUE`, `1`, or `yes` do not pause enqueue.

## Emergency Pause

1. Edit the target environment vars in `apps/api/wrangler.toml`.
2. Set `TAG_QUEUE_PAUSED = "true"` in the target section:
   - production: `[env.production.vars]`
   - staging: `[env.staging.vars]`
   - local/default: `[vars]`
3. Deploy the API worker after explicit production approval:

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

4. Confirm the next Forms response sync emits structured log code `UBM-TAGQ-PAUSED`.

## Verification

Confirm no new candidate rows were created after the pause deployment:

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT COUNT(*) AS recent_candidates FROM tag_assignment_queue WHERE created_at > datetime('now','-10 minutes')"
```

Confirm the deployed worker contains the pause guard before relying on runtime state:

```bash
rg "TAG_QUEUE_PAUSED|UBM-TAGQ-PAUSED|parsePaused" apps/api/src apps/api/wrangler.toml
```

## Recovery

1. Edit the same target environment vars section in `apps/api/wrangler.toml`.
2. Set `TAG_QUEUE_PAUSED = "false"`.
3. Redeploy the API worker:

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

4. Confirm a subsequent Forms response sync can enqueue candidates again when the member has no tags and no unresolved candidate.

## Safety Notes

- Do not use `wrangler secret put`; this is a non-secret operational variable.
- Do not create an admin UI toggle in an emergency. The code path is intentionally a deploy-gated guard.
- Keep production deploy, verification, commit, push, and PR as separate user-approved operations.
