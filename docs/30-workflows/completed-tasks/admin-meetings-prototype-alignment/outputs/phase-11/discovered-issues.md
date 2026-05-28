# Discovered Issues

| ID | Finding | Classification | Handling |
| --- | --- | --- | --- |
| DI-01 | Staging `ADMIN_FETCH_404` was observed before this workflow and is outside this UI alignment scope. | Info | Do not block this workflow; auth/session recovery must be handled separately if still reproducible. |
| DI-02 | Staging runtime recapture remains pending because commit / push / PR and staging execution are user-gated. Local runtime screenshots are captured. | User-gated pending boundary | Track through `phase11-capture-metadata.json` and the unassigned staging follow-up. |

One unassigned staging follow-up is recorded at `docs/30-workflows/unassigned-task/admin-meetings-staging-admin-fetch-404-runtime-followup.md`.
