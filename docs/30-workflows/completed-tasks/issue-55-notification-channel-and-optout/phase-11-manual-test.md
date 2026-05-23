# Phase 11 — 手動テスト / Evidence

## 手動シナリオ

ローカル dev または staging で以下を実行する。

### S-01: opt-out=true 設定 → enqueue が skip される

1. admin として `/admin/members` へ遷移し、対象行から `MemberDrawer` を開く
2. 「通知をオプトアウト」checkbox を有効化
3. `PATCH /admin/members/:memberId/notification-pref` が 200 を返すこと（DevTools ネットワーク）
4. admin から該当 member 向けの可視性リクエスト等で enqueue を発火
5. D1 で `SELECT * FROM notification_outbox WHERE member_id=?` が空、`SELECT * FROM notification_ledger WHERE event_type='skipped_opt_out' AND json_extract(detail_json, '$.memberId')=?` が 1 件

### S-02: opt-out=false に戻すと従来通り配信される

1. checkbox を解除して PATCH 200
2. 同じ enqueue を発火
3. outbox に pending 行が増え、cron tick 後 sent に遷移

### S-03: 未知 kind を渡したときの dlq 遷移

- repository 直叩きで `notification_outbox.channel='line'` を擬似挿入し、cron tick 実行後 `status='dlq'` + ledger に `unknown_channel` 記録を確認

## Evidence（取得物）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/admin-member-drawer-opt-out-toggle.png` | desktop 1280px の toggle UI スクリーンショット |
| `outputs/phase-11/d1-ledger-skipped-opt-out.txt` | `notification_ledger` 行のテキストダンプ |

スクリーンショット未取得の場合は本 Phase ファイルにその旨明記し、PR 本文ではスクリーンショットセクションを設けない（プロンプト「PR作成前チェック」遵守）。

## DoD

- S-01〜S-03 がすべて期待通り
- evidence ファイル 2 点が `outputs/phase-11/` に置かれる（または取得不能理由が明記される）
