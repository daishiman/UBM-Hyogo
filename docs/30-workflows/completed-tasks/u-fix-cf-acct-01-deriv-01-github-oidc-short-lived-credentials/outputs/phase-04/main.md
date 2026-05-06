# Phase 4 Output: テスト戦略

## Status

SPEC_CREATED

## Test Strategy

NON_VISUAL evidence is required. Runtime execution is blocked until user approval because the task changes GitHub Actions deploy credentials and Cloudflare token state.

| Layer | Evidence |
| --- | --- |
| static | grep for remaining `secrets.CLOUDFLARE_API_TOKEN` in deploy workflows |
| workflow | successful OIDC deploy runs for staging and production |
| credential | token verify, lifetime <= 3600 seconds, minimum 4 scope check |
| security | fork PR isolation, `pull_request_target` exclusion, secret hygiene zero match |
| operations | 24h parallel run, old token revoke, rollback dry-run |

