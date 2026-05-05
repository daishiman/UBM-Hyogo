# Phase 5: 仕様 runbook 作成（migration / rollback / API contract）

## メタ情報

| 項目 | 値 |
| ---- | ---- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 仕様 runbook 作成 |
| 作成日 | 2026-05-01 |
| 前 Phase | 4（検証戦略） |
| 次 Phase | 6（異常系） |
| 状態 | spec_created |
| タスク分類 | implementation（runbook） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 で確定した設計を運用手順書として正本化する。本 Phase は 3 成果物に分割する:

1. **migration-runbook.md**: partial UNIQUE index 追加 + `schema_diff_queue` への `backfill_cursor` / `backfill_status` カラム追加 migration 手順 + 既存データ衝突事前検出 SQL
2. **rollback-runbook.md**: migration 失敗時 / 衝突解消失敗時 / back-fill 中断時の rollback 手順
3. **api-contract-update.md**: `backfill_cpu_budget_exhausted` を含む retryable failure の HTTP contract 正本（`aiworkflow-requirements/references/api-endpoints.md` への差分）

実 migration / route 実装は Phase 8〜11 で行う。本 Phase は手順書のみを確定する。

## 完了条件チェックリスト

- [ ] `migration-runbook.md` に下記が含まれる:
  - 既存データ衝突事前検出 SQL
  - partial UNIQUE index DDL
  - `schema_diff_queue` カラム追加 DDL
  - 適用順序（衝突検出 → 解消 → partial UNIQUE → cursor カラム追加）
  - UT-04 との順序関係（独立適用可）
- [ ] `rollback-runbook.md` に下記が含まれる:
  - partial UNIQUE index 追加失敗時の DROP INDEX 手順
  - 衝突行の手動マージ / `unknown` 戻し手順
  - back-fill 中断時の `backfill_status='failed'` セット手順 + 監査 log への経緯記録
  - production / staging で手順を分けるガード（`scripts/cf.sh` 経由のみ）
- [ ] `api-contract-update.md` に下記が含まれる:
  - 5 ケース HTTP contract（200 / 202 in_progress / 202 exhausted / 409 / 422）
  - `aiworkflow-requirements/references/api-endpoints.md` への差分スニペット
  - `database-schema.md` への `backfill_cursor` / `backfill_status` カラム追加スニペット
  - `response_fields` カラム不在（`questionId` / `is_deleted`）の差分吸収方針（AC-6 連動）
- [ ] 各 runbook に「本タスクでは手順書化のみ。実 migration / 実装は後続 Phase」の明示

## 実行タスク

1. `migration-runbook.md` を起草する（完了条件: 検出 SQL + DDL + 適用順序 + UT-04 順序関係）。
2. `rollback-runbook.md` を起草する（完了条件: index DROP / 衝突行マージ / back-fill failed セット の 3 シナリオ）。
3. `api-contract-update.md` を起草する（完了条件: 5 ケース contract + `api-endpoints.md` / `database-schema.md` 差分）。
4. AC-6（実 DB schema 差分吸収方針）を `api-contract-update.md` に明示する。
5. runbook 末尾に「本タスクでは実行しない」（Phase 8 以降で実装）の明示を追加する。

## migration runbook 構成

### Step 0: 適用前チェック（既存データ衝突検出）

production / staging のいずれでも、以下 SQL を **migration 適用前に必ず実行**する。

```sql
-- 既存確定 stable_key の重複検出（同一 revision 内）
SELECT revision_id, stable_key, COUNT(*) AS dup_count
FROM schema_questions
WHERE stable_key IS NOT NULL
  AND stable_key != 'unknown'
  AND stable_key NOT LIKE '__extra__:%'
GROUP BY revision_id, stable_key
HAVING COUNT(*) > 1;
```

- 結果 0 件: Step 1 へ進む。
- 結果 ≥ 1 件: rollback-runbook.md §「既存データ衝突解消」を先に適用してから Step 1 へ進む。

### Step 1: partial UNIQUE index 追加

`apps/api/migrations/00NN_schema_questions_partial_unique.sql`（次番号は実装時確定）

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_schema_questions_revision_stablekey_unique
  ON schema_questions (revision_id, stable_key)
  WHERE stable_key IS NOT NULL
    AND stable_key != 'unknown'
    AND stable_key NOT LIKE '\_\_extra\_\_:%' ESCAPE '\\';
```

適用コマンド（production / staging いずれも `scripts/cf.sh` 経由）:

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

### Step 2: `schema_diff_queue` への cursor / status カラム追加

`apps/api/migrations/00NN_schema_diff_queue_backfill_cursor.sql`

```sql
ALTER TABLE schema_diff_queue ADD COLUMN backfill_cursor TEXT NULL;
ALTER TABLE schema_diff_queue ADD COLUMN backfill_status TEXT NULL
  CHECK (backfill_status IS NULL
    OR backfill_status IN ('pending','in_progress','completed','exhausted','failed'));
```

> SQLite/D1 は `ALTER TABLE ADD COLUMN` で CHECK 句付与可能。Step 1 と独立に適用可能。

### Step 3: 適用順序契約

| 順序 | migration | 失敗時の挙動 |
| --- | --- | --- |
| 1 | Step 0 検出 SQL（read only） | 衝突あり → rollback runbook §「既存データ衝突解消」を先に適用 |
| 2 | Step 1 partial UNIQUE | 失敗時は SQLITE_CONSTRAINT で migration 全体が abort（自動 rollback） |
| 3 | Step 2 cursor カラム追加 | 失敗時は ALTER TABLE 単発失敗（rollback runbook §「カラム追加失敗」） |

### Step 4: UT-04 との順序関係

UT-04（D1 物理スキーマ実装）は `schema_questions` / `response_fields` の追加カラム / CHECK 制約変更を扱う可能性がある。本 migration は **UT-04 と独立適用可能**。両 migration の適用順序に依存関係はない（partial UNIQUE は既存カラムに対する index 追加のみ、cursor カラム追加は `schema_diff_queue` のみ）。ただし両者を同 PR で適用する場合は、本 migration → UT-04 migration の順で apply することを推奨（partial UNIQUE のほうが衝突リスクが低いため）。

## rollback runbook 構成

### A. partial UNIQUE index 追加失敗時

```sql
DROP INDEX IF EXISTS idx_schema_questions_revision_stablekey_unique;
```

→ 状態は migration 適用前に戻る。`audit_log` に DROP INDEX 実行を記録。

### B. 既存データ衝突解消（Step 0 で衝突検出された場合）

1. 衝突行を全件 export:
   ```sql
   SELECT id, revision_id, stable_key, question_id, created_at
   FROM schema_questions
   WHERE (revision_id, stable_key) IN (
     SELECT revision_id, stable_key FROM schema_questions
     WHERE stable_key IS NOT NULL AND stable_key != 'unknown' AND stable_key NOT LIKE '__extra__:%'
     GROUP BY revision_id, stable_key HAVING COUNT(*) > 1
   ) ORDER BY revision_id, stable_key, id;
   ```
2. 各衝突セットを以下のいずれかで解消:
   - **A. 一方を `unknown` に戻す**（暫定状態への退避）:
     ```sql
     UPDATE schema_questions SET stable_key = 'unknown' WHERE id = <該当 id>;
     ```
   - **B. 一方を `__extra__:<questionId>` に書き換え**（暫定キーへの退避）:
     ```sql
     UPDATE schema_questions SET stable_key = '__extra__:' || question_id WHERE id = <該当 id>;
     ```
   - **C. 一方を物理削除**（admin 判断で revision 内重複の片方が誤入力と確定した場合のみ）。
3. 各操作を `audit_log` に経緯記録（`action='alias_collision_manual_resolution'`、`metadata` に before/after の stable_key）。
4. Step 0 検出 SQL を再実行し 0 件確認 → Step 1 へ。

### C. `schema_diff_queue` カラム追加失敗時

```sql
-- ALTER TABLE DROP COLUMN は SQLite で限定サポート（D1 では基本不可）
-- 失敗した場合の rollback はテーブル再作成を推奨:
BEGIN;
CREATE TABLE schema_diff_queue_new AS SELECT <元カラム一覧> FROM schema_diff_queue;
DROP TABLE schema_diff_queue;
ALTER TABLE schema_diff_queue_new RENAME TO schema_diff_queue;
COMMIT;
```

> 通常 ADD COLUMN は失敗しないため、このケースは disk full / lock 競合に限定したレアな状況のみ。

### D. back-fill 中断時（runtime レベル rollback）

- `schema_diff_queue.backfill_status='failed'` をセットし、`backfill_cursor` を保持（次回 manual resume の起点）。
- `audit_log` に `action='backfill_failed'`, `metadata={ error, cursor, updated_count }` を記録。
- 復旧手順: 原因解消後に同 payload で `POST /admin/schema/aliases` を再実行。`cursor` を起点に残件のみ走査（idempotent）。
- 連続失敗（3 回以上 `failed`）が続く場合は queue / cron 分離 follow-up タスクを起票。

### E. 本番 / staging のガード

- すべての rollback 操作は **`scripts/cf.sh` 経由のみ**。`wrangler` 直接実行は禁止（CLAUDE.md 規約）。
- 本番適用は production-D1 binding 確認後（`scripts/cf.sh d1 list` で先頭一致確認）に実施。

## API contract update 構成

### 1. 5 ケース HTTP contract（正本）

`POST /admin/schema/aliases?dryRun=<bool>`

| ケース | HTTP | response body 抜粋 |
| --- | --- | --- |
| dryRun preview（衝突なし） | 200 | `{ "preview": { "alias": {...} }, "wouldUpdate": <n> }` |
| dryRun preview（衝突あり） | 200 | `{ "preview": { "alias": {...} }, "collisions": [...] }` |
| apply 完全成功 | 200 | `{ "alias": {...}, "backfill": { "status": "completed", "updated": <n> } }` |
| apply alias 確定 + 継続中 | 202 | `{ "alias": {...}, "backfill": { "status": "in_progress", "cursor": "<id>", "updated": <n>, "remaining_estimate": <n> } }` |
| apply alias 確定 + CPU 枯渇 | 202 | `{ "alias": {...}, "backfill": { "status": "exhausted", "cursor": "<id>", "updated": <n>, "code": "backfill_cpu_budget_exhausted", "retryable": true } }` |
| apply collision | 409 | `{ "code": "stable_key_collision", "revision_id": "...", "stable_key": "..." }` |
| validation エラー | 422 | `{ "code": "invalid_request", "details": [...] }` |

### 2. `aiworkflow-requirements/references/api-endpoints.md` への差分

```diff
 ### POST /admin/schema/aliases
- - 200: 同期適用完了
+ - 200: dryRun preview（副作用なし）または apply 完全成功（`backfill.status='completed'`）
+ - 202: apply alias 確定 + back-fill 継続中 / CPU budget 枯渇（`backfill.status='in_progress' | 'exhausted'`、`retryable: true`）
+ - 409: stable_key collision（`code: 'stable_key_collision'`）
+ - 422: validation エラー（`code: 'invalid_request'`）
+ - retryable failure: `backfill_cpu_budget_exhausted`（同一 payload の再実行で残件のみ処理 = idempotent）
```

### 3. `aiworkflow-requirements/references/database-schema.md` への差分

```diff
 ### schema_questions
+ - UNIQUE INDEX (partial): (revision_id, stable_key)
+   WHERE stable_key IS NOT NULL AND != 'unknown' AND NOT LIKE '__extra__:%'

 ### schema_diff_queue
+ - backfill_cursor TEXT NULL    -- back-fill の進捗 cursor (response_fields.id)
+ - backfill_status TEXT NULL    -- pending | in_progress | completed | exhausted | failed
```

### 4. AC-6: 実 DB schema 差分吸収方針

`response_fields` には `questionId` / `is_deleted` カラムが**存在しない**。本タスクではカラム追加を行わず、以下の方針を維持する:

- questionId 由来の back-fill 対象キーは `key = '__extra__:<questionId>'` リテラル一致で識別
- soft delete は `member_id NOT IN (SELECT id FROM deleted_members)` JOIN で除外
- 上記方針を `aiworkflow-requirements/references/database-schema.md` の `response_fields` セクションに「実 schema 差分吸収」として明記

### 5. 仕様語 ↔ 実装語対応表

| 仕様語 | TS 実装語 | SQL リテラル |
| --- | --- | --- |
| backfill_status: pending | `'pending'` | `'pending'` |
| backfill_status: in_progress | `'in_progress'` | `'in_progress'` |
| backfill_status: completed | `'completed'` | `'completed'` |
| backfill_status: exhausted | `'exhausted'` | `'exhausted'` |
| backfill_status: failed | `'failed'` | `'failed'` |
| failure code: backfill_cpu_budget_exhausted | `'backfill_cpu_budget_exhausted'` | - |
| failure code: stable_key_collision | `'stable_key_collision'` | - |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-02.md` | base case 設計 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-04.md` | テストケース連結 |
| 必須 | `apps/api/migrations/*.sql` | 既存物理スキーマ |
| 必須 | `apps/api/src/routes/admin/schema.ts` | 現行 route 実装（更新対象） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | API contract 同期更新対象 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | D1 schema 同期更新対象 |
| 参考 | CLAUDE.md § Cloudflare 系 CLI 実行ルール | `scripts/cf.sh` 経由必須 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/migration-runbook.md | 検出 SQL + partial UNIQUE DDL + cursor カラム DDL + 適用順序 + UT-04 順序関係 |
| ドキュメント | outputs/phase-05/rollback-runbook.md | DROP INDEX / 衝突行マージ / back-fill failed セット / `scripts/cf.sh` ガード |
| ドキュメント | outputs/phase-05/api-contract-update.md | 5 ケース HTTP contract + `api-endpoints.md` / `database-schema.md` 差分 + AC-6 差分吸収 + 仕様語対応表 |
| メタ | artifacts.json | Phase 5 状態の更新 |

## 多角的チェック観点

- **2 段階順序**: 検出 SQL → 衝突解消 → partial UNIQUE 追加の順序が逆転不可な形で記述されているか。
- **不変条件 #5**: 全 SQL / コマンドが `apps/api/**` + `scripts/cf.sh` 経由で完結し、`apps/web` から D1 を触る経路を含まないか。
- **rollback の実行可能性**: SQLite/D1 で `ALTER TABLE DROP COLUMN` が制限される事実を踏まえた手順になっているか。
- **AC-6 整合**: `response_fields` カラム不在の差分吸収が `__extra__:%` + `deleted_members` JOIN で一貫しているか。
- **`scripts/cf.sh` ガード**: production / staging いずれも `wrangler` 直接実行を含まないか。
- **idempotent 接続**: rollback D（back-fill failed）の手順が Phase 4 idempotent retry と矛盾しないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | migration-runbook.md 起草 | 5 | pending | 検出 SQL + DDL + 順序 |
| 2 | rollback-runbook.md 起草 | 5 | pending | 4 シナリオ（A〜D）+ ガード（E） |
| 3 | api-contract-update.md 起草 | 5 | pending | 5 ケース + 差分 + AC-6 + 対応表 |
| 4 | UT-04 順序関係明示 | 5 | pending | 独立適用可 |
| 5 | `scripts/cf.sh` ガード明示 | 5 | pending | wrangler 直接禁止 |
| 6 | 「本タスクでは実行しない」明示 | 5 | pending | Phase 8 以降で実装 |

## タスク 100% 実行確認【必須】

- 全実行タスク（5 件）が `spec_created` へ遷移
- 3 成果物（migration / rollback / api-contract）すべてが `outputs/phase-05/` 配下に配置
- 既存データ衝突検出 SQL が migration runbook に記述
- rollback 手順 4 シナリオ（A: index DROP / B: 衝突解消 / C: カラム追加失敗 / D: back-fill failed）が網羅
- 5 ケース HTTP contract が api-contract-update に確定
- artifacts.json の `phases[4].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 6（異常系）
- 引き継ぎ事項:
  - migration 適用順序（検出 → 解消 → partial UNIQUE → cursor カラム）
  - rollback 4 シナリオ
  - 5 ケース HTTP contract
  - AC-6 差分吸収方針（`response_fields` カラム不在）
  - `scripts/cf.sh` 経由必須ガード
- ブロック条件:
  - 既存衝突検出 SQL 欠落
  - rollback 手順が SQLite/D1 制約を踏まえていない
  - HTTP contract 5 ケースのいずれかが欠落
  - AC-6 差分吸収方針が `database-schema.md` 差分に反映されていない

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow integration test に接続する。
- D1 物理制約、`schema_aliases` write target、back-fill retry、NON_VISUAL evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
