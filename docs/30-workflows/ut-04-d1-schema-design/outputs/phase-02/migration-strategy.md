# Phase 2: migration-strategy.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 D1 データスキーマ設計 |
| Phase | 2 / 13（設計） |
| 反映先 | `apps/api/migrations/*.sql`（既存 0001〜0006 を変更しない、追加時の規約のみ規定） |
| 必須コマンド経路 | `bash scripts/cf.sh d1 migrations *`（`wrangler` 直接実行は禁止） |

## 1. ファイル命名規約

形式: `NNNN_<verb>_<target>.sql`

- `NNNN`: 4 桁ゼロ埋めの連番（衝突防止）。Wrangler は **辞書順** に適用するため数字部分が連続している必要がある。
- `<verb>`: `init` / `add` / `alter` / `drop` / `rename` / `seed` のいずれか。
- `<target>`: 対象テーブル / 機能群を snake_case で記述。

### 既存 migration 命名（参考）

| ファイル | 説明 |
| --- | --- |
| `0001_init.sql` | form-driven domain 初期 8 テーブル + view + index |
| `0002_admin_managed.sql` | admin-managed domain 8 テーブル |
| `0002_sync_logs_locks.sql` | UT-09 の sync_locks / sync_job_logs |
| `0003_auth_support.sql` | 認証・監査 4 テーブル |
| `0004_seed_tags.sql` | tag_definitions の seed（INSERT OR IGNORE） |
| `0005_response_sync.sql` | partial UNIQUE INDEX + response_fields 補助 INDEX |
| `0006_admin_member_notes_type.sql` | admin_member_notes に note_type 列を追加 |

> **注意（既知の運用上の脆さ）**: `0002_admin_managed.sql` と `0002_sync_logs_locks.sql` は同じ番号 `0002` を持つ。Wrangler は辞書順で `0002_admin_managed.sql` → `0002_sync_logs_locks.sql` の順に適用する（決定論的）。**今後の新規 migration は重複番号を避ける**ため、次は必ず `0007_<verb>_<target>.sql` 以降を使用する。

## 2. idempotency 方針

すべての DDL を再適用しても副作用が出ないように記述する。

- `CREATE TABLE IF NOT EXISTS ...`
- `CREATE INDEX IF NOT EXISTS ...` / `CREATE UNIQUE INDEX IF NOT EXISTS ...`
- `CREATE VIEW IF NOT EXISTS ...`
- 初期データの seed は `INSERT OR IGNORE INTO ... VALUES ...`（`0004_seed_tags.sql` 参照）。
- `ALTER TABLE ... ADD COLUMN ...` は **idempotent ではない**ため、新規 migration として独立させる（既存ファイルに追記しない）。`0006_admin_member_notes_type.sql` が実例。

## 3. forward-only / rollback 方針

D1 の Wrangler migrations は自動 rollback を提供しない。本プロジェクトは **forward-only** を採用する。

- スキーマを取り消したい場合は **逆 migration（forward）** を新規作成する。例: `0008_drop_legacy_table.sql`。
- production rollback は次の手順で実施する。
  1. `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-$(date +%Y%m%d-%H%M).sql`
  2. 逆 migration を作成して dev で検証
  3. `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
- 既存 migration ファイルの内容変更は禁止（dev / production の整合性が壊れる）。

## 4. `PRAGMA foreign_keys = ON;` の取り扱い

- D1（SQLite）はデフォルトで FK 制約が無効。接続単位で `PRAGMA foreign_keys` を ON にする必要がある。
- 既存 0001〜0006 は **明示 FOREIGN KEY 句を使用していない**ため、現状は実害なし。
- 本タスクの方針:
  1. **migration ファイル先頭に `PRAGMA foreign_keys = ON;` を記述**する（FK を導入する migration 限定で必須）。
  2. アプリ側でも binding 取得直後に `db.exec('PRAGMA foreign_keys = ON;')` を実行する duplex 設定を **FK 導入時に有効化**する（Phase 3 で正式採否、open question として記録）。
- 現状の初期 schema（0001〜0006）は FK 未使用のため、duplex 設定は将来 FK 追加時のオープン課題（Phase 5 / 後続 schema 拡張時に有効化）。

## 5. DATETIME ISO 8601 規約（再掲）

- 全 DATETIME 候補列は `TEXT` 型で宣言。
- 書き込みは次のいずれか:
  - DEFAULT: `DEFAULT (datetime('now'))` → `YYYY-MM-DD HH:MM:SS`（UTC）
  - アプリ側: `new Date().toISOString()` → `YYYY-MM-DDTHH:MM:SS.sssZ`（UTC）
- 新規実装ではアプリ側で `Date.toISOString()` を統一使用。
- TZ は UTC 固定。表示時にアプリ層で JST 変換。

## 6. 環境別 binding と DB 名

| 項目 | dev | production | 注入経路 |
| --- | --- | --- | --- |
| D1 DB 名 | `ubm-hyogo-db-dev` | `ubm-hyogo-db-prod` | `apps/api/wrangler.toml` の env-scoped `[[d1_databases]]` |
| binding 名 | `DB` | `DB` | コードから `env.DB` で参照 |
| migration dir | `apps/api/migrations/` | `apps/api/migrations/` | 共有（同一ファイル群を両環境に適用） |
| 認証 token | 1Password 経由 | 1Password 経由 | `scripts/cf.sh` が `op run --env-file=.env` で動的注入 |

## 7. dev / production 適用 runbook 概要

> すべて `bash scripts/cf.sh` 経由で実行する。`wrangler` を直接呼ばないこと（CLAUDE.md の Cloudflare 系 CLI 実行ルール）。

### 7.1 dev (local D1) 適用

```bash
# 認証確認
bash scripts/cf.sh whoami

# 適用前の状態確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev --local

# 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local

# 適用後検証
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --local \
  --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### 7.2 dev (remote D1) 適用

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev
```

### 7.3 production 適用（事前バックアップ必須）

```bash
# 1. バックアップ
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output "backup-$(date +%Y%m%d-%H%M%S).sql"

# 2. 未適用 migration の確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 3. 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production

# 4. 検証
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) FROM member_responses;"
```

### 7.4 失敗時の rollback

```bash
# 1. バックアップから復元用 SQL を再生成（or 逆 migration を新規作成）
# 2. 逆 migration を dev で検証
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local
# 3. production 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

## 8. 異常系・運用注意

| 異常系 | 検知 | 対処 |
| --- | --- | --- |
| 番号衝突（同一 NNNN） | `migrations list` で重複検出 | 新規ファイルは `0007_...` 以降を使用。0002 重複は既存挙動を維持 |
| CHECK 違反 | apply 時 SQL エラー | 入力データ正規化を mapper 側で実装（UT-09） |
| UNIQUE 衝突（response_email 等） | apply / upsert 時 SQL エラー | 同期ロジックで `INSERT ON CONFLICT DO UPDATE` を採用 |
| DATETIME 形式不一致 | 文字列ソート崩れ | アプリ側書き込みを `Date.toISOString()` に統一、既存 DEFAULT は読み取り専用扱い |
| `0002_*` 重複適用順序の誤解 | 辞書順は決定論的（admin_managed → sync_logs_locks） | 運用注意のみ。今後は重複番号を作らない |
| ALTER TABLE の二重実行 | 「duplicate column name」エラー | ALTER は新規 migration として独立、既存ファイル変更禁止 |

## 9. 不変条件 touched

| # | 不変条件 | migration 戦略での扱い |
| --- | --- | --- |
| #1 | schema をコードに固定しすぎない | DDL 自体に Forms 列ラベルのハードコードゼロ。schema_questions.stable_key で抽象化 |
| #4 | admin-managed data 分離 | `0002_admin_managed.sql` で隔離済 |
| #5 | D1 アクセスは apps/api に閉じる | migration は `apps/api/migrations/` 固定。`apps/web` から schema 参照不要 |

## 10. open question（Phase 3 / Phase 5 へ）

| # | 質問 | 受け皿 |
| --- | --- | --- |
| 1 | `PRAGMA foreign_keys` runtime duplex の有効化時期 | Phase 3 / FK 導入 migration 作成時 |
| 2 | sync_jobs / sync_job_logs の retention（90 日 / 365 日） | Phase 12 / UT-08 連携 |
| 3 | `0002_*` 重複番号の事後正規化（リネーム）の要否 | Phase 12 unassigned-task-detection |
