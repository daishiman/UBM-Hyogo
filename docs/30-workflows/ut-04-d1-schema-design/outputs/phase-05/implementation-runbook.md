# Phase 5: 実装ランブック (UT-04 D1 Schema Design)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 / D1 データスキーマ設計 |
| Phase | 5 / 13 |
| 状態 | drafted |
| docsOnly | true（実 DDL は `apps/api/migrations/` に既存。本 Phase は適用 runbook の確定が主目的） |

## 目的

`docsOnly: true` のため新規 SQL の作成は行わず、既存 `apps/api/migrations/*.sql` を成果物として参照しつつ、dev → production の 2 段階 migration 適用 runbook と sanity check / rollback パスを確定する。**wrangler 直叩きは禁止し、`scripts/cf.sh` 経由のみを使う。**

## 既存 migration 一覧（成果物として参照）

| パス | 役割 | 含むテーブル / 変更 |
| --- | --- | --- |
| `apps/api/migrations/0001_init.sql` | 初期 schema | `member_responses` / `member_identities` / `member_status` / `response_fields` + `PRAGMA foreign_keys=ON` |
| `apps/api/migrations/0002_admin_managed.sql` | admin-managed テーブル | admin プロフィール・タグ・ノート系 |
| `apps/api/migrations/0002_sync_logs_locks.sql` | 同期メタ | `sync_jobs`（旧 `sync_job_logs` / `sync_locks` 相当を canonical 名で統合） |
| `apps/api/migrations/0003_auth_support.sql` | Auth.js 補助 | sessions / accounts 等（UT-13 系で詳細管理） |
| `apps/api/migrations/0004_seed_tags.sql` | 初期 seed | タグマスタ初期投入 |
| `apps/api/migrations/0005_response_sync.sql` | 差分同期 | `schema_diff_queue` + 既存テーブルの sync 列追加 |
| `apps/api/migrations/0006_admin_member_notes_type.sql` | 型修正 | admin_member_notes の列型修正 |

> 上記は実装済み。本 runbook では **追加修正は行わず**、適用順序と検証コマンドのみ確定する。

## 修正ファイル（差分なしを確認）

| パス | 期待状態 |
| --- | --- |
| `apps/api/wrangler.toml` | `[[d1_databases]]` binding に `migrations_dir = "migrations"` が定義されており、`[env.dev]` / `[env.production]` で別 `database_id` が設定されていること |

差分が必要な場合は別タスク（UT-02 系）で対応する。本タスクでは現状維持を確認するのみ。

## runbook

### Step 0: 事前準備

```bash
# Node 24 + pnpm 10 を mise で固定
mise install
mise exec -- pnpm install

# 認証確認（cf.sh 経由・wrangler 直叩き禁止）
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
```

期待: `whoami` で account_id が表示、`d1 list` に `ubm-hyogo-db-dev` / `ubm-hyogo-db-prod` が両方並ぶ。

### Step 1: dry-run（pending 確認）

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev
```

期待: 未適用の migration が `Pending` 列で表示。既適用なら `No migrations to apply`。

### Step 2: local 適用（Miniflare）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local

# schema スナップショット
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

# PRAGMA 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "PRAGMA foreign_keys"
```

期待: canonical 6 テーブル（`member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs`）が SELECT 結果に並ぶ。`PRAGMA foreign_keys` が `1`。

### Step 3: dev (remote) 適用

```bash
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-dev --env dev
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote

# d1_migrations 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 10"
```

期待: `d1_migrations` に `0001_init.sql`〜`0006_admin_member_notes_type.sql` が記録。

### Step 4: production 適用前バックアップ（必須）

```bash
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-$(date +%Y%m%d-%H%M%S).sql
```

期待: `backup-YYYYMMDD-HHMMSS.sql` が生成。サイズ非ゼロ。保管先は 1Password Vault または安全なローカル領域（commit 禁止）。

### Step 5: production 適用（**人手承認必須**）

```bash
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production --remote

bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "SELECT COUNT(*) AS table_count FROM sqlite_master WHERE type='table'"
```

期待: `table_count` がリリース計画通りの値（dev と同数）。`d1_migrations` に全 migration が並ぶ。

> canUseTool: Step 5 のコマンドは production 破壊的変更を含むため canUseTool で deny し、人手承認のうえ実行する。Step 0〜4 は自動承認可。

## verification step（適用後の health check）

```bash
# canonical 6 テーブル全件存在確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('member_responses','member_identities','member_status','response_fields','schema_diff_queue','sync_jobs') ORDER BY name"

# 期待行数: 6

# index 存在確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "SELECT name FROM sqlite_master WHERE type='index' ORDER BY name"
```

## rollback 手順

### 直前 migration の手動 rollback（dev）

```bash
# 1. 状態確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 5"

# 2. 該当テーブルを DROP（rollback 用 SQL を別途 file にしておく）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "DROP TABLE IF EXISTS <該当テーブル>"

# 3. d1_migrations から該当行を削除（再 apply 可能化）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --remote \
  --command "DELETE FROM d1_migrations WHERE name = '<該当 migration ファイル名>'"
```

### production: バックアップからの restore

```bash
# Step 4 で取得した backup-*.sql を適用
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --file backup-YYYYMMDD-HHMMSS.sql

# 検証
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --remote \
  --command "SELECT COUNT(*) FROM member_responses"
```

詳細な異常系は Phase 6 `failure-cases.md` 参照。

## canUseTool 適用範囲

| 操作 | 自動 | 人手承認 |
| --- | --- | --- |
| Step 0〜2（whoami / list / local apply） | 可 | - |
| Step 3（dev remote apply） | 可（dev は staging 相当） | 任意で承認可 |
| Step 4（production export） | 可 | - |
| Step 5（production migrations apply） | 不可 | 必須 |
| rollback の DROP TABLE / DELETE | 不可 | 必須 |
| restore（`--file` 適用） | 不可 | 必須 |

## AC トレース

| AC | runbook 項目 |
| --- | --- |
| AC-2 | Step 1〜3（既存 SQL 適用成功） |
| AC-4 | Step 2, 3 |
| AC-5 | verification step（PK/NOT NULL/UNIQUE/FK/INDEX 存在確認） |
| AC-7 | Step 0〜5 + rollback 手順全体 |
| AC-10 | Step 2 の PRAGMA 確認 |
| AC-12 | 全コマンドが `apps/api/migrations/` 経由で `apps/web` 非依存 |

## 完了条件

- [x] 既存 migration 7 ファイルが成果物として参照されている
- [x] Step 0〜5 が `scripts/cf.sh` 経由のみで構成
- [x] production 適用前バックアップが必須化
- [x] verification step が canonical 6 テーブルを検証
- [x] rollback / restore 手順がコマンドベースで記述
- [x] canUseTool 範囲が明示（Step 5 / rollback / restore は人手承認）
- [x] wrangler 直叩きゼロ
