# Phase 01 — 要件整理

## 目的
Issue #55 (UT-07) のうち、現行コードベースで未充足の 2 ギャップ（Channel 抽象化 / opt-out 遵守）を本ワークフロー 1 サイクルでクローズ可能にする要件を確定する。

## 入力
- GitHub Issue #55 本文
- `docs/unassigned-task/UT-07-notification-infrastructure.md`（存在すれば参照）
- 現行コード: `apps/api/src/services/notification/`, `apps/api/src/repository/notificationOutbox.ts`, `apps/api/src/workflows/notificationDispatchTick.ts`, `apps/api/migrations/0014_notification_outbox.sql`

## 機能要件 FR

| ID | 要件 | 受入条件 |
| --- | --- | --- |
| FR-01 | `NotificationChannel` interface を導入し、既存 mail dispatcher を adapter としてラップする | `apps/api/src/services/notification/channel.ts` に `NotificationChannel` interface が存在し、`MailNotificationChannel` が `implements NotificationChannel` で実装されている |
| FR-02 | チャネル登録/解決 registry を導入し、`notification_outbox.channel`（既定: `mail`）から実体を引き当てる | `registry.resolve('mail')` が `MailNotificationChannel` を返す。未知 kind は provider 呼び出しなしで `unknown_channel` を ledger に記録し DLQ 化 |
| FR-03 | `member_status.notification_opt_out`（INTEGER 0/1, default 0）を新設し、true のメンバーへの outbox enqueue を skip する | enqueue 経路（`enqueueNotification`）で skip され、`notification_ledger` に `event_type='skipped_opt_out'` が記録される |
| FR-04 | admin 画面でメンバーの opt-out フラグを切り替えできる | `PATCH /admin/members/:memberId/notification-pref` で更新可能。admin members の `MemberDrawer` に checkbox UI が存在 |
| FR-05 | 既存の重複送信防止 / cron 配信 / 配信ログ / Secret 注入の挙動を維持する | 既存 spec test が全件 green |

## 非機能要件 NFR

| ID | 要件 |
| --- | --- |
| NFR-01 | 既存 spec 回帰ゼロ。`pnpm -F @ubm-hyogo/api test` 既存ケース全 pass |
| NFR-02 | migration は forward-only。次の空き番号 `0020_notification_channel_and_opt_out.sql` で `member_status.notification_opt_out`、`notification_outbox.channel`、ledger CHECK 拡張を同時に適用する |
| NFR-03 | 型安全。`NotificationChannel.kind` は string literal union（`'mail'` から開始） |
| NFR-04 | admin endpoint は既存 admin auth gate を経由する（`requireAdmin` middleware） |

## スコープ外

- 別チャネル（LINE / Slack）の Adapter 実装本体
- 通知テンプレートエディタ
- メンバー自身による self-service opt-out（マイページ側）。本サイクルは admin operate-only。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| 既存 `notification_outbox` 行が channel 列なしで存在しているため、dispatcher が row.channel を読めない | migration で `notification_outbox.channel TEXT NOT NULL DEFAULT 'mail'` を追加し、既存行も default で `mail` として扱う |
| 現行 `notification_ledger.event_type` CHECK が `skipped_opt_out` / `unknown_channel` を拒否する | 同 migration で ledger table を rebuild し、CHECK enum を拡張する。単なる INSERT 追加ではなく schema constraint 更新を必須にする |
| opt-out 列追加時に既存テスト fixture が失敗する | `__fixtures__/` の seed を更新し default `0` を明示。`tests/repository/__tests__/_setup.ts` で schema 再生成済かを確認 |

## DoD（Phase 01 完了条件）

- FR / NFR が確定し、後続 Phase 02 設計がこの表を SSOT として参照できる
- スコープ外項目に対する Issue 分離方針が `index.md` と整合している
