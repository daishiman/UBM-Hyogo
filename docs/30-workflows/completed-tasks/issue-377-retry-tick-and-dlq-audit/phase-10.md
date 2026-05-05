# Phase 10: デプロイ / cron 反映計画

## デプロイ手順

1. feature ブランチで実装 + test green を確認（Phase 11）。
2. PR 作成（Phase 13）。`Refs #377` を含む。
3. main マージ後、CI が `apps/api` を staging へ deploy（既存 pipeline）。
4. staging で `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 後、Cloudflare dashboard で cron triggers が 3 本以内になっていることを確認。
5. staging で 5 分待ち、`audit_log` に `admin.tag.queue_dlq_moved` 想定動作を観察。
6. production deploy: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production`。production cron 本数 ≤ 3 を確認。
7. tail で 1 tick 観察: `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production`。

## rollback

- cron triggers 削除のみで停止可能: wrangler.toml で該当 cron を削除し redeploy。
- コード rollback: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production`。

## 監視

- `audit_log` の `action='admin.tag.queue_dlq_moved'` 発生数を週次で監視（Phase 12 implementation guide で運用手順化）。
- DLQ row 数が SLA を超えた場合も、D1 直接更新は既存の緊急運用承認 gate を通す。通常復旧は `task-issue-109-dlq-requeue-api-001.md` の manual requeue API で扱う。

## 完了条件

- [ ] 上記手順 / rollback / 監視が `outputs/phase-10/main.md` に記録。
- [ ] production cron 本数 ≤ 3 が wrangler.toml diff で証明される計画を含む。

## 出力

- outputs/phase-10/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

cron deploy 境界と rollback を固定する。

## 実行タスク

- wrangler cron arrays を3本以内に保つ。

## 参照資料

- `apps/api/wrangler.toml`

## 成果物/実行手順

- `outputs/phase-10/main.md`

## 統合テスト連携

- deploy runtime evidence は Phase 13 user approval 後
