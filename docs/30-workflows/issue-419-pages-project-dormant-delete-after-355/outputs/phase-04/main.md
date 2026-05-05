# Phase 04 Output

state: pending

## 概要

destructive ops + NON_VISUAL のため自動テスト最小構成。redaction grep / typecheck / lint を CI 相当 gate として運用し、実 Pages 削除と観察期間運用は user 承認後の runtime cycle で実施する。

## テスト一覧（Phase 04 段階で確定）

| ID | 種別 | 対象 | 期待値 | 実行 phase |
| --- | --- | --- | --- | --- |
| T-01 | dry-run | `bash scripts/cf.sh pages project list` | exit 0 | Phase 11 (runtime) |
| T-02 | dry-run | `bash scripts/cf.sh api-get /client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects` | active domain 0 | Phase 11 (runtime) |
| T-03 | gate | redaction grep | 0 件 | Phase 11 / Phase 09 |
| T-04 | gate | `mise exec -- pnpm typecheck` | 0 errors | Phase 09 |
| T-05 | gate | `mise exec -- pnpm lint` | 0 errors | Phase 09 |
| T-06 | runtime | `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` | exit 0 | Phase 11（user 承認後） |
| T-07 | runtime | 削除後 Workers production smoke | 200 OK | Phase 11 |
| T-08 | runtime | observation log 整合 | append-only / 最低 2 週間 | Phase 11 |

## redaction grep（正本コマンド）

```bash
rg -i "(token|bearer|sink|secret|CLOUDFLARE_API_TOKEN|Authorization)" \
  docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/
```

## DoD（全体）

- redaction grep 0 件
- 削除コマンド exit code = 0
- 削除後 Workers production smoke 200 OK
- dormant 観察期間ログが最低 2 週間分揃う
- user 明示承認が二重記録されている
- aiworkflow-requirements references の Pages 言及が「削除済み（YYYY-MM-DD）」へ更新

## 残課題

- T-06〜T-08 は Phase 11 (runtime) で実施。本仕様書サイクルでは未実行。

## 実行記録

- 実行者: -
- 実行日時: -
- 結果: pending
