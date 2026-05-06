# Phase 13: PR 作成 — issue-407-cf-token-rotation-90day-runbook-automation

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-407-cf-token-rotation-90day-runbook-automation |
| phase | 13 / 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | blocked_until_user_approval |

## 目的

Phase 1-12 と実成果物を PR 化する前に、承認ゲートを分離して記録する。Codex はユーザーの明示指示なしに commit / push / PR 作成を実行しない。

## 承認ゲート

| Gate | 対象 | 実行条件 |
| --- | --- | --- |
| G1 | runtime dry-run evidence | user が workflow_dispatch 実行を明示承認 |
| G2 | production rotation | user が runbook の production step 実行を明示承認 |
| G3 | commit / push | user が git 操作を明示承認 |
| G4 | PR 作成 | user が `gh pr create` を明示承認 |

合算承認は禁止。各 gate は別々に承認を取る。

## PR 本文スケルトン

```markdown
## Summary
- Add Cloudflare API token 90 day rotation runbook and append-only log.
- Add reminder workflow that opens an issue after 85 elapsed days.
- Add local checker for runbook, log, yaml links, elapsed-day logic, and secret hygiene.

## Verification
- bash scripts/check-cf-rotation-reminder.sh --check-runbook-sections
- bash scripts/check-cf-rotation-reminder.sh --check-log-fields
- bash scripts/check-cf-rotation-reminder.sh --check-yaml-links
- ISSUED_AT=<date> bash scripts/check-cf-rotation-reminder.sh --simulate-elapsed
- bash scripts/check-cf-rotation-reminder.sh --check-no-secret
- bash scripts/check-cf-rotation-reminder.sh --check-no-token-id
- bash scripts/check-cf-rotation-reminder.sh --check-no-scope-values

Refs #407
```

## 実行タスク

- [ ] G3 承認後に commit 対象差分を確認する
- [ ] G3 承認後に commit / push を実行する
- [ ] G4 承認後に `gh pr create` を実行する
- [ ] PR 本文に `Refs #407` を使用し、`Closes #407` を使わない

## 参照資料

- `phase-12.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/30-workflows/operations/cf-token-rotation-runbook.md`
- `.github/workflows/cf-token-rotation-reminder.yml`

## 成果物/実行手順

1. `git status --short` と `git diff --stat` で issue-407 差分だけを確認する。
2. user approval gate G3 を取得する。
3. commit / push を実行する。
4. user approval gate G4 を取得する。
5. PR を draft として作成し、本文に検証結果と `Refs #407` を記載する。

## 完了条件

- [ ] Phase 12 strict outputs が PASS
- [ ] `git diff --stat` を提示済
- [ ] user が G3/G4 を明示承認
- [ ] `Refs #407` を使い、CLOSED Issue を reopen しない
