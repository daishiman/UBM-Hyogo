# issue-55-notification-channel-and-optout — Workflow Entry

## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | `issue-55-notification-channel-and-optout` |
| 由来 Issue | [#55 [UT-07] 通知基盤設計と導入](https://github.com/daishiman/UBM-Hyogo/issues/55) |
| Issue state | `OPEN`（本ワークフローで残ギャップ2件をローカル実装済み。production/staging evidence は user-gated） |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION`（API + repository 層変更が主体だが、admin `MemberDrawer` に opt-out toggle UI を追加したため Phase 11 に local UI evidence を保存済み。staging/production runtime evidence は user-gated） |
| implementation_mode | `feature-extension`（既存 mail-only dispatcher を Channel 抽象 + opt-out gate で拡張） |
| 親 workflow | なし（独立 issue） |
| 元 unassigned-task spec | `docs/unassigned-task/UT-07-notification-infrastructure.md`（参照のみ） |
| 優先度 | 低（Wave 2+）だが本サイクル内で完了させる |
| 見積もり規模 | 小〜中 |
| PR base | `dev` |

## 実装区分

**[実装区分: 実装仕様書]**

判定根拠:
- Issue 完了条件のうち未充足は (a) `NotificationChannel` interface + Adapter 抽象化、(b) opt-out 遵守機構 の 2 項目。両方ともコード変更（型・migration・repository・dispatcher・route の追加修正）を必須とする。
- ドキュメントのみで Issue を closable にすることは不能（CONST_004 ラベルより実態優先）。
- 既存実装（`apps/api/src/services/notification/dispatcher.ts`, `apps/api/src/repository/notificationOutbox.ts`, `apps/api/src/workflows/notificationDispatchTick.ts`）は揃っているため、抽象化と gate 挿入だけで Issue を closable にできる。

## Issue #55 現状調査サマリ（2026-05-23 時点）

| 完了条件 | 現状 | 本ワークフロー対応 |
| --- | --- | --- |
| 通知チャネル設計ドキュメント | 一部存在（`specs/10-notification-auth.md`） | Phase 02 設計書 + Phase 12 で SSOT 更新 |
| `NotificationChannel` interface + 最低1 Adapter | ❌ `MailSender` 直依存 | Phase 05 で interface 抽出 + `MailNotificationChannel` adapter 実装 |
| D1 配信ログ + テスト通過 | ✅ `notification_outbox` + `notification_ledger` | 回帰のみ（既存 spec 維持） |
| Cron Trigger 動作確認 | ✅ `notificationDispatchTick` + crons 設定 | 回帰のみ |
| 重複送信防止 | ✅ outbox `duplicate` 判定 | 回帰のみ |
| オプトアウト遵守 | ❌ 未実装 | Phase 05 で `member_status.notification_opt_out` 列 + repository gate + admin toggle UI |
| API キーの Secret 経由注入 | ✅ Cloudflare Secrets パターン | 回帰のみ |

## 13 Phase 成果物一覧

| Phase | 区分 | 成果物 |
| --- | --- | --- |
| 01 | 要件整理 | `phase-01-requirements.md` |
| 02 | 設計 | `phase-02-design.md` |
| 03 | 設計レビュー | `phase-03-design-review.md` |
| 04 | テスト作成計画 | `phase-04-test-creation.md` |
| 05 | 実装計画 | `phase-05-implementation.md` |
| 06 | テスト拡張 | `phase-06-test-expansion.md` |
| 07 | カバレッジ確認 | `phase-07-coverage-check.md` |
| 08 | リファクタ | `phase-08-refactoring.md` |
| 09 | 品質保証 | `phase-09-quality-assurance.md` |
| 10 | 最終レビュー | `phase-10-final-review.md` |
| 11 | 手動テスト/Evidence | `phase-11-manual-test.md` |
| 12 | 実装ガイド | `phase-12-documentation.md` |
| 13 | PR 作成 | `phase-13-pr-creation.md` |

## スコープ（CONST_007: 1 サイクル完了原則）

本ワークフローは **後続の `03.実装.md` 1 サイクル内で完了**できる粒度に設計されている。先送り（バックログ送り）は行わない。

### 含むもの

- `NotificationChannel` interface（`apps/api/src/services/notification/channel.ts`、新規）
- `MailNotificationChannel` adapter（既存 `createMailDispatcher` を Channel I/F でラップする薄い実装）
- `apps/api/src/services/notification/registry.ts`（チャネル登録/解決。kind→channel 引き当て）
- `member_status.notification_opt_out` 列追加 + `notification_outbox.channel` 追加 + `notification_ledger.event_type` CHECK 拡張 migration（`apps/api/migrations/0020_notification_channel_and_opt_out.sql`、新規）
- `notification_outbox` への opt-out gate（enqueue 時点で skip + ledger `skipped_opt_out` event）
- admin 画面の opt-out toggle（`apps/web/src/features/admin/components/_members/MemberDrawer.tsx` へ checkbox 追加 + `PATCH /admin/members/:memberId/notification-pref` 経由）
- 既存 dispatcher / cron / outbox の回帰ゼロ
- 配信ログ確認テストの opt-out skip ケース拡張

### 含まないもの（明確な分離理由付き）

- LINE / Slack 等の追加 Adapter 実装本体: Channel interface と registry を用意した時点で「最低 1 チャネル」要件は mail 既存実装で満たされる。LINE Adapter は外部 API キー契約とオプトイン UI 整備が必要なため、別 issue とする（CONST_007 例外条件①: 外部依存待ち）。
- プッシュ通知 / SMS: Issue スコープ外と issue 自身に明記済。

## 主要参照

- `docs/00-getting-started-manual/specs/10-notification-auth.md`
- `apps/api/src/services/notification/dispatcher.ts`
- `apps/api/src/repository/notificationOutbox.ts`
- `apps/api/src/workflows/notificationDispatchTick.ts`
- `apps/api/migrations/0014_notification_outbox.sql`
- `apps/api/migrations/0002_admin_managed.sql`（`member_status` 正本）
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`
- `apps/web/src/lib/admin/api.ts`
