# Phase 6: 異常系検証 (UT-04 D1 Schema Design)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 / D1 データスキーマ設計 |
| Phase | 6 / 13 |
| 状態 | drafted |
| docsOnly | true |

## 目的

Phase 5 runbook の各 Step に対応する異常系を migration / 制約 / DR / 環境 / 並行 の 5 層で網羅し、検出方法・retry 戦略・復旧手順・ログ JSON 例を揃える。Phase 7 AC マトリクスへ wire-in し、Phase 9 で実測可能な形にする。

## failure cases マトリクス

| # | 分類 | ケース | 原因 | 検出 | retry 戦略 | 復旧 | ログ例 |
| - | --- | --- | --- | --- | --- | --- | --- |
| 1 | migration | apply 失敗（SQL syntax error） | DDL 文法ミス | `cf.sh` exit code != 0、stderr に `near "..."` | 即時失敗 | 該当 SQL 修正 → 再 apply。`d1_migrations` に未記録なので再実行可 | `{code:"D1_MIGRATION_SYNTAX",file:"0001_init.sql"}` |
| 2 | migration | 部分適用（複数文の一部失敗） | 単一 SQL 内で前文成功・後文失敗 | `sqlite_master` に部分テーブル存在 + exit code != 0 | 手動 rollback → 修正 → 再 apply | 部分テーブル DROP → `d1_migrations` から該当行 DELETE → 再 apply | `{code:"D1_MIGRATION_PARTIAL",applied:["member_responses"],failed:"member_identities"}` |
| 3 | migration | duplicate apply | 同一 migration の 2 回目 apply | `d1_migrations` に既存行 → wrangler は no-op | no-retry（冪等正常動作） | 不要 | `{code:"D1_MIGRATION_SKIPPED",version:"0001_init"}` |
| 4 | migration | 番号衝突 | 別ブランチで同番号別 SQL を merge | `cf.sh d1 migrations list` 出力で順序逆転 / 重複 | 即時失敗 | 番号繰り上げ（`0007_*` へ rename）→ 再 apply | `{code:"D1_MIGRATION_CONFLICT",duplicates:["0002_admin_managed.sql","0002_sync_logs_locks.sql"]}` |
| 5 | 制約 | NOT NULL 違反（`responseEmail`） | mapper が NULL を送信 | INSERT エラー `NOT NULL constraint failed` | アプリ層 reject（schema 防御） | mapper バリデーション修正（UT-09） | `{code:"D1_NOT_NULL",table:"member_responses",column:"responseEmail"}` |
| 6 | 制約 | UNIQUE 違反（`response_id`） | Sheets で同 ID 重複行 | INSERT エラー or upsert UPDATE 経路 | `INSERT ... ON CONFLICT DO UPDATE`（UT-09 で実装） | 冪等動作のため復旧不要 | `{code:"D1_UNIQUE_UPSERT",table:"member_responses",responseId:"r1"}` |
| 7 | 制約 | FOREIGN KEY 違反（INSERT） | 親 `member_responses.response_id` 不在で `member_identities` INSERT | `FOREIGN KEY constraint failed`（PRAGMA ON 前提） | 即時失敗 | アプリ層で親 upsert 後に子 upsert（順序保証） | `{code:"D1_FK_VIOLATION",child:"member_identities",missingParent:"member_responses.response_id"}` |
| 8 | 制約 | FOREIGN KEY 違反（DELETE） | RESTRICT 設定下で親 DELETE | DELETE エラー | 即時失敗 | 子レコードを先に処理 | `{code:"D1_FK_RESTRICT",parent:"member_responses"}` |
| 9 | 制約 | `PRAGMA foreign_keys=ON` 未発行 | migration 冒頭の PRAGMA 漏れ / runtime 接続で未発行 | FK 違反が silent pass（運用観点で危険） | 即時失敗扱い（運用 incident） | migration 冒頭に PRAGMA 追加 + runtime hook 修正 → 再 apply | `{code:"D1_FK_DISABLED",pragma:0}` |
| 10 | 制約 | CHECK 違反（`publicConsent`/`rulesConsent` 範囲外） | 0/1 以外の値投入 | INSERT エラー `CHECK constraint failed` | mapper 側で reject | 値変換ルール修正（UT-09） | `{code:"D1_CHECK_FAILED",column:"publicConsent",value:2}` |
| 11 | DR | production への致命的破壊 | DROP COLUMN 等を production に誤適用 | アプリ層 query エラー / 行数減少 | 即時失敗（critical） | Step 4 取得の `backup-*.sql` から restore | `{code:"D1_DATA_LOSS",severity:"critical"}` |
| 12 | DR | export ファイル破損 | export 中断 / 通信エラー | restore 時に SQL parse error | 即時失敗 | 直近の別バックアップ / 前 commit state へ revert | `{code:"D1_EXPORT_CORRUPT",file:"backup-20260429-120000.sql"}` |
| 13 | 環境 | dev / production の database_id 取り違え | `wrangler.toml` の `[env.*]` 設定ミス | dev migration が production に適用される | 即時失敗（重大） | 適用前に `d1 list` + `--env` 突合。誤適用時は backup から restore | `{code:"D1_ENV_MISMATCH",appliedTo:"production",intended:"dev"}` |
| 14 | 環境 | 1Password 認証失敗 | API token 期限切れ / op session 切れ | `cf.sh whoami` が 401 / op error | 即時失敗 | `op signin` 再実行 → token 再取得 | `{code:"CF_AUTH_FAILED",detail:"op session expired"}` |
| 15 | 並行 | dev と production への同時 apply 競合 | 並行 CI ジョブが同 DB へ apply | `d1_migrations` に重複行 / 順序逆転 | no-retry（lock で防御） | CI 側で mutex（GitHub Actions concurrency）を導入。誤投入時は backup から restore | `{code:"D1_CONCURRENT_APPLY",jobs:["job-A","job-B"]}` |

合計 15 件（要件 12 件以上を満たす）。

## migration 失敗時の rollback 手順

### Case 2: 部分適用の rollback（dev / production 共通）

```bash
# 失敗状態の確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

# 部分適用テーブルを DROP（例: member_identities が部分適用された場合）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "DROP TABLE IF EXISTS member_identities"

# d1_migrations から該当行削除（再 apply を可能化）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "DELETE FROM d1_migrations WHERE name = '0001_init.sql'"

# SQL 修正後に再 apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote
```

## FK 制約違反検証

```bash
# PRAGMA 確認（必須: 1 を期待）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "PRAGMA foreign_keys"

# 違反を意図的に発生させる
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "INSERT INTO member_identities(response_id, display_name) VALUES ('not_exists', 'X')"
# 期待: FOREIGN KEY constraint failed
```

## duplicate apply の冪等性検証

```bash
# 1 回目
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local
# 2 回目（no-op を期待）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local
```

期待: 2 回目は `No migrations to apply` または該当 migration のスキップが出力される。

## D1 export → restore DR 手順

```bash
# 1. 事前バックアップ（Step 4 と同一）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-$(date +%Y%m%d-%H%M%S).sql

# 2. 災害発生時: DB 状態確認
bash scripts/cf.sh d1 list

# 3. restore（バックアップ SQL を適用）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --file backup-20260429-120000.sql

# 4. 検証
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "SELECT COUNT(*) FROM member_responses"
```

## 各ケース ↔ Phase 4 検証スイート wire-in

| Case # | 対応スイート（Phase 4） |
| --- | --- |
| 1, 2, 4 | migration 5 経路（特に経路 5 rollback） |
| 3 | 経路 4（冪等性） |
| 5, 6, 7, 8, 10 | 制約 8 ケース（C2, C4, C5, C6, C7） |
| 9 | 制約 C5/C6 + PRAGMA 確認コマンド |
| 11, 12 | Phase 11 手動 smoke で DR runbook を実演 |
| 13, 14 | Step 0 の `whoami` / `d1 list` 突合 |
| 15 | CI mutex 設計（UT-06 / UT-09 への引き継ぎ） |

## ログフォーマット規約

全ケースの `code` は `D1_*` または `CF_*` プレフィックス。UT-07（通知基盤）の入力契約に整合させるため JSON 1-line（改行なし）で出力する。`severity` は `info` / `warning` / `critical` の 3 段階。

## open question（Phase 12 unassigned へ送る）

- 並行 apply 防止の CI mutex 実装（Case 15）→ UT-06 デプロイタスク
- backup ファイルの保管場所と廃棄ポリシー（保管期間 / 暗号化）→ UT-10 系運用タスク
- ログ収集基盤との連携（`code` プレフィックスの登録）→ UT-07 通知タスク

## AC トレース

| AC | カバー手段 |
| --- | --- |
| AC-2 | Case 1, 2, 4 |
| AC-4 | Case 3, 13 |
| AC-5 | Case 5〜10 |
| AC-7 | Case 11, 12 + DR runbook |
| AC-10 | Case 7, 8, 9 |
| AC-12 | Case 13（誤適用防止） |

## 完了条件

- [x] 12 件以上の failure case が 5 層で網羅（15 件記載）
- [x] 全件で 5 項目（分類・原因・検出・retry 戦略・ログ例）が埋まる
- [x] migration 部分適用 rollback がコマンド完結
- [x] D1 export → restore DR 手順がコマンド付き
- [x] FK / 冪等性検証が観測可能なコマンドで記述
- [x] Phase 4 検証スイートとの wire-in 表完成
- [x] wrangler 直叩きゼロ
