# Phase 5: D1 マイグレーション適用記録 (AC-3)

> **ステータス: NOT EXECUTED (未実行)**
> **理由:** 本タスク (UT-06) はドキュメントのみ作成モード。`wrangler d1 migrations apply --env production` は本番不可逆操作のため未発火。

## 1. 対象マイグレーション一覧

実機 `apps/api/migrations/` を確認した結果、本タスク開始時点で以下 1 件が対象:

| # | ファイル | 役割 | 適用先 |
| --- | --- | --- | --- |
| 1 | `apps/api/migrations/0001_init.sql` | 初期スキーマ DDL | D1 production |

> 追加マイグレーションは UT-04 / 後続タスクで追加されうる。実行直前に `ls apps/api/migrations/` で再確認すること。

## 2. 適用前確認

```bash
# 未適用件数を確認
bash scripts/cf.sh d1 migrations list <DB_NAME> --env production
```

期待: 全件 (本タスク時点では 1 件) が「未適用 (pending)」状態であること。

## 3. 適用コマンド

```bash
bash scripts/cf.sh d1 migrations apply <DB_NAME> --env production
```

## 4. 適用後確認

```bash
# 適用履歴の確認
bash scripts/cf.sh d1 migrations list <DB_NAME> --env production

# テーブル存在確認
bash scripts/cf.sh d1 execute <DB_NAME> --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## 5. D1 マイグレーション実行記録テーブル (AC-3 必須テンプレ)

| # | マイグレーションファイル名 | 適用日時 | 結果 | rollback 可否 | rollback 手順への参照 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `0001_init.sql` | TBD (YYYY-MM-DD HH:MM:SS JST) | pending (PASS / FAIL) | YES (バックアップ SQL からリストア可) | `outputs/phase-02/rollback-runbook.md#d1` | スキーマ初期化 |

## 6. 適用前後サマリー

| 項目 | 適用前 | 適用後 |
| --- | --- | --- |
| 未適用件数 | TBD (Phase 4 preflight 値) | 0 (期待) |
| 適用済件数 | TBD (Phase 4 preflight 値) | TBD (preflight 値 + 適用件数) |
| 検出されたテーブル | TBD (空または既存) | TBD (`SELECT name FROM sqlite_master WHERE type='table';` の結果) |

## 7. バックアップ参照

- バックアップファイル: `outputs/phase-05/backup-<timestamp>.sql`
- バックアップ取得証跡: `outputs/phase-05/d1-backup-evidence.md`
- リストア手順: `outputs/phase-02/rollback-runbook.md` D1 セクション

## 8. 失敗時の即時アクション

| 症状 | 対応 |
| --- | --- |
| migration apply が SQL エラーで停止 | バックアップ SQL から手動リストア (`wrangler d1 execute --file backup-<ts>.sql`) |
| 一部適用 (部分成功) | `wrangler d1 migrations list --env production` で適用範囲確認 → リストア要否判断 |
| binding 不一致エラー | `wrangler.toml` の `[env.production.d1_databases]` の `binding` / `database_id` を再確認 |

詳細は Phase 6 `outputs/phase-06/abnormal-case-matrix.md` シナリオ A-3 を参照。

## 9. AC-3 達成判定

| 確認項目 | 達成状況 |
| --- | --- |
| `wrangler d1 migrations list --env production` で全件 applied 記録 | pending |
| 想定テーブルが `sqlite_master` に存在 | pending |
| 本ファイルの実行記録テーブルが完了状態 | pending |
