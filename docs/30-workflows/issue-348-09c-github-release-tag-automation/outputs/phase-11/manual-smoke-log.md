# Manual Smoke Log

## Dry-run

```bash
bash scripts/release/create-github-release.sh \
  --tag vYYYYMMDD-HHMM \
  --target <commit-sha> \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url https://github.com/daishiman/UBM-Hyogo/tree/<commit-sha>/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11 \
  --dry-run
```

Status: local script tests are run in this cycle; real tag/release smoke remains user-gated.

## Apply

Not executed in this cycle. Required approval phrase: `Phase 11 release apply を実行してよい`.
