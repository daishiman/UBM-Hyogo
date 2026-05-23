# Skill Feedback Report

## テンプレ改善

No task-specification-creator template change is required. Existing Phase 12 strict 7 and implementation evidence path rules cover this case.

## ワークフロー改善

The initial spec undercounted raw setup usage because `ci.yml` had a remaining coverage shard even though the workflow also had existing composite callers. The elegant correction is to define the AC as "zero direct `@v4` setup steps in `.github/workflows/`" and include any detected residual shard in the same wave.

## ドキュメント改善

The workflow docs were updated from spec-only language to local implementation captured language, including `web-cd.yml` mise preservation and `post-release-dashboard.yml` install-skip preservation.

