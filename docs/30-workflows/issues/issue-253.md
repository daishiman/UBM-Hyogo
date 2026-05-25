# [#253] [05a-followup-003] Admin 剥奪即時反映の設計・実装

## メタ情報

```yaml
issue_number: 253
title: [05a-followup-003] Admin 剥奪即時反映の設計・実装
state: OPEN
priority: 中
scale: 中規模
category: 改善
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/253
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 中規模 |
| ステータス | 未実施 |

---

## 概要

05a MVP では `isAdmin` を session JWT に含めるため、`admin_users.active=0` にしても既存 JWT 期限（24h）までは admin 操作が通る可能性がある（既知制約 B-01）。Phase 10/12 では条件付き GO として許容したが、運用要件が厳しくなる場合は即時反映設計が必要。

## 仕様書

`docs/30-workflows/unassigned-task/05a-followup-003-admin-revoke-immediate-effect.md`

## スコープ

- admin 剥奪即時反映方式の設計（D1 lookup / session version / revocation list 比較）
- `requireAdmin` または session invalidation の実装
- contract test / race condition test
- D1 lookup 回数と latency 計測

## 含まない

- Google OAuth provider の変更
- admin CRUD UI の新規作成

## 関連

- 既知制約 B-01（MVP 許容、本タスクで解消）
- `apps/api/src/middleware/require-admin.ts`
