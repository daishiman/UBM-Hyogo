# Manual Smoke Log

## Local Smoke

```text
PASS: cf.sh skips with-env when CLOUDFLARE_API_TOKEN is already set
YAML OK .github/workflows/backend-ci.yml
YAML OK .github/workflows/web-cd.yml
```

## Runtime Smoke

Runtime smoke is pending user operation. Do not mark token issuance, GitHub Secrets mutation, staging 7 day green, production deploy, or old token revocation as PASS until fresh evidence files are captured.
