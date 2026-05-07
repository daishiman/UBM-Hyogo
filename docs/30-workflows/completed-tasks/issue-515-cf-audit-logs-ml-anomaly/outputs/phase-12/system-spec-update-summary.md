# System Spec Update Summary

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-515-cf-audit-logs-ml-anomaly |
| 判定 | same-wave sync completed |

## 更新対象

| ファイル | 更新内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Issue #515 classifier abstraction / redacted feature / offline replay / Gate decision を追記 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` / `CF_AUDIT_REDACT_SECRET` の取り扱いを追記 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | ML classifier rollback runbook を追記 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | canonical task path を追記 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` | canonical task path を追記 |

## Step 2 判定

**判定: 必要**

理由:

- `Classifier` interface、redacted feature schema、offline replay I/O、D1 classifier metadata columns を追加した。
- Cloudflare audit log monitoring の運用仕様と secrets/env 仕様に影響する。
- production ML switch は外部依存 Gate 後に分離し、今回の正本は ML-ready abstraction と rollback 境界に限定する。

