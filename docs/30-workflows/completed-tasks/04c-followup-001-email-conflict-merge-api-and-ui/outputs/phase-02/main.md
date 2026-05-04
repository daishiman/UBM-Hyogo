# Phase 2 Output: 設計

[実装区分: docs-only / canonical alias]

## 設計判断

新規 D1 table / endpoint / UI path は本 root では定義しない。正本は issue-194 の実装済み contract とする。

| 項目 | 正本 |
| --- | --- |
| endpoints | `GET /admin/identity-conflicts`, `POST /admin/identity-conflicts/:id/merge`, `POST /admin/identity-conflicts/:id/dismiss` |
| tables | `identity_merge_audit`, `identity_aliases`, `identity_conflict_dismissals`, `audit_log` |
| merge | canonical alias 記録。raw response 本文は移動しない |
