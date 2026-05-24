# Phase 12 — 実装ガイド（中学生レベル概念説明含む）

## このタスクは何をするのか（中学生でもわかる説明）

通知を送る仕組みに、2 つの改善を加える。

1. **「送る相手の好み」を聞く仕組み**  
   メールを受け取りたくないと言っている人には、もう送らないようにする。会員データに「通知を受け取らない＝はい/いいえ」の項目を 1 つ追加して、それが「はい」なら送るのをやめる。やめたことは記録に残す（あとで「なぜ送らなかったの？」と聞かれたときに答えられるように）。

2. **「メールでも LINE でも対応できる入れ口」を作る**  
   今はメールしか送れない。将来 LINE や Slack でも送れるようにするために、「どの方法で送るか」をプログラムが受け取れる形に整える。今回は「メール」だけ実装するけれど、将来「LINE」を追加するときに、土台を作り直さなくていいようにしておく。

## 実装サマリ

| 領域 | 変更内容 |
| --- | --- |
| DB | `member_status` に `notification_opt_out INTEGER NOT NULL DEFAULT 0`、`notification_outbox` に `channel TEXT NOT NULL DEFAULT 'mail'`、`notification_ledger` の event CHECK に `skipped_opt_out` / `unknown_channel` を追加（migration 0020） |
| API ロジック | `NotificationChannel` interface と registry を新設し、`MailNotificationChannel` で既存 mail dispatcher をラップ |
| 通知投入 | `enqueueNotification` に opt-out gate を追加し、true なら skip + ledger 記録 |
| 配信ループ | `notificationDispatchTick` を registry.resolve 経由に切替（未知 kind は dlq） |
| Admin API | `PATCH /admin/members/:memberId/notification-pref` を追加 |
| Admin UI | admin members の `MemberDrawer` に「通知をオプトアウト」toggle を追加 |

## 用語

| 用語 | 意味 |
| --- | --- |
| Outbox | 「これから送る予定」を貯めるテーブル。送信が失敗してもリトライできる |
| Ledger | 送信に関する出来事を時系列で残す台帳。skip / 成功 / 失敗 をすべて記録 |
| Channel | 通知の「経路」。メール / LINE / Slack 等 |
| Adapter | 1 つの Channel を実装したクラス。Channel interface に従う |
| Registry | kind 文字列から Adapter を引き当てる辞書 |

## SSOT 更新

- `docs/00-getting-started-manual/specs/10-notification-auth.md` に「Channel 抽象 + opt-out」セクションを追記すること（実装Phaseの同一diffで反映）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` / `references/task-workflow-active.md` / artifact inventory は本仕様作成waveで同期済み

## DoD

- `phase-12-documentation.md` が canonical 9 見出し（このタスクは何をするのか / 実装サマリ / 用語 / SSOT 更新 / DoD ほか）相当を満たす
- Phase 13 PR 本文で本ファイルが参照されるアンカーを保持
