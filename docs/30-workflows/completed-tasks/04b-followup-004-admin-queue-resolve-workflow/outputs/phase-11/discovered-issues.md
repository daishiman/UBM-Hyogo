# Phase 11 — Discovered Issues

| # | severity | summary | follow-up |
|---|----------|---------|-----------|
| 1 | info | `AuditTargetType` enum に `admin_member_note` がないため `targetType: "member"` に丸めて `payload.noteId` で原典を残している | 将来 audit schema 拡張時に `admin_member_note` を追加検討 |
| 2 | info | pending 件数の sidebar バッジ未実装 | 別タスク化（要件次第） |
| 3 | info | D1 fault injection（途中失敗で rollback）は miniflare で再現困難。サブクエリガード設計でカバー | staging で実 D1 fault test を実施するなら別タスク |

blocker: 0
