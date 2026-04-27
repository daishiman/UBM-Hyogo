# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | d1-database-schema-migrations-and-tag-seed |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 5 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 4 (テスト戦略) |
| 下流 Phase | 6 (異常系検証) |
| 状態 | completed |

## 目的

migration apply / rollback / seed の手順を runbook 化、SQL placeholder と sanity check を順序付きで確定する。

## 実行タスク

1. apply / rollback step を 6 段階で確定
2. SQL placeholder（DDL + INSERT）を runbook に組み込み
3. 各 step に sanity check 付与
4. outputs/phase-05/migration-runbook.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | DDL |
| 必須 | outputs/phase-04/migration-tests.md | sanity command |

## 実行手順

### ステップ 1: step 一覧
1. wrangler.toml binding 確定
2. D1 database 作成（Cloudflare Dashboard or `wrangler d1 create`）
3. migration ファイル配置（4 本）
4. local apply
5. remote apply
6. seed 検証

### ステップ 2: SQL placeholder
### ステップ 3: sanity 付与
### ステップ 4: outputs

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 各 step の失敗ケース |
| Phase 11 | manual smoke で実行 |

## 多角的チェック観点（不変条件参照）

- **#5**: apps/web/wrangler.toml に D1 binding を追加しないことを runbook 末尾に再警告
- **#10**: apply 後に `wrangler d1 info` で usage 確認

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | step 一覧 | 5 | completed | 6 step |
| 2 | SQL placeholder | 5 | completed | 4 file |
| 3 | sanity | 5 | completed | 各 step |
| 4 | outputs | 5 | completed | outputs/phase-05/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook 総合 |
| ドキュメント | outputs/phase-05/migration-runbook.md | apply / rollback |
| メタ | artifacts.json | Phase 5 を completed |

## 完了条件

- [ ] 6 step すべて command + sanity 確定
- [ ] DDL placeholder 4 本確定

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-05/main.md と migration-runbook.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 6
- 引き継ぎ事項: 失敗ケース → 異常系
- ブロック条件: runbook 未完成

## Migration Runbook

### Step 1: wrangler.toml binding

```toml
# apps/api/wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-db-staging"
database_id = "REPLACE"
migrations_dir = "migrations"
```

**sanity**: `grep -c "d1_databases" apps/web/wrangler.toml` → 0（不変条件 #5）

### Step 2: D1 database 作成

```bash
wrangler d1 create ubm-hyogo-db-staging
# 出力された database_id を wrangler.toml に書き戻す
```

**sanity**: `wrangler d1 list | grep ubm-hyogo-db-staging` で 1 行

**失敗時**: Cloudflare account 認証 (`wrangler login`)

### Step 3: migration ファイル配置

`apps/api/migrations/` 配下に 4 ファイル:
- `0001_init.sql`（form-driven 8 テーブル + INDEX）
- `0002_admin_managed.sql`（admin-managed 8 + INDEX）
- `0003_auth_support.sql`（admin_users / magic_tokens / sync_jobs）
- `0004_seed_tags.sql`（41 行 INSERT）

**sanity**: `ls apps/api/migrations/*.sql | wc -l` → 4

### Step 4: local apply

```bash
wrangler d1 migrations apply ubm-hyogo-db-staging --local
```

**sanity**:
```bash
wrangler d1 execute ubm-hyogo-db-staging --local --command \
  "SELECT name FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name;"
# 20 physical tables + 1 view の期待 name set を確認
```

**失敗時**: SQL syntax error → `wrangler d1 execute --file=migrations/0001_init.sql --local` で個別 reproduce

### Step 5: remote apply（CI / 手動）

```bash
wrangler d1 migrations apply ubm-hyogo-db-staging --remote
```

**sanity**: 同上の SELECT を `--remote` で実行

**失敗時**: 部分 apply 検出 → `wrangler d1 migrations list ubm-hyogo-db-staging` で済 / 未済確認

### Step 6: seed 検証

```bash
wrangler d1 execute ubm-hyogo-db-staging --local --command \
  "SELECT category, COUNT(*) FROM tag_definitions GROUP BY category;"
# 期待: 6 行
```

**sanity**: 6 カテゴリ × 件数（business/skill/interest/region/role/status）

## Rollback 戦略

migration の down は spec 段階では「新 migration を追加して `DROP TABLE`」方針。`wrangler d1` には down ファイルがないため、`9999_rollback_<purpose>.sql` を別途作る。

```sql
-- 例: 0099_rollback_seed.sql
DELETE FROM tag_definitions WHERE category IN ('business','skill','interest','region','role','status');
```

実装フェーズで作成。本タスクでは方針記載のみ。

## 擬似コード（D1 binding consumption）

```ts
// apps/api/src/db.ts (placeholder, 02a/b/c で実装)
import type { D1Database } from "@cloudflare/workers-types";
export type Env = { DB: D1Database };
export const getDb = (env: Env) => env.DB;
```
