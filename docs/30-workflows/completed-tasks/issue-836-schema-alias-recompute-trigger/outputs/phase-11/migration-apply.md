# Phase 11 — RAC-1: migration apply（0020_schema_alias_recompute_jobs）

[実装区分: 実装仕様書]

> 目的: `apps/api/migrations/0020_schema_alias_recompute_jobs.sql` を staging D1 へ apply し、`schema_alias_recompute_jobs` テーブルのカラムと `UNIQUE(alias_id, stable_key, trigger_key)` index が存在する evidence を記録する（RAC-1 / AC-7）。
> 実行区分: **user-gated**（migration apply は user 明示承認後のみ）。production apply は dev→main リリース時に別途 user-gated。

## 前提・不変条件

- Cloudflare 操作は **`scripts/cf.sh` 経由のみ**。`wrangler` を直接呼ばない（CLAUDE.md / MEMORY）。
- D1 へのアクセスは Workers binding 経由（`apps/api` に閉じる）。`apps/web` から直接アクセス禁止（不変条件 5）。
- evidence MD に **secret / API token / D1 binding 実値を一切記載しない**（不変条件 9）。token は `scripts/cf.sh` が 1Password から揮発注入する。
- migration DDL の正本は `outputs/phase-02/d1-schema-migration.md`（採番 0020 根拠・DDL・PRAGMA 検証手順 86-92 行）。

## 手順（staging・user-gated）

### 1. 認証確認

```bash
bash scripts/cf.sh whoami
```

### 2. 適用前の migration 一覧確認（apply 対象が pending であること）

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db --env staging
```

> evidence: `0020_schema_alias_recompute_jobs.sql` が未適用（pending）として一覧に出ることを記録。

### 3. apply 実行（user 明示承認後）

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging
```

> DB 名 / `--env` は staging 構成に合わせる（`apps/api/wrangler.toml` の binding 定義が正本。実値はここに転記しない）。

### 4. 適用後の構造検証（PRAGMA）

`outputs/phase-02/d1-schema-migration.md` の検証手順（86-92 行）に従う。`scripts/cf.sh` で D1 に PRAGMA を実行する。

```bash
# カラム一覧の確認
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging \
  --command "PRAGMA table_info(schema_alias_recompute_jobs);"

# index 一覧の確認（UNIQUE index の存在）
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging \
  --command "PRAGMA index_list(schema_alias_recompute_jobs);"

# UNIQUE index の構成カラム確認（alias_id, stable_key, trigger_key）
bash scripts/cf.sh d1 execute ubm-hyogo-db --env staging \
  --command "PRAGMA index_info(idx_schema_alias_recompute_jobs_trigger_unique);"
```

## evidence として記録する項目

> 以下を実行結果のテキスト（または整形表）として本ファイルに追記する。**接続文字列・token・account id 等の機密値は記録しない**。

### 4.1 `PRAGMA table_info` 期待カラム（19 列）

| name | 期待 type | notnull | dflt | pk |
| --- | --- | --- | --- | --- |
| job_id | TEXT | — | — | 1 |
| alias_id | TEXT | 1 | — | 0 |
| stable_key | TEXT | 1 | — | 0 |
| question_id | TEXT | 1 | — | 0 |
| trigger_key | TEXT | 1 | — | 0 |
| status | TEXT | 1 | 'pending' | 0 |
| affected_count | INTEGER | 1 | 0 | 0 |
| processed_count | INTEGER | 1 | 0 | 0 |
| updated_count | INTEGER | 1 | 0 | 0 |
| deleted_collision_count | INTEGER | 1 | 0 | 0 |
| cursor | TEXT | 0 | — | 0 |
| recompute_audit_id | TEXT | 0 | — | 0 |
| locked_at | TEXT | 0 | — | 0 |
| locked_by | TEXT | 0 | — | 0 |
| run_token | TEXT | 0 | — | 0 |
| last_error | TEXT | 0 | — | 0 |
| created_by | TEXT | 1 | — | 0 |
| created_at | TEXT | 1 | — | 0 |
| updated_at | TEXT | 1 | — | 0 |

### 4.2 `PRAGMA index_list` 期待 index（2 件）

| name | unique | 用途 |
| --- | --- | --- |
| idx_schema_alias_recompute_jobs_trigger_unique | 1（UNIQUE） | idempotency `(alias_id, stable_key, trigger_key)` |
| idx_schema_alias_recompute_jobs_alias | 0 | `(alias_id, created_at)` 直近 job 取得 |

### 4.3 記録テンプレート（実行後に追記）

```text
## 実行ログ（YYYY-MM-DD・実施者）
- env: staging
- migrations list（apply 前）: 0020 = pending
- apply 結果: success（適用 N 件）
- PRAGMA table_info: 19 列確認（上表と一致 / 差分: なし）
- PRAGMA index_list: 2 件確認（UNIQUE = idx_..._trigger_unique）
- PRAGMA index_info(...trigger_unique): seqno 0=alias_id / 1=stable_key / 2=trigger_key
```

## 確認項目（DoD / AC-7）

- [ ] staging で apply が success（user 明示承認後に実行）
- [ ] `PRAGMA table_info` が §4.1 の 19 列と一致
- [ ] `PRAGMA index_list` に UNIQUE index が存在（§4.2）
- [ ] `PRAGMA index_info` で UNIQUE index 構成が `(alias_id, stable_key, trigger_key)` と一致
- [ ] 機密値（token / account id / 接続情報）が本ファイルに混入していない

## production への展開（別途 user-gated）

dev→main リリース時に同手順を `--env production` で実行する。`apps/api/migrations/` は forward-only（down migration なし・`d1-schema-migration.md` 81-84 行）のため、apply 前に migrations list で pending 確認を必ず行う。

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production   # user-gated
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production   # user-gated
```
