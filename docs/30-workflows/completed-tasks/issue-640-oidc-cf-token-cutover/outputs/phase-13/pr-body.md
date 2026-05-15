# PR Body Draft

## Summary

- Step-scope Cloudflare deploy credentials in `web-cd.yml`.
- Step-scope analytics Cloudflare credentials in `post-release-dashboard.yml`.
- Add static workflow scope and redaction helper tests.
- Sync Issue #640 workflow docs and aiworkflow-requirements references.

Refs #640, #331

## Verification

- `bash scripts/__tests__/redaction-check.test.sh`
- `bash scripts/__tests__/workflow-env-scope.test.sh`
- `pnpm test:workflow-secrets`
- `git status --short`
- `git diff --stat`
