# Cron Operations（u-04 最終版）

Phase 10 同名ファイルを最終版へ昇格。Cron 式変更 / 一時停止 / staging 先行検証 / 09b co-owner 通知の運用手順を整理する。

## 1. Cron 表現

```toml
# apps/api/wrangler.toml
[triggers]
crons = ["0 * * * *"]           # 既定: 毎時 0 分（production）
```

UTC ベース。日本時間 09:00 sync を意図する場合は `0 0 * * *` (UTC 0:00 = JST 9:00) など UTC で表記。

## 2. 操作一覧

| 操作 | 手順 | 影響範囲 |
| --- | --- | --- |
| Cron 式変更 | `apps/api/wrangler.toml` 編集 → `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>` | 該当 env のみ |
| 一時停止 | `[triggers] crons = []` で deploy、または Cloudflare Dashboard で disable | 即時反映 |
| 一時短縮（検証用） | `crons = ["* * * * *"]` で staging deploy → 動作確認後復元 | staging 限定 |
| 完全削除 | `[triggers]` セクション自体を削除 → deploy | scheduled handler は残るが起動されない |
| Rollback | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env <env>` | wrangler.toml 全体が直前版に戻る |

## 3. Staging 先行検証フロー

1. dev branch で `wrangler.toml` を編集 → `bash scripts/cf.sh deploy --env staging`
2. 1 週間運用 → audit ledger メトリクス（成功率 / 平均 fetch ms / failed 内訳）を確認
3. 問題なければ main branch へ昇格 → production へ deploy
4. **co-owner 09b（cron-triggers-monitoring）へ事前通知**（slack / issue comment）

## 4. 検証クエリ

```bash
# scheduled trigger が直近 24h で何回走ったか
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging \
  --command "SELECT trigger, status, COUNT(*) FROM sync_job_logs
             WHERE started_at >= datetime('now','-1 day')
             GROUP BY trigger, status" \
  --env staging
# 期待: trigger=scheduled の status=success が cron 頻度 - skipped 数 程度
```

## 5. 異常時の対応

| 症状 | 対応 |
| --- | --- |
| scheduled が走らない | (a) Dashboard で Cron Trigger が enabled か確認 (b) `wrangler.toml` の `[triggers] crons` が空でないか (c) deploy が成功しているか |
| scheduled が頻発で 409 skipped 連発 | cron 頻度が処理時間より短い。一時的に頻度を下げて 09b に再設計依頼 |
| running 残留で全 skipped | mutex 強制解放（runbook §5）+ 09b へ alert 報告 |

## 6. 09b co-owner 通知テンプレ

```
[u-04 Cron Operations] cron 表現変更通知

env: <staging|production>
変更前: 0 * * * *
変更後: <NEW>
理由: <例: 平均実行時間が 90s → 150s に増加したため頻度を半減>
反映予定: <日時>
audit ledger 確認: bash scripts/cf.sh d1 execute ubm-hyogo-db-<env> --command "SELECT trigger, COUNT(*) FROM sync_job_logs WHERE started_at >= datetime('now','-7 day') GROUP BY trigger"
監視設計レビュー希望: yes/no
```

## 7. 不変条件 / 禁止事項

- 不変条件 #6: scheduled handler は Workers 互換実装のみ（fetch + crypto.subtle）
- 禁止: `wrangler` 直接実行（必ず `bash scripts/cf.sh` 経由）
- 禁止: production cron を staging 先行検証なしで変更
- 禁止: `[triggers]` セクションを単独 PR で commit（必ず本タスクまたは 09b 配下で扱う）
