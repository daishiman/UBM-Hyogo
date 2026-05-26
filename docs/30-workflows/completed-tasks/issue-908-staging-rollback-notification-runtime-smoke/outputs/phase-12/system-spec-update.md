# System Spec Update — issue-908-staging-rollback-notification-runtime-smoke

## 該当範囲

| Spec | Path | 変更 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/*` | — | 該当なし（API surface 変更なし） |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | — | 該当なし |
| `docs/00-getting-started-manual/specs/08-free-database.md` | — | 該当なし（schema 変更なし） |
| ops runbook | `docs/30-workflows/runbooks/` | 該当なし（新規 runbook 追加は本タスクスコープ外。helper script 自体が再現性を担保） |

## 結論

本タスクは runtime evidence 取得 + helper script 追加のみであり、system spec / API contract / DB schema いずれも変更しない。spec update 不要。
