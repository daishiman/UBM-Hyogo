# Phase 4 Output: Verify Suite

## Test Layers

| Layer | Target | Evidence |
| --- | --- | --- |
| Deployment | GitHub Actions and Cloudflare staging URLs | action log and HTTP checks |
| Sync | schema/response sync endpoints | curl result and `sync_jobs` dump |
| UI | public, login, profile, admin routes | screenshots and Playwright report |
| Authorization | `/me`, `/admin/dashboard`, admin UI | 401/403/200 matrix |
| Guardrail | free-tier, secrets, D1 import boundary | command output and checklist |

## Outputs

- [verify-suite.md](verify-suite.md)
