# CF audit ML model artifact rotation

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| 親 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |

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

### 単体検証

```bash
test -f docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/model-artifact-rotation-dry-run.md
rg -n "ML_MODEL_PATH|rollback|leakage grep" \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/model-artifact-rotation-dry-run.md
```

期待: op 参照名、rollback path、leakage grep 結果が redacted evidence として存在する。

### 統合検証

```bash
rg -n "CF_AUDIT_ML_MODEL_PATH_PROD|model artifact|rollback" \
  .claude/skills/aiworkflow-requirements/references/observability-monitoring.md \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
```

期待: artifact rotation の SSOT と secret 正本が矛盾しない。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| 不適合 artifact | staging canary と offline replay を必須化 |
| secret 解決値の漏洩 | evidence は op 参照名のみを保存し、解決値を保存しない |

## 8. スコープ

### 含む

- ML model artifact rotation runbook。
- staging canary / offline replay / leakage grep evidence。
- rollback path 更新と SSOT 同期。

### 含まない

- production switch 本体。
- raw feature dataset 保存。
- Slack / mail 通知拡張（followup-03）。

## 9. 苦戦箇所【記入必須】

- 対象: `ML_MODEL_PATH` と model artifact evidence。
- 症状: op 参照名と解決値を混同すると secret が evidence に残る。
- 対策: dry-run log / leakage grep / SSOT では op 参照名のみを扱う。

## 10. 参照情報

- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`

## 11. 備考

raw feature dataset は保存しない。
