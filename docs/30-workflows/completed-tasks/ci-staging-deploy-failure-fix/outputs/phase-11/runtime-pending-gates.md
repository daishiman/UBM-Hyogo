# Runtime pending gates

| Gate | Required action | Why pending |
| --- | --- | --- |
| RT-01 | Cloudflare staging / production API tokens are created or rotated with D1:Edit + Workers Scripts:Edit + Account Settings:Read | external account mutation; requires user approval |
| RT-02 | GitHub Environment `staging` / `production` `CLOUDFLARE_API_TOKEN` secrets are updated | secret mutation; requires user approval |
| RT-03 | `dev` push triggers `web-cd / deploy-staging` and build step succeeds | push is user-gated |
| RT-04 | `backend-ci / deploy-staging` D1 migration step succeeds | depends on RT-01 and RT-02 |
| RT-05 | staging Worker `/` returns HTTP 200 after deploy | depends on successful deploy |

These gates are not backlog. They are the runtime acceptance portion of this workflow and are intentionally blocked until explicit user approval for external mutation and push.

