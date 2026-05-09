# Phase 13: PR 準備

<!-- validator-required skeleton -->

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| 機能名 | issue-526-ci-actionlint-shellcheck-gate |
| 作成日 | 2026-05-08 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | CI workflow / shell lint gate |
| status | spec_created / user_approval_required |

## 目的

PR 準備として、Issue #526 の actionlint / shellcheck gate を実装済みローカル状態に同期する。

## 実行タスク

- [x] Phase 13 の責務を確認する。
- [x] `.github/workflows/ci.yml` 所有の lint gate と `post-release-observation-reminder.yml` lint 対象境界を維持する。
- [x] Phase 13 の成果物と完了条件を記録する。

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Index | `index.md` | タスク全体の正本 |
| Artifacts | `artifacts.json` | Phase status / references |
| Previous Phase | `phase-12.md` | 依存 Phase |
| CI workflow | `.github/workflows/ci.yml` | workflow-shell-lint 実装 |
| Reminder workflow | `.github/workflows/post-release-observation-reminder.yml` | actionlint 対象 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 13 specification | `phase-13.md` | PR 準備の記録 |

## 完了条件

- [x] 必須見出しが存在する。
- [x] CI lint gate の所有 workflow が `.github/workflows/ci.yml` に固定されている。
- [x] closed Issue #526 は reopen / close しない。

## 依存 Phase 明示

Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12

## 統合テスト連携

本タスクは CI workflow と shell lint gate の NON_VISUAL 実装であり、UI や D1 runtime を伴う統合テストは対象外。統合相当の確認は `pnpm observation:lint`、actionlint、shellcheck、shell unit、artifacts parity で代替する。

## Phase実行記録
`[実装区分: 実装仕様書]`

## ユーザー承認ゲート

本 Phase では commit / push / PR 作成を自動実行しない。ユーザーの明示承認後にのみ実行する。

## PR タイトル案

```text
ci: add actionlint and shellcheck gate for observation reminder
```

## PR 本文案

```markdown
## Summary

- add CI lint coverage for `.github/workflows/post-release-observation-reminder.yml`
- run shellcheck for `scripts/observation/*.sh`
- sync Issue #526 / #350 task specs and aiworkflow references

Refs #526, Refs #350

## Test plan

- bash -n scripts/observation/create-reminder-issue.sh
- bash scripts/observation/test/test-create-reminder-issue.sh
- shellcheck scripts/observation/*.sh scripts/observation/test/*.sh
- actionlint .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml
- unexpected="$(grep -RInE 'secrets\.[A-Z0-9_]+' .github/workflows/post-release-observation-reminder.yml | grep -v 'secrets.GITHUB_TOKEN' || true)"; test -z "$unexpected"
- pnpm run indexes:rebuild
```

## 実行コマンド

```bash
git status --short
git diff --stat
git add .github/workflows/ci.yml .github/workflows/post-release-observation-reminder.yml scripts/observation/create-reminder-issue.sh package.json docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate docs/30-workflows/completed-tasks/ut-350-fu-01-ci-actionlint-shellcheck-gate.md .claude/skills/aiworkflow-requirements
git commit -m "ci: add observation reminder lint gate"
git push
gh pr create --draft --title "ci: add actionlint and shellcheck gate for observation reminder" --body-file /tmp/pr-body.md
```

## DoD

- commit / push / PR 作成はユーザー承認後に実行される。
- PR body に `Refs #526, Refs #350` が含まれる。
- CI run の lint job 成否を Phase 11 evidence に追記できる。
