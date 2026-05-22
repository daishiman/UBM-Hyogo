# 2026-05-08 - Issue #526 CI actionlint / shellcheck gate

## 概要

Issue #526 / #350 の post-release observation reminder に対し、main へ入る前の CI lint gate を実装済みローカル状態として同期した。

## 同期内容

- `.github/workflows/ci.yml` に `workflow-shell-lint` job を追加。
- 既存 branch protection required context `ci` 内にも `pnpm observation:lint` を追加し、dedicated job が required context 未登録でも PR merge gate として機能するようにした。
- `package.json` に shellcheck + actionlint 対応の `observation:lint` script を追加。
- `scripts/observation/test/test-create-reminder-issue.sh` の fake `gh` 生成を heredoc 化し、test script も shellcheck 対象に含めた。
- `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` を `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として同期。
- `docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md` に consumed trace を追記。
- `references/post-release-long-term-observation.md` と `references/deployment-gha.md` に current facts を追記。
- `references/workflow-issue-526-ci-actionlint-shellcheck-gate-artifact-inventory.md` と `references/lessons-learned-issue-526-ci-actionlint-shellcheck-gate-2026-05.md` を追加し、artifact inventory と苦戦箇所を正本導線化。

## 境界

- `.github/workflows/post-release-observation-reminder.yml` の schedule / workflow_dispatch / Issue 作成副作用は変更しない。
- GitHub Actions runtime evidence、branch protection required context PUT、commit、push、PR は user approval 後に実行する。
