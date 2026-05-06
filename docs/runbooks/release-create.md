# GitHub Release 作成 Runbook

## 境界

この runbook は 09c release tag から GitHub Release を作成する手順だけを扱う。production deploy、D1 migration、tag push、rollback 実行は 09c production execution 側の user gate に従う。

## Dry-run

```bash
bash scripts/release/create-github-release.sh \
  --tag vYYYYMMDD-HHMM \
  --target <commit-sha> \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url https://github.com/daishiman/UBM-Hyogo/tree/<commit-sha>/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11 \
  --dry-run
```

## Apply

Apply は GitHub 上に release を作成する mutation である。実行前に tag、commit、Phase 11 evidence、Phase 12 changelog を確認する。

```bash
bash scripts/release/create-github-release.sh \
  --tag vYYYYMMDD-HHMM \
  --target <commit-sha> \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url https://github.com/daishiman/UBM-Hyogo/tree/<commit-sha>/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11 \
  --dry-run \
  > /tmp/release-notes-reviewed.md

bash scripts/release/create-github-release.sh \
  --tag vYYYYMMDD-HHMM \
  --target <commit-sha> \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url https://github.com/daishiman/UBM-Hyogo/tree/<commit-sha>/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11 \
  --apply \
  --draft \
  --reviewed-notes-file /tmp/release-notes-reviewed.md
```

## GitHub Actions

`.github/workflows/release-create.yml` は tag push で draft release を作成する。`workflow_dispatch` は dry-run artifact 生成だけに限定し、手動 dispatch から release mutation は実行しない。
