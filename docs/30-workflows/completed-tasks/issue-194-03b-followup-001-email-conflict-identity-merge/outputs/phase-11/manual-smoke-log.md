# Manual Smoke Log

## 実装区分

[実装区分: 実装仕様書]

## Current State

- State: `PENDING_RUNTIME_EVIDENCE`
- Execution date: not executed (spec 段階)
- Runtime gate: implementation execution + 明示的 user approval

## Runtime Checklist（テンプレート）

| Check | Expected | Actual | PASS/FAIL |
| --- | --- | --- | --- |
| `GET /admin/identity-conflicts` | 200 + masked email | | |
| `POST /admin/identity-conflicts/:id/merge` | 200 + atomic merge | | |
| non-admin access | 403 | | |
| missing reason | 400 (`BAD_REQUEST`) | | |
| self-reference merge | 400 (`SELF_REFERENCE`) | | |
| 既統合 conflict 再 merge | 409 (`MergeConflictAlreadyApplied`) | | |
| duplicate dismiss | 200 (upsert: reason / dismissed_by / dismissed_at 更新) | | |
| audit insert | `identity_merge_audit` + `audit_log` 両方 | | |
| `identity_aliases` insert | source→target row 永続化 | | |
| PII 目視 | screenshot 内に full responseEmail 無し | | |

## 境界

curl / browser / deploy / D1 migration / commit / push / PR は spec 段階で実行しない。
