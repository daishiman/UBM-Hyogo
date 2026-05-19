# web-cd Comment Diff Evidence

Expected:

- `.github/workflows/web-cd.yml` deploy behavior remains unchanged.
- `NOTE(issue-762)` appears exactly twice, once for staging and once for production.
- GitHub OIDC token permission is not added.

Verification commands:

```bash
grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml
grep -n "id-token" .github/workflows/web-cd.yml .github/workflows/oidc-observation-window.yml
git diff -- .github/workflows/web-cd.yml
```

Observed local result:

- `NOTE(issue-762)` count: 2.
- `id-token` matches in workflow files: 0.
- The only `web-cd.yml` change is comment insertion before the staging and production deploy steps.
