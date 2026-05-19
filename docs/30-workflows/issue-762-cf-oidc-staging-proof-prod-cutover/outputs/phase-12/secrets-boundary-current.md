# Current Secrets Boundary

```text
GitHub Environment Secret CLOUDFLARE_API_TOKEN
  -> web-cd deploy step env only
  -> scripts/cf.sh deploy
  -> Cloudflare Workers deploy
```

Current boundary is preserved. The token is not promoted to job-level env, build steps, or non-deploy steps.

Issue #762 adds only guardrails:

- claim pin dry-run verifier outside the deploy path,
- redaction detection for OIDC-shaped leaks,
- manual no-op observation workflow,
- documentation comments and requirements sync.

No secret value, account id, JWT, or claim value is recorded.
