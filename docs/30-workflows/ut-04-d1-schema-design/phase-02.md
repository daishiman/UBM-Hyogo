# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-29 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | completed |
| タスク分類 | implementation（DDL / migration / mapping table 設計） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した「契約提供 + 4 大リスク管理」要件を、(1) DDL 設計 / (2) Sheets ↔ D1 マッピング表 / (3) migration 戦略の 3 成果物に分解し、Phase 3 のレビューが代替案比較で結論を出せる粒度の設計入力を作成する。session 型契約は対象外とし、本タスクは **DB schema 契約** を提供する。

## 実行タスク

1. テーブルごとの完全な DDL を CREATE TABLE 文として記述する（完了条件: `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` が SQL として書かれている）。
2. INDEX / UNIQUE / FK / CHECK 制約を明示列挙する（完了条件: 各テーブルに index リストと制約一覧が表形式で添付）。
3. Sheets フィールド ↔ D1 カラムのマッピング表を作成する（完了条件: Sheets 入力項目（google-form/01-design.md 参照）と `member_responses` / `response_fields` カラムの 1:1 / 変換ルールが表化）。
4. 連番マイグレーション規約を明文化する（完了条件: `NNNN_<verb>_<target>.sql` 形式と idempotency / rollback 方針が記載）。
5. `PRAGMA foreign_keys = ON;` の取り扱い方針を確定する（完了条件: migration 内記述 or runtime 設定 のいずれかが選定理由付きで記載）。
6. DATETIME を ISO 8601 TEXT 統一する仕様を明記する（完了条件: 全 DATETIME 候補列が `TEXT` 型 + format note 付き）。
7. 成果物 3 ファイル分離（schema-design.md / sheets-d1-mapping.md / migration-strategy.md）を確実に作成する（完了条件: artifacts.json の phases[1].outputs と一致）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-01.md | 真の論点・テーブル候補・制約候補表 |
| 必須 | docs/00-getting-started-manual/google-form/01-design.md | Sheets 入力フィールド定義（マッピング元） |
| 必須 | docs/01-infrastructure-setup/03-serial-data-source-and-storage-contract/index.md | data-contract.md 整合確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Wrangler migration 手順 |
| 参考 | https://developers.cloudflare.com/d1/reference/migrations/ | Wrangler D1 migrations 公式 |
| 参考 | https://www.sqlite.org/lang_createtable.html | SQLite CREATE TABLE 仕様 |
| 参考 | https://www.sqlite.org/foreignkeys.html | SQLite FOREIGN KEY 仕様 |

## DDL 設計（schema-design.md 出力例）

### 1. Canonical table set

本 Phase の正本テーブルは `.claude/skills/aiworkflow-requirements/references/database-schema.md` の UBM 会員 Forms 同期テーブルに合わせ、`member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` とする。旧案の `members` / `sync_jobs` / `schema_diff_queue` は legacy 名であり、本タスクの新規 DDL 正本には採用しない。

### 2. `member_responses` テーブル

```sql
CREATE TABLE IF NOT EXISTS member_responses (
  id              TEXT PRIMARY KEY NOT NULL,                    -- UUID v4
  sheets_row_id   TEXT NOT NULL UNIQUE,                         -- Sheets の natural key
  display_name    TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  band_name       TEXT,
  joined_year     INTEGER,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','withdrawn')),
  created_at      TEXT NOT NULL,                                -- ISO 8601: YYYY-MM-DDTHH:MM:SS.sssZ
  updated_at      TEXT NOT NULL,                                -- ISO 8601
  deleted_at      TEXT                                          -- ISO 8601 / NULL = active
);

CREATE INDEX IF NOT EXISTS idx_member_responses_sheets_row_id ON member_responses(sheets_row_id);
CREATE INDEX IF NOT EXISTS idx_member_responses_email         ON member_responses(email);
CREATE INDEX IF NOT EXISTS idx_member_responses_updated_at    ON member_responses(updated_at);
CREATE INDEX IF NOT EXISTS idx_member_responses_status        ON member_responses(status);
```

### 3. `sync_jobs` テーブル

```sql
CREATE TABLE IF NOT EXISTS sync_jobs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  job_name        TEXT NOT NULL,                                -- e.g. 'sync-sheets-to-d1'
  trigger         TEXT NOT NULL CHECK (trigger IN ('cron','admin')),
  started_at      TEXT NOT NULL,
  finished_at     TEXT,
  status          TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  fetched_count   INTEGER,
  upserted_count  INTEGER,
  failed_count    INTEGER,
  duration_ms     INTEGER,
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_started_at ON sync_jobs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status     ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_job_name   ON sync_jobs(job_name);
```

### 4. `schema_diff_queue` / identity 補助テーブル

```sql
`member_identities` / `member_status` / `response_fields` / `schema_diff_queue` は `database-schema.md` の現行契約に従い、Phase 2 outputs で完全 DDL と index を列挙する。
```

### 制約・index サマリ

| テーブル | PK | UNIQUE | NOT NULL 必須カラム | INDEX | CHECK |
| --- | --- | --- | --- | --- | --- |
| member_responses | id | sheets_row_id | id, sheets_row_id, display_name, status, created_at, updated_at | sheets_row_id, email, updated_at, status | status |
| sync_jobs | id | - | id, job_name, trigger, started_at, status | started_at, status, job_name | trigger, status |
| schema_diff_queue | lock_name | - | lock_name, acquired_at, expires_at | expires_at | - |

### FK の取り扱い

- 本初期 schema では FK は導入しない（members 単独テーブル + ログ系のため）。後続タスク（拡張テーブル追加時）で導入する場合に備え、`PRAGMA foreign_keys = ON;` の方針を migration-strategy.md に記述する。

### DATETIME 統一仕様

- 全 DATETIME 候補列は **TEXT 型 + ISO 8601 (`YYYY-MM-DDTHH:MM:SS.sssZ`)** で統一する。
- アプリ側書き込み時に `new Date().toISOString()` を使用する規約を schema-design.md に明記。
- ソート・比較は文字列比較で動作することを明示（ISO 8601 は辞書順 = 時系列順）。

## マイグレーション戦略（migration-strategy.md 出力例）

### ファイル命名規約

- 形式: `NNNN_<verb>_<target>.sql`
  - 例: `0001_init.sql`、`0002_add_band_table.sql`、`0003_alter_members_add_phone.sql`
- 連番は 4 桁ゼロ埋めで衝突を防ぐ。
- `<verb>` は `initial` / `add` / `alter` / `drop` / `rename` のいずれか。

### idempotency 方針

- すべての CREATE 文は `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` を使用。
- INSERT seed データを含める場合は `INSERT OR IGNORE` を使用。
- ALTER 系は idempotent ではないため、新規 migration として追加し既存 file は変更しない（forward-only migration）。

### rollback 方針

- D1 の Wrangler migrations には自動 rollback がない。
- rollback が必要な場合は **逆 migration（forward）** を新規作成する（例: `0004_drop_band_table.sql`）。
- production rollback は `bash scripts/cf.sh d1 export` でバックアップ取得後に逆 migration を適用。

### `PRAGMA foreign_keys = ON;` 取り扱い

- D1 では接続毎に `PRAGMA foreign_keys` が ON にリセットされない。
- 方針: **migration ファイル先頭に `PRAGMA foreign_keys = ON;` を記述する** が、runtime 側でも binding 取得直後に `db.exec('PRAGMA foreign_keys = ON;')` を実行する duplex 方針を Phase 3 でレビューする。
- 初期 schema では FK 未使用のため migration 内記述のみで運用開始。

### 適用 runbook 概要（dev / production）

```bash
# dev (local) 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local

# dev (remote) 適用
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev

# production 適用（事前バックアップ必須）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-$(date +%Y%m%d).sql
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

## Sheets ↔ D1 マッピング設計（sheets-d1-mapping.md 出力例）

### マッピング表（Phase 2 で `google-form/01-design.md` を読んで確定）

| Sheets 列 | D1 テーブル.カラム | 変換ルール | 必須 | 備考 |
| --- | --- | --- | --- | --- |
| 行番号（natural key） | members.sheets_row_id | `string(rowIndex)` | YES | UNIQUE |
| 氏名 | members.display_name | trim | YES | - |
| メールアドレス | members.email | lowercase + trim | NO | - |
| 電話番号 | members.phone | trim、ハイフン除去 | NO | - |
| バンド名 | members.band_name | trim | NO | - |
| 入会年 | members.joined_year | parseInt | NO | - |
| ステータス | members.status | `active`/`inactive`/`withdrawn` 正規化 | YES | デフォルト `active` |
| タイムスタンプ | members.created_at | Sheets timestamp → ISO 8601 | YES | Sheets 側形式に依存 |
| （アプリ側） | members.updated_at | 同期時 `new Date().toISOString()` | YES | 同期 job 側で生成 |
| - | members.id | 同期時 `crypto.randomUUID()` | YES | 既存行は維持 |

> 列名は `google-form/01-design.md` の確定列名で Phase 2 実行時に上書きする。本表は構造のみ提示。

### 変換のエッジケース

- Sheets 側で空セル → D1 側で `NULL`（NOT NULL カラムは default 設定 or skip）
- 重複 sheets_row_id → upsert 時に既存 `id` を維持し、それ以外を更新
- 不正 status 値 → mapper 側で reject（同期 job 側のエラーにする）

## 環境変数 / D1 binding マトリクス

| 項目 | dev 環境 | production 環境 | 注入経路 |
| --- | --- | --- | --- |
| D1 DB 名 | `ubm-hyogo-db-dev` | `ubm-hyogo-db-prod` | `wrangler.toml` `[[d1_databases]]` env-scoped |
| D1 binding 名 | `DB` | `DB` | 同上（コードでは `env.DB` で参照） |
| migration dir | `apps/api/migrations/` | `apps/api/migrations/` | 同一ディレクトリを共有 |

## 実行手順

### ステップ 1: Phase 1 入力の取り込み

- 真の論点・テーブル候補・カラム制約候補表を確認する。
- `apps/api/wrangler.toml` の D1 binding 名と DB 名を実 schema に反映する。

### ステップ 2: DDL 確定

- canonical table set（member_responses / member_identities / member_status / response_fields / schema_diff_queue / sync_jobs）の CREATE TABLE 文を `outputs/phase-02/schema-design.md` に固定する。
- index / CHECK 制約を全て列挙する。

### ステップ 3: Sheets マッピング確定

- `docs/00-getting-started-manual/google-form/01-design.md` を Read し列名と型を確認する。
- マッピング表を `outputs/phase-02/sheets-d1-mapping.md` に作成する。

### ステップ 4: migration 戦略確定

- 命名規約・idempotency・rollback・PRAGMA 取り扱い・runbook 概要を `outputs/phase-02/migration-strategy.md` に記述する。

### ステップ 5: 整合性自己レビュー

- data-contract.md と schema-design.md の役割境界を再確認（契約 vs 実装 refinement）。
- 不変条件 #1 / #4 / #5 の touched チェック。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | DDL / mapping / migration 戦略を base case として代替案比較に渡す |
| Phase 4 | DDL 適用テスト / マッピング契約テストの設計に渡す |
| Phase 5 | 実 migration ファイル（`apps/api/migrations/0001_init.sql`）の作成手順 |
| Phase 6 | rollback / migration 失敗 / CHECK 違反シナリオの網羅対象 |
| Phase 11 | dev / production 適用 smoke の手順 placeholder |

## 多角的チェック観点

- 不変条件 #1: Sheets schema の列名がコードに直接ハードコードされていないか（mapper 層への分離が前提）。
- 不変条件 #4: members が admin-managed data 専用テーブルとして分離されているか。
- 不変条件 #5: migration ファイル配置が `apps/api/migrations/` に閉じ、`apps/web` から schema 参照を要求していないか。
- SQLite 型: 全 DATETIME 列が TEXT 型で ISO 8601 規約付きか。
- 連番衝突: 既存 migration（あれば）と番号衝突していないか。
- 無料枠: 初期 schema が D1 5GB 枠内で十分余裕（数千行想定）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | DDL（3 テーブル） | 2 | pending | schema-design.md |
| 2 | INDEX / 制約一覧 | 2 | pending | schema-design.md |
| 3 | Sheets マッピング表 | 2 | pending | sheets-d1-mapping.md |
| 4 | 連番命名規約 | 2 | pending | migration-strategy.md |
| 5 | PRAGMA foreign_keys 方針 | 2 | pending | migration-strategy.md |
| 6 | DATETIME ISO 8601 仕様 | 2 | pending | schema-design.md |
| 7 | 適用 runbook 概要 | 2 | pending | migration-strategy.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/schema-design.md | DDL（3 テーブル）・index・制約・DATETIME 仕様 |
| 設計 | outputs/phase-02/sheets-d1-mapping.md | Sheets ↔ D1 マッピング表・変換ルール・エッジケース |
| 設計 | outputs/phase-02/migration-strategy.md | 連番規約・idempotency・rollback・PRAGMA・runbook 概要 |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 完了条件

- [ ] schema-design.md に 3 テーブル分の CREATE TABLE 文が記述されている
- [ ] 各テーブルに index / CHECK / UNIQUE / NOT NULL の一覧表がある
- [ ] DATETIME 全列が TEXT + ISO 8601 規約で統一されている
- [ ] sheets-d1-mapping.md に Sheets 列 → D1 カラムの 1:1 マッピングが表化されている
- [ ] エッジケース（空セル / 重複 row id / 不正値）の処理方針が記載
- [ ] migration-strategy.md に `NNNN_<verb>_<target>.sql` 規約が明記
- [ ] idempotency / rollback / PRAGMA foreign_keys 方針が記載
- [ ] dev / production 適用 runbook 概要が `scripts/cf.sh` 経由で記述されている
- [ ] 成果物が 3 ファイル分離されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-02/` 配下に配置済み
- 異常系（CHECK 違反 / UNIQUE 衝突 / migration 番号衝突 / DATETIME 形式不一致）の対応方針が schema 設計内に含まれる
- artifacts.json の `phases[1].status` が `spec_created`
- artifacts.json の `phases[1].outputs` に 3 ファイルが列挙されている

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビュー)
- 引き継ぎ事項:
  - DDL（3 テーブル）を base case として代替案比較に渡す
  - 正規化レベル（単一テーブル vs 拡張正規化）の判断は Phase 3 で確定
  - surrogate key (UUID) vs natural key (sheets_row_id) のトレードオフは Phase 3 でレビュー
  - soft delete (deleted_at) vs hard delete のトレードオフは Phase 3 でレビュー
  - PRAGMA foreign_keys の duplex 方針確認も Phase 3 へ
- ブロック条件:
  - DDL に NOT NULL / PK 抜けが残る
  - DATETIME 列が REAL / INTEGER 型で宣言されている
  - migration 命名規約が未確定
  - data-contract.md との整合性レビューが Phase 3 で発見・差し戻しされる
