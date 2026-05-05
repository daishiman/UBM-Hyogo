# 2026-05-04 UT-07B-FU-05 D1 runbook reverse index sync

## 変更概要

- `docs/30-workflows/completed-tasks/ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index/` を `completed_pending_pr / implementation / NON_VISUAL` として close-out。
- `indexes/resource-map.md` に UT-07B-FU-03 production migration apply runbook stub、`scripts/d1/*.sh`、`.github/workflows/d1-migration-verify.yml`、`scripts/cf.sh` への逆引き行を補正。
- `indexes/quick-reference.md` に `bash scripts/cf.sh d1:apply-prod` の即時導線を追加。
- Phase 11/12 outputs に grep / indexes rebuild / same-wave sync evidence を配置。
- production D1 apply、commit、push、PR は未実行で、Phase 13 user gate を維持。

## 検証

- `rg "d1-migration-verify|scripts/d1|d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes`
- `mise exec -- pnpm indexes:rebuild`
- `git diff --stat`
