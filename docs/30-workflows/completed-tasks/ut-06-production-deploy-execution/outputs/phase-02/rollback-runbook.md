# Phase 2: ロールバック runbook (AC-8)

> 本書は **事前確認** 用 runbook。Phase 4 GO 判定の前提条件として、ここに記載された全コマンドを delivery 担当が机上確認していることが必須。

## 0. 共通前提

- 本番影響を伴うコマンドは `--env production` を必ず付与
- 全コマンド `mise exec --` 経由で package/lockfile の wrangler version を使用
- 実行前に必ず `wrangler whoami` で対象アカウントを確認

## 1. Workers (apps/api / apps/web) ロールバック

### W-1: 直前 deployment への rollback

```bash
# 1. 直近の deployment 一覧
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production

# 2. ひとつ前の version_id を確認のうえ rollback
bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env production
bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env production

# 3. 検証
curl -sI https://<web-prod-url>
curl -sS https://<api-prod-host>/health
```

### W-2: 完全停止 (緊急)

- Cloudflare Dashboard から該当 Worker を一時無効化
- 同等 CLI が無いため、緊急時は Dashboard 操作が正
- 操作者・操作時刻を `outputs/phase-06/abnormal-case-matrix.md` に記録

## 2. D1 ロールバック

### D-1: マイグレーション部分適用からの復旧

```bash
# 1. 適用範囲確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 2. バックアップから手動リストア (Phase 5 取得分)
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod \
  --env production \
  --file "outputs/phase-05/backup-<TS>.sql"

# 3. テーブル状態確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### D-2: 初回適用失敗 (テーブル DROP 相当)

初回はバックアップが空 export のため、明示的な DROP SQL が必要:

```sql
-- restore-empty.sql (例)
DROP TABLE IF EXISTS <table_name_1>;
DROP TABLE IF EXISTS <table_name_2>;
-- ...0001_init.sql で作成された全テーブル
```

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod \
  --env production --file restore-empty.sql
```

> 0001_init.sql の DDL を Phase 4 preflight 時点でレビューし、対応する DROP 文を `outputs/phase-06/restore-empty.sql` として準備しておく。

## 3. Pages 形式時の追加考慮

`apps/web/wrangler.toml` が `pages_build_output_dir = ".next"` の場合、Pages 配信側のロールバックは:

```bash
# Pages デプロイ履歴
bash scripts/cf.sh pages deployment list --project-name ubm-hyogo-web

# 直前デプロイへ rollback (Dashboard 推奨)
```

OpenNext Workers 形式へ移行後は §1 W-1 と統一される。

## 4. 部分失敗シナリオ別対応

| シナリオ | 状態 | 対応順序 |
| --- | --- | --- |
| D1 適用失敗 / API 未デプロイ | DB のみ汚染 | D-1 または D-2 → 次回再実施 |
| API デプロイ失敗 | DB 適用済・API 旧版 | W-1 (API のみ) または再デプロイ |
| Web デプロイ失敗 | DB / API 更新済・Web 旧版 | W-1 (Web のみ)。API は通常維持 |
| 全件成功後 smoke FAIL | 全更新済 | W-1 (Web → API) → D-1 (DB) の逆順 rollback |

## 5. 事前確認チェックリスト (Phase 4 で完了マーク)

- [ ] 全コマンドが `mise exec --` 経由で実行可能
- [ ] `wrangler whoami` で対象アカウント確認可能
- [ ] `wrangler deployments list` で履歴取得可能 (staging で予行)
- [ ] `wrangler d1 export` / `execute --file` の動作を staging で確認
- [ ] `restore-empty.sql` の雛形を Phase 4 で準備済
- [ ] エスカレーション連絡先 (運用責任者) を Phase 4 production-approval.md に記載済

## 6. リハーサル方針

- staging 環境で D-1 / W-1 を最低 1 回リハーサル
- リハーサル結果は `outputs/phase-06/rollback-rehearsal-result.md` に記録
- 本タスクは docs-only モードのためリハーサル未実施。実行時に必須

## 7. AC-8 達成判定

| 確認項目 | 達成状況 |
| --- | --- |
| Workers rollback コマンドの整備 | DONE (本書 §1) |
| D1 復旧手順の整備 | DONE (本書 §2) |
| 部分失敗シナリオ別対応の整備 | DONE (本書 §4) |
| 事前確認チェックリスト | DONE (Phase 4 でチェック実施) |
