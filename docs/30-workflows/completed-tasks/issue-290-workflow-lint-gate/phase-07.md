# Phase 7: AC マトリクス

[実装区分: 実装仕様書]

## 受入条件マトリクス

| AC | 内容 | 検証手段 | 関連 Phase | 失敗ケース |
| --- | --- | --- | --- | --- |
| AC-1 | PR で `.github/workflows/*.yml` の全件が actionlint で検査される | T1 ローカル + T4 CI | Phase 2, 5 | F1, F2 |
| AC-2 | `actionlint` 未導入ローカル環境からの復旧手順が runbook 化されている | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` 存在確認 | Phase 5 | F7 |
| AC-3 | `yamllint` の採否（採用 / 不採用）と理由が記録されている | `outputs/phase-02/yamllint-decision.md` 存在確認 | Phase 2 | F6 |

## トレーサビリティ

| AC | 不変条件 | 親タスク |
| --- | --- | --- |
| AC-1 | UT-CICD-DRIFT topology drift 再発防止 | UT-CICD-DRIFT |
| AC-2 | Phase 11 で N/A だったローカル検証の正式手順化 | UT-CICD-DRIFT Phase 11 |
| AC-3 | Phase 11 / 12 review で示された yamllint 採否決定要求 | UT-CICD-DRIFT Phase 12 |

## 完了判定

3 AC すべてに対し検証手段が exit 0 / 存在確認できることをもって本タスクの DoD とする。
