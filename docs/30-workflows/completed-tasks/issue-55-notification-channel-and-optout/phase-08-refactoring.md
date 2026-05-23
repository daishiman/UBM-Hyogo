# Phase 08 — リファクタリング

## 対象

実装後、以下の観点で最小差分のリファクタを行う（機能変更を含めない）。

| 観点 | 内容 |
| --- | --- |
| 重複排除 | `dispatcher.ts` の `createMailDispatcher` と `channels/mail.ts` で重複が出た場合は前者を後者から再エクスポートして 1 経路に統合 |
| 命名 | `NotificationChannelKind` の string literal 集合は `channel.ts` のみが定義する SSOT とする |
| 配置 | `services/notification/index.ts` を 1 つだけ作り、外部からの import を集約（`channel`, `registry`, `channels/mail` を re-export） |
| 後方互換 | `NotificationDispatcher` は `NotificationChannel` の `type` alias とし、既存 import パスを破壊しない |

## DoD

- リファクタ後も Phase 06 / 07 で確立した全 spec / coverage 閾値を維持
- 変更が機能差分を含まないことを diff レビューで確認
