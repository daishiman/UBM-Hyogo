# Release Runbook

## Issue #348 GitHub Release Creation

| Item | Canonical |
| --- | --- |
| workflow root | `docs/30-workflows/issue-348-09c-github-release-tag-automation/` |
| implementation | `scripts/release/generate-release-notes.sh`, `scripts/release/create-github-release.sh`, `scripts/release/release-notes.template.md` |
| GitHub Actions | `.github/workflows/release-create.yml` |
| manual fallback | `docs/runbooks/release-create.md` |
| tag format | `vYYYYMMDD-HHMM` |
| source changelog | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md` |
| source evidence | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/` |
| status | `implemented-local / implementation / NON_VISUAL / Phase 11 release apply user-gated / Phase 13 blocked_pending_user_approval` |

## Mutation Boundary

`workflow_dispatch` renders release notes only and uploads a dry-run artifact. Tag push first renders release notes and then creates a draft GitHub Release using the reviewed notes file. Local `--apply` is forbidden without explicit user approval because draft releases are still GitHub mutations.

## Commands

```bash
bash scripts/release/create-github-release.sh \
  --tag vYYYYMMDD-HHMM \
  --target <commit-sha> \
  --changelog-path docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/documentation-changelog.md \
  --evidence-url https://github.com/daishiman/UBM-Hyogo/tree/<commit-sha>/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11 \
  --dry-run
```

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

## Lessons Learned (issue-348)

| 教訓 | 適用範囲 | 規範化 |
| --- | --- | --- |
| `workflow_dispatch` は dry-run only / tag push のみ draft mutation 許可 | GitHub Release を含む CI からの mutation 系すべて | dispatch 入力に `mode=apply` を許す場合は CI ガードで弾く。常に draft 経由・published は手動 |
| `--apply` は `--draft` 必須 + `--reviewed-notes-file` 必須 | リリース・デプロイ等の CI 起点 mutation スクリプト | dry-run 出力をレビューしないと apply できない設計を採用する |
| ローカルタグ存在 + tag commit == `--target` 一致を apply 前に検証 | tag push 駆動の mutation 全般 | `git rev-list -n 1 <tag>` で照合し不一致なら exit 64 |
| NON_VISUAL タスクの Phase 11 evidence は generic + task-specific の二層必須 | NON_VISUAL カテゴリの Phase 11 全タスク | `main.md` `manual-smoke-log.md` `link-checklist.md`（generic）+ task-specific evidence（dry-run-release-notes.md / lint-evidence.log 等） |
| Phase 12 strict filename を絶対に短縮しない | task-specification-creator Phase 12 全体 | `skill-feedback-report.md` `system-spec-update-summary.md` のフルネーム必須。短縮ドリフト時は Phase 12 NO-GO |
