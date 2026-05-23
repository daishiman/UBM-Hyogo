# ut-cicd-composite-setup-rollout sync

Date: 2026-05-22

## Summary

`ut-cicd-composite-setup-rollout` was synchronized as `implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr`.

## Changes

- Migrated 13 workflow files from direct `actions/setup-node@v4` / `pnpm/action-setup@v4` steps to `.github/actions/setup-project`.
- Preserved `web-cd.yml` mise semantics with `setup-strategy: mise`.
- Preserved `post-release-dashboard.yml` no-install behavior with `install: 'false'` and `cache: ''`.
- Added workflow root Phase 11 evidence and Phase 12 strict 7 outputs.
- Updated quick-reference, resource-map, task-workflow-active, and SKILL-changelog.

## Boundary

Commit, push, PR creation, remote GitHub Actions green evidence, and Issue #284 mutation are user-gated.

