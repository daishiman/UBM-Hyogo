# Phase 03 — 設計レビュー

## レビュー観点

| 観点 | 確認 | 結果 |
| --- | --- | --- |
| Issue #55 完了条件カバレッジ | 全 7 項目を Phase 01 表で本サイクル / 既存実装に割り付け済 | OK |
| 既存 `NotificationDispatcher` 後方互換 | `NotificationDispatcher = NotificationChannel` の type alias 化で旧 import 経路を維持 | OK |
| migration の安全性 | `member_status.notification_opt_out` と `notification_outbox.channel` は additive。`notification_ledger.event_type` は CHECK 拡張が必要なため rebuild migration として明記済み | OK |
| opt-out gate の挿入位置 | enqueue 直前に置くことで重複防止 (`duplicate` 判定) より早く skip し outbox 行を生成しない設計 | OK |
| admin endpoint の auth | `requireAdmin` 経由を必須化、CSRF は既存 admin mutation と同経路で吸収 | OK |
| CONST_007 1 サイクル原則 | 別 Adapter（LINE/Slack）を分離した分離理由が「外部依存待ち」で例外条件を満たす | OK |
| 不変条件 #5 (D1 は apps/api 限定) | opt-out 列読み書きは `apps/api/src/repository/member.ts` 経由のみ。`apps/web` からは API 越し | OK |
| 不変条件 #9 (admin form) | toggle UI は既存 `MemberDrawer` に追加し、既存 UI primitive / label / aria と `useAdminMutation` 経由に寄せる | OK |
| 不変条件 #10 (useAdminMutation) | mutation は `@/features/admin/hooks/useAdminMutation` 経由 | OK |

## 残課題

- なし。Phase 04 へ進行可。

## 承認

- レビュアー: Claude Code（solo dev）
- 日付: 2026-05-23
