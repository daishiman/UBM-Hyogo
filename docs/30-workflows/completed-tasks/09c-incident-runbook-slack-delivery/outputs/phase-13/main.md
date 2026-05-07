# Phase 13 サマリ — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

## 状態

- 仕様書 close-out 時点: PR 作成手順整備済（**未発火**）
- user 明示指示後: spec PR 作成 → CI gate green → merge

## PR 種別

本タスクは spec promotion + local implementation 単一 PR。runtime Slack delivery 実行だけを別 approval wave に分離する。

## branch / title

- branch: `docs/issue-349-incident-runbook-slack-delivery-task-spec`（既存。新規作成しない）
- title: `docs(09c-incident-runbook-slack-delivery): Phase 1-13 spec + secret 正本追記`（65 文字、70 字以内）

## 含めるファイル（`git diff main...HEAD --name-only` 想定）

- `docs/30-workflows/09c-incident-runbook-slack-delivery/phase-{01..13}.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/index.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/artifacts.json`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-{01..13}/main.md`
- `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/LOGS.md`
- `.claude/skills/task-specification-creator/LOGS.md`
- `.claude/skills/aiworkflow-requirements/indexes/`（再生成 drift があれば）
- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md`（share-evidence 置換）
- `docs/30-workflows/unassigned-task/task-09c-incident-runbook-slack-delivery-001.md`（Canonical Status `consumed` 化）
- `.github/workflows/incident-runbook-slack-delivery.yml`
- `scripts/notify/slack-incident-runbook.{ts,sh}` / `slack-incident-runbook.template.json` / `save-slack-evidence.ts` / 単体テスト

## runtime scope 外（別 approval wave）

- 実 Slack dry-run / production 投稿
- GitHub Secrets / Variables / Environments の実作成・変更
- production delivery approval と evidence commit

## CI gate

- typecheck / lint / verify-indexes-up-to-date / verify-codeowners がすべて green

## レビュー観点（L1〜L8、`phase-13.md` §7 参照）

- secret hygiene / CONST 遵守 / aiworkflow indexes drift 0 / 三併存ケース整合 / CLOSED issue 参照（Refs のみ）/ scope 整合 / 09c share-evidence 置換適用 / Phase 12 strict 7 outputs

## post-merge action（P1〜P5、`phase-13.md` §9 参照）

- P1: Issue #349 へ PR link comment（`gh issue comment 349`）
- P2: Issue #349 を**再 open しない**（CLOSED 維持、UBM-029）
- P3: aiworkflow indexes が main で green
- P4: runtime evidence approval wave 準備
- P5: PR URL / merge SHA を本ファイルに追記

## NON_VISUAL のため

- Visual Evidence セクション不在（PR description / 本ファイルとも）
- `outputs/phase-11/screenshots/` 不在

## 完了条件

- [ ] PR タイトル / 本文 / `gh pr create` コマンド / CI gate 方針が文書化されている
- [ ] 本 Phase で `gh pr create` / `git push` を実行していない（CONST_002）
- [ ] post-merge action P1〜P5 が記録されている
- [ ] 三併存ケース整合（UBM-018） / CLOSED Issue 参照（UBM-029）が明記されている

## 参照

- `phase-13.md`（実体仕様）
- `.claude/commands/ai/diff-to-pr.md`
- `CLAUDE.md`「PR作成の完全自律フロー」
