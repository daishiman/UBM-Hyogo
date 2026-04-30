# Phase 11 成果物 — 手動 smoke 実行ログ

> 本ファイルは UT-04 spec PR 段階の **手順仕様** を確定するための placeholder ログ。
> 各セクションの `stdout / stderr` は **TBD**（実 dev 環境への apply は実装 Phase の後続 PR で実施）。
> CLOUDFLARE_API_TOKEN / database_id（UUID）は必ずマスクする。
> wrangler 直接呼び出しは禁止（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）。すべて `bash scripts/cf.sh` 経由。

## §1 dev 環境 migration apply

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-dev --env dev
```

| 項目 | 値 |
| --- | --- |
| 実行日時 | TBD |
| stdout 抜粋 | TBD（期待: `Migrated 🌀  0001_init.sql` 等が連続） |
| stderr 抜粋 | TBD（期待: 空） |
| 期待値との一致 | TBD |
| 備考 | 失敗時は `bash scripts/cf.sh d1 list` で database 実在確認 / `wrangler.toml` の binding 名 / database_id 確認 |

## §2 schema 確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev --command=".schema"
```

| 項目 | 値 |
| --- | --- |
| 実行日時 | TBD |
| stdout 抜粋 | TBD（期待: `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` の DDL + 各 index） |
| stderr 抜粋 | TBD |
| 期待値との一致 | TBD |
| 備考 | カラム順 / 型 / `NOT NULL` / `UNIQUE` / `DEFAULT` / `CHECK` の表記が Phase 02 DDL と一致すること |

## §3 migration 履歴確認

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-dev --env dev
```

| 項目 | 値 |
| --- | --- |
| 実行日時 | TBD |
| stdout 抜粋 | TBD（期待: `0001_init` 以降の連番が `applied` 状態で並ぶ） |
| stderr 抜粋 | TBD |
| 期待値との一致 | TBD |
| 備考 | 未適用 migration が 0 件であること |

## §4 NOT NULL violation reject

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="INSERT INTO member_responses (response_id) VALUES ('R-MISSING');"
```

| 項目 | 値 |
| --- | --- |
| 実行日時 | TBD |
| stdout 抜粋 | TBD（期待: 失敗、変更行 0） |
| stderr 抜粋 | TBD（期待: `SQLITE_CONSTRAINT_NOTNULL`） |
| 期待値との一致 | TBD |
| 備考 | `form_id` / `revision_id` / `schema_hash` / `submitted_at` / `answers_json` などの必須カラム省略により reject されること |

## §5 UNIQUE violation reject

```bash
# 1 回目（成功想定）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json) VALUES ('R-001', 'FORM-1', 'REV-1', 'HASH-1', 'a@example.com', '2026-04-29T00:00:00.000Z', '{}');"

# 2 回目（失敗想定）
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json) VALUES ('R-001', 'FORM-1', 'REV-2', 'HASH-2', 'b@example.com', '2026-04-29T00:01:00.000Z', '{}');"
```

| 項目 | 値 |
| --- | --- |
| 実行日時 | TBD |
| 1 回目 stdout | TBD（期待: 1 row inserted） |
| 2 回目 stderr | TBD（期待: `SQLITE_CONSTRAINT_UNIQUE` on `response_id`） |
| 期待値との一致 | TBD |
| 備考 | UT-09 の sync idempotency が DB レベルで担保される確認 |

## §6 FOREIGN KEY / PRAGMA 方針確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="PRAGMA foreign_keys;"
```

| 項目 | 値 |
| --- | --- |
| 実行日時 | TBD |
| `PRAGMA` 結果 | TBD（期待: `1` / 有効） |
| 違反 INSERT stderr | N/A（既存 0001〜0006 は明示 FOREIGN KEY 句を使用していない） |
| 期待値との一致 | TBD（期待: FK 未使用方針が migration-strategy.md §4 と一致） |
| 備考 | FK 導入時は別 migration で `PRAGMA foreign_keys = ON;` と runtime duplex 設定を有効化する |

## §7 正常系 INSERT + SELECT

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-dev --env dev \
  --command="SELECT response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json FROM member_responses WHERE response_id = 'R-001';"
```

| 項目 | 値 |
| --- | --- |
| 実行日時 | TBD |
| stdout 抜粋 | TBD（期待: 1 row / `created_at` が ISO 8601 UTC） |
| stderr 抜粋 | TBD |
| 期待値との一致 | TBD |
| 備考 | mapping 成立（型 / consent / timestamp 規約整合）の最終確認 |

## マスキング規則

- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / database_id（UUID）は `***MASKED***` に置換。
- 実会員データは投入しない（fixture は `R-001` / `a@example.com` 等の合成値のみ）。
- ログ採取は実装 Phase で `tee` ではなくコピーペースト + マスク後 commit する。
