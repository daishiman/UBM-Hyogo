[実装区分: 実装仕様書]

# Phase 8: NON_VISUAL governance — task-03b-followup-006-per-sync-cap-alert

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |

## 目的

この Phase の責務を、per-sync cap alert 仕様の実装承認前に検証可能な粒度へ固定する。

## 実行タスク

- 本 Phase の契約、境界、成果物を確認する。
- 後続 Phase が参照する前提を明文化する。
- user 承認が必要な実装、commit、push、PR、deploy を実行しない。

## 参照資料

- index.md
- artifacts.json
- phase-07.md

## 成果物

- phase-08.md

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## visualEvidence 区分

NON_VISUAL（cron job / observability binding 追加。UI 変更なし）

## Phase 8 single-source YAML

`outputs/phase-08/governance.yaml` に以下を生成する想定:

```yaml
task_id: TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT
visualEvidence: NON_VISUAL
taskType: implementation
governance:
  approval_gate:
    - implement: requires_user_explicit_instruction
    - commit: requires_user_explicit_instruction
    - push: requires_user_explicit_instruction
    - pr: requires_user_explicit_instruction
    - cloudflare_deploy: requires_user_explicit_instruction
  evidence:
    - phase-07/typecheck.log
    - phase-07/lint.log
    - phase-07/test.log
    - phase-11/grep-writeCapHit.log
    - phase-11/sql-recent-jobs.log
    - phase-11/wrangler-config-grep.log
    - phase-11/staging-dry-run.log
    - phase-11/redaction-check.log
  required_status_checks:
    - typecheck
    - lint
    - apps/api unit tests
```

## ガード（不変条件と整合）

- D1 直接アクセスは apps/api 限定（不変条件 #5）
- 平文 .env 禁止 / wrangler 直接実行禁止
- `bash scripts/cf.sh` 経由のみで Cloudflare 操作

## 完了条件

- governance.yaml が phase-08 outputs に保存可能な粒度で確定
- 承認ゲート 5 つ（implement / commit / push / pr / deploy）が明示
