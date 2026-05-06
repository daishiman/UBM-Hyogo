# Phase 10: 最終レビュー / rollback 経路

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (runtime evidence) |
| 状態 | spec_created |

## 目的

リリース前の最終チェック・rollback 経路の確認。

## レビュー観点

| 観点 | チェック |
| --- | --- |
| 不変条件 #5 | `apps/web` から D1 直接アクセスがないこと（`rg "DB|d1" apps/web/src` で件数確認） |
| PII 取り扱い | template に raw `resolutionNote` が grep で検出されないこと（`rg "resolutionNote" apps/api/src/services/notification`） |
| secret hygiene | `MAIL_PROVIDER_KEY` が `.env` 等に平文配置されていないこと、wrangler secret 経由のみ。旧 `RESEND_API_KEY` / `RESEND_FROM_EMAIL` を新規 provisioning しない |
| migration 順序 | `0014_notification_outbox.sql` が `0013_meeting_sessions_soft_delete.sql` の後にのみ apply される（順序保証） |
| cron 重複 | 既存 `*/5 * * * *` cron と統合されている（重複起動回避） |

## rollback 経路

| 障害 | rollback 手順 |
| --- | --- |
| migration 適用後に問題発覚 | `notification_outbox` / `notification_ledger` を `DROP TABLE` する rollback SQL を `outputs/phase-10/rollback.sql` に保存。production では即時削除前に backup（`bash scripts/cf.sh d1 export ubm-hyogo-db-prod --output backup-pre-rollback.sql`） |
| dispatcher 暴走（大量 5xx で Resend rate limit） | wrangler cron trigger を一時 disable（`wrangler.toml` から該当 entry を削除して deploy）。outbox row は pending に残るため後日再処理可 |
| 大量 dlq 発生 | dlq row を抽出し原因調査。手動再投入は `UPDATE notification_outbox SET status='pending', retry_count=0, next_attempt_at=now WHERE status='dlq' AND ...` |
| resolve API リグレッション | 本タスクの enqueue 呼出は try/catch 内のため、route 側コード修正のみで rollback 可。outbox テーブル自体は影響なし |

rollback SQL:

```sql
-- outputs/phase-10/rollback.sql
DROP TABLE IF EXISTS notification_ledger;
DROP TABLE IF EXISTS notification_outbox;
```

## 観測経路

- enqueue 失敗 warning: Cloudflare Workers logs / Sentry transport（既存）
- DLQ 件数監視: 後続タスクで Cloudflare Analytics / dashboard 接続を検討（本タスクでは ledger SELECT で運用）

## 成果物

- `outputs/phase-10/main.md`（レビューチェックリスト + rollback 手順）
- `outputs/phase-10/rollback.sql`

## 完了条件

- [ ] 全レビュー観点 PASS
- [ ] rollback SQL 保存済
- [ ] 観測経路が明記されている

## 次 Phase

次: 11 (runtime evidence)。

## 実行タスク

1. secret hygiene / PII / cron / migration order を確認する
2. rollback と観測経路を確認する

## 参照資料

- `phase-02.md`
- `phase-06.md`

## 統合テスト連携

Phase 9 の green 結果をレビュー入力にする。
