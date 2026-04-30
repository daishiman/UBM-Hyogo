# Phase 4: テスト戦略 (UT-04 D1 Schema Design)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-04 / D1 データスキーマ設計 |
| Phase | 4 / 13 |
| 状態 | drafted |
| visualEvidence | NON_VISUAL |
| docsOnly | true（実 DDL は `apps/api/migrations/` で確定済み） |

## 目的

Phase 3 で確定した D1 schema（canonical: `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs`）に対し、Phase 5 着手前に必要な検証スイート（migration 5 経路 / 制約 8 ケース / Sheets→D1 マッピング契約 / coverage 代替指標）を設計する。本タスクは `docsOnly: true` のため schema 自身の検証契約と UT-09 への引き渡し契約を確定し、実コード単体テストは UT-09 phase-04 へ委譲する。

## スコープ

含む:

- migration 検証 5 経路（dry-run / local apply / remote apply / 冪等 / rollback）
- schema 制約テスト 8 ケース（PK / NOT NULL × 2 / UNIQUE / FK × 2 / CHECK / DATETIME）
- Sheets→D1 マッピング契約表（UT-09 mapper の契約入力）
- coverage 代替指標（適用成功率 / 制約通過率 / マッピング充足率）
- 検証コマンド集（`scripts/cf.sh` 経由のみ）

含まない: UT-09 mapper の単体テスト実装、本番データ検証、認証 schema。

## 1. migration 検証 5 経路

| # | 経路 | コマンド | アサーション |
| - | --- | --- | --- |
| 1 | dry-run（list） | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev` | 未適用 migration が `Pending` として列挙される。`d1_migrations` 表に未記録 |
| 2 | local apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local` | exit 0、`sqlite_master` に canonical 6 テーブル + 関連 admin/auth テーブルが揃う |
| 3 | remote apply (dev) | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote` | exit 0、`d1_migrations` に各 migration ファイル名行が追加 |
| 4 | 冪等性 | 経路 2 を 2 回連続実行 | 2 回目は `No migrations to apply` を出力。新たな DDL 副作用なし |
| 5 | rollback | `DROP TABLE` を含む rollback SQL を `--file` で適用 → 該当 migration を `d1_migrations` から DELETE → 再 apply | 対象テーブル消失後、再 apply で再作成成功。`d1 export` 取得済みバックアップから restore 可能 |

> 経路 5 は production を想定した手動手順。dev では `--local` 環境を破棄して再構築するパスでも代替可。

## 2. schema 制約テスト 8 ケース

| # | 制約 | 対象 | 違反 SQL（抜粋） | 期待エラー |
| - | --- | --- | --- | --- |
| C1 | PRIMARY KEY | `member_responses.response_id` | 同 PK で 2 件目 INSERT | `UNIQUE constraint failed: member_responses.response_id` |
| C2 | NOT NULL | `member_responses.response_id` | `INSERT INTO member_responses(response_id, ...) VALUES (NULL, ...)` | `NOT NULL constraint failed: member_responses.response_id` |
| C3 | NOT NULL | `member_responses.responseEmail`（system field） | 値省略で INSERT | `NOT NULL constraint failed: member_responses.responseEmail` |
| C4 | UNIQUE | `member_identities.response_id`（FK 兼 UNIQUE） | 既存 `response_id` で 2 件目 INSERT | `UNIQUE constraint failed` |
| C5 | FOREIGN KEY (INSERT) | `member_identities.response_id → member_responses.response_id` | 親不在の `response_id` で子 INSERT（`PRAGMA foreign_keys=ON` 前提） | `FOREIGN KEY constraint failed` |
| C6 | FOREIGN KEY (DELETE) | `member_responses` 親削除時の挙動 | `DELETE FROM member_responses WHERE ...`（子残存） | RESTRICT 採用テーブルでは `FOREIGN KEY constraint failed`、CASCADE 採用テーブルでは子も連鎖削除（設計値どおり） |
| C7 | CHECK | `member_responses.publicConsent IN (0,1)` | `publicConsent = 2` で INSERT | `CHECK constraint failed: publicConsent` |
| C8 | DATETIME (ISO 8601) | `submitted_at` / `created_at` / `updated_at` | 不正文字列（例: `2026/04/29`）を INSERT | D1 自身は TEXT として受理 → mapper 側で reject。本ケースは UT-09 phase-04 で mapper unit テストとして担保（schema 側は format 規約のみ） |

### C5/C6 の前提

`PRAGMA foreign_keys = ON;` が migration 冒頭で発行され、かつ runtime（Workers 接続毎）でも有効化されていること。Phase 6 #9 で PRAGMA 漏れの異常系を扱う。

## 3. Sheets→D1 マッピング契約

UT-09 mapper の contract test が参照する不変テーブル。section 番号で grouping し、空セルは NULL、Yes/No 系は INTEGER(0/1) へ正規化する。

| Sheets 列（論理名） | D1 テーブル.カラム | 型 | NULL 可否 | 変換規則 |
| --- | --- | --- | --- | --- |
| Timestamp | `member_responses.submitted_at` | TEXT(ISO 8601) | NOT NULL | `new Date(v).toISOString()` で正規化 |
| Email Address | `member_responses.responseEmail` | TEXT | NOT NULL | system field（フォーム項目外）として注入 |
| 公開承諾 | `member_responses.publicConsent` | INTEGER(0/1) | NOT NULL | `はい=1 / いいえ=0` |
| 規約同意 | `member_responses.rulesConsent` | INTEGER(0/1) | NOT NULL | 同上 |
| Section1〜6 内 27 項目 | `response_fields(response_id, field_key, field_value)` | TEXT | 値は NULL 許容 | section 番号 + question key を `field_key` に保持。空セル → 行を投入しない or `field_value=NULL` |
| 派生: identity | `member_identities.response_id` / `display_name` | TEXT | NOT NULL / NULL | `response_id` を親 `member_responses.response_id` から FK 参照 |
| 派生: status | `member_status.response_id` / `state` | TEXT | NOT NULL | 初期値 `pending`（admin 操作で `active`/`archived` 等に遷移） |
| 同期メタ | `sync_jobs(job_id, started_at, finished_at, status)` | 各種 | started_at NOT NULL | mapper では未投入。同期ジョブ側で記録（UT-09） |
| 差分検知 | `schema_diff_queue(detected_at, sheet_column, action)` | 各種 | NOT NULL | Sheets 列追加検知時に行追加（UT-01 設計に従う） |

> 本表は UT-09 `mapper.ts` の contract test 不変条件。本タスクでは契約のみ固定し、実装は UT-09 で行う。

### 充足率計算

Sheets 全 31 項目（system field 含む）を「mapping 済み」または「明示的に未使用」のいずれかで全件マークする。31/31 = 100% を Phase 9 で実測する。

## 4. coverage 代替指標

schema は SQL 宣言のため line/branch coverage は適用しない。

| 指標 | 目標 | 計測 |
| --- | --- | --- |
| migration 適用成功率 | 100% | 経路 1〜4 全成功（経路 5 は手動手順記述で代替） |
| 制約検証通過率 | 100% | C1〜C8 全件で期待エラー観測（C8 は mapper 側で UT-09 計測） |
| マッピング充足率 | 100% | Sheets 31 項目が mapping or 未使用マーク |

mapper の line 80%+ / branch 70%+ は UT-09 phase-04 で計測（本 Phase スコープ外）。

## 5. 検証コマンド集（`scripts/cf.sh` 経由必須）

```bash
# 認証 / DB 一覧
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list

# 経路 1: dry-run
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-dev --env dev

# 経路 2: local apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local

# 経路 3: remote apply (dev)
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --remote

# 経路 4: 冪等性（2 回目）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev --local

# 経路 5: rollback 補助
bash scripts/cf.sh d1 export   ubm-hyogo-db-prod --env production --output backup-$(date +%Y%m%d-%H%M%S).sql
bash scripts/cf.sh d1 execute  ubm-hyogo-db-dev --env dev --local --command "DROP TABLE IF EXISTS member_responses"
bash scripts/cf.sh d1 execute  ubm-hyogo-db-dev --env dev --local --command "DELETE FROM d1_migrations WHERE name='0001_init.sql'"

# 制約 C1〜C7 の手動再現（local）
bash scripts/cf.sh d1 execute  ubm-hyogo-db-dev --env dev --local \
  --command "INSERT INTO member_responses(response_id, responseEmail, submitted_at, publicConsent, rulesConsent) VALUES ('r1', NULL, '2026-04-29T00:00:00.000Z', 1, 1)"

# schema スナップショット
bash scripts/cf.sh d1 execute  ubm-hyogo-db-dev --env dev --local \
  --command "SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name"

# PRAGMA foreign_keys 確認
bash scripts/cf.sh d1 execute  ubm-hyogo-db-dev --env dev --local --command "PRAGMA foreign_keys"
```

> wrangler 直叩き禁止。CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従い `scripts/cf.sh` 経由で 1Password から token を動的注入する。

## UT-09 への引き渡し契約（不変条件）

1. canonical 6 テーブルの PK / UNIQUE / FK / CHECK は本 Phase の表が source-of-truth。
2. Sheets→D1 マッピングは §3 表が契約。mapper は本表に従う変換のみ実装する。
3. DATETIME は ISO 8601 TEXT 統一。mapper 側で正規化と reject を担う（C8）。
4. `PRAGMA foreign_keys = ON;` は migration 冒頭 + runtime 接続毎に発行する。
5. 同期ジョブの記録は `sync_jobs`、差分検知は `schema_diff_queue` で受ける。

## AC トレース（暫定）

| AC | カバー手段 |
| --- | --- |
| AC-1, AC-2, AC-8 | 経路 1〜4 |
| AC-3 | §3 マッピング契約 |
| AC-4 | 経路 2, 3, 4 |
| AC-5 | C1〜C7 |
| AC-6 | §3 + Phase 7 整合性レビュー |
| AC-7 | 経路 5 + Phase 5 runbook |
| AC-9 | C8 + §3 |
| AC-10 | C5, C6 + PRAGMA 確認コマンド |
| AC-11, AC-12 | Phase 7 / Phase 10 |

## 完了条件

- [x] migration 5 経路に SQL コマンドとアサーションが揃う
- [x] 制約 8 ケースに違反 SQL と期待エラーが揃う
- [x] Sheets→D1 マッピング表が canonical 6 テーブルにマップされる
- [x] coverage 代替指標 3 種が定義
- [x] 検証コマンドが `scripts/cf.sh` 経由のみ
- [x] UT-09 への契約 5 件が不変条件として明示
