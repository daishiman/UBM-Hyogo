# Phase 07 — カバレッジ確認

## 目標

`apps/api` の notification 系モジュール（`services/notification/**`, `repository/notificationOutbox.ts`, `workflows/notificationDispatchTick.ts`）について、本サイクル追加分は `statements / branches / functions / lines` いずれも 90% 以上を維持する。

## 実行コマンド

```bash
mise exec -- pnpm -F @ubm-hyogo/api test -- --run --coverage
mise exec -- pnpm -F @ubm-hyogo/web test -- --run --coverage
```

## 確認項目

| ファイル | 重点ブランチ |
| --- | --- |
| `services/notification/channel.ts` | 型定義のみのため coverage 対象外（istanbul ignore 不要） |
| `services/notification/channels/mail.ts` | retryable=true / false 両分岐 |
| `services/notification/registry.ts` | resolve hit / miss / kinds() |
| `repository/notificationOutbox.ts` | opt-out gate true / false, duplicate, db_error |
| `repository/memberNotificationPreference.ts` | load / update / missing member |
| `workflows/notificationDispatchTick.ts` | unknown_channel 経路の dlq 遷移 |
| `routes/admin/members.ts` | 200 / 400 / 401 / 403 |

## ガード

- 既存 `verify-coverage-exclude-ratio` CI gate に抵触しないこと
- 90% を下回るファイルがあれば Phase 06 に戻り spec を追加する

## DoD

- coverage レポートで全該当ファイルが閾値以上
- CI `coverage-guard` が pass（push 段階で確認）
