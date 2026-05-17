# Regression Negative Case

The negative case was verified without modifying the working tree.

Method:

1. Copy `.github/workflows/backend-ci.yml` to a temporary file.
2. Replace one scoped token reference in the temporary copy with `CLOUDFLARE_API_TOKEN`.
3. Run the same regex used by `workflow-env-scope.test.sh` against the temporary file.

Result:

```text
legacy apiToken reference detected in temporary backend-ci copy
exit=0 for detector command
```

The production file was not edited or reverted during this check.
