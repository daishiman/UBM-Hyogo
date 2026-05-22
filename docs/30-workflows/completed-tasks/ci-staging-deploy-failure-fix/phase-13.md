# Phase 13: User approval gate

## Status

blocked_pending_user_approval.

## Prohibited until explicit approval

- `git commit`
- `git push`
- `gh pr create`
- Cloudflare API token creation / rotation
- 1Password token mutation
- `gh secret set CLOUDFLARE_API_TOKEN --env staging`
- `gh secret set CLOUDFLARE_API_TOKEN --env production`
- dev push runtime CI verification

## PR notes when approved

Use `Refs` wording only for already closed issues. Do not use `Closes`, `Fixes`, or `Resolves` unless the target issue is intentionally being closed by that PR.

