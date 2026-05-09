# Phase 9: 品質保証（schema / redaction）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 9 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

evidence の schema 適合性、redaction（token / secret 漏洩なし）、read-only 制約遵守を検証する。

## verification

### Q-1: JSON array 適合性

```bash
for f in outputs/phase-11/gh-run-list-cf-audit-log-monitor.json \
         outputs/phase-11/gh-run-list-watchdog.json \
         outputs/phase-11/gh-issues-cf-audit.json \
         outputs/phase-11/tuning-cost-issues.json ; do
  T=$(jq 'type' "$f")
  echo "$f -> $T"
  test "$T" = '"array"' || echo "FAIL: $f"
done
```

### Q-2: redaction-check

`outputs/phase-11/redaction-check.md` に以下を記録:

- 検査対象: `outputs/phase-11/*.json`, `*.md`
- 検査パターン: `(?i)(api[-_]?token|secret|password|bearer\s+[A-Za-z0-9._-]+|op://[^ ]+)` のいずれもヒット 0 件
- `gh api` の `Authorization` header / cookie 残骸がないこと

```bash
grep -RIE -i 'api[-_]?token|secret|password|bearer |op://' outputs/phase-11/ \
  > /tmp/redaction-grep.log
wc -l /tmp/redaction-grep.log  # 期待: 0
```

### Q-3: read-only 制約

`scripts/cf.sh d1 execute` の実行ログに `INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|MERGE|REPLACE` が含まれないことを grep 検証。

### Q-4: link checklist

`outputs/phase-11/link-checklist.md` に以下のリンク有効性を記録:

- Issue #581 / #546 / #515 URL
- `task-workflow-active` 該当行
- aiworkflow-requirements references

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/redaction-check.md` | leak: 0 を明記 |
| `outputs/phase-11/link-checklist.md` | link 有効性記録 |
| `outputs/phase-11/manual-smoke-log.md` | コマンド実行ログ |

## 完了条件

- [ ] Q-1〜Q-4 全件 PASS
- [ ] redaction-check.md に `leak: 0` が記載されている
- [ ] read-only 制約違反 0 件

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-09.md`
