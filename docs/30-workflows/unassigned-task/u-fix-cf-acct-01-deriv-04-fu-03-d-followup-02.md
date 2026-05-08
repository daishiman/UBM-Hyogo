# CF audit ML model artifact rotation

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| 親 | `docs/30-workflows/issue-549-cf-audit-ml-production-switch/` |

## 1. なぜこのタスクが必要か（Why）

model artifact は env 切替より寿命が長く、次世代 model 投入時に canary、rollback、secret redaction を再確認する必要がある。

## 2. 何を達成するか（What）

artifact rotation runbook、canary evidence、rollback 更新、leakage grep evidence を揃える。

## 3. どのように実行するか（How）

`ML_MODEL_PATH` の op 参照を使い、解決値を保存せずに dry-run と staging canary を実行する。

## 4. 実行手順

1. candidate artifact を staging で load する。
2. offline replay と leakage grep を実行する。
3. production path 更新 PR と rollback 手順を作成する。

## 5. 完了条件チェックリスト

- [ ] artifact load dry-run が成功。
- [ ] leakage grep が clean。
- [ ] rollback path が更新済み。

## 6. 検証方法

dry-run log、fallback rate sample、secret leakage grep を確認する。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 不適合 artifact | staging canary と offline replay を必須化 |

## 8. 参照情報

- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`

## 9. 備考

raw feature dataset は保存しない。
