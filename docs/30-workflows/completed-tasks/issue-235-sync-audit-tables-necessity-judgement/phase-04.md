# Phase 4: raw evidence 収集（検索戦略）

> 親骨格: NON_VISUAL / 監査タスク用 Phase Template。Phase 3 §1 の再解釈により Phase 4 = raw evidence 収集に固定。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| implementation_mode | verify_existing |
| 前 Phase | 3（設計レビュー：判定再解釈方針固定） |
| 次 Phase | 5（判定確定ランブック） |
| 主成果物 | outputs/phase-04/raw-evidence.md |

## 目的

Phase 2 の確定判定（新設不要）を裏付ける一次証跡を、再現可能な検索コマンドの形で収集・記録する。実装タスクの「実装 RED/GREEN」を、判定タスクでは「判定根拠の raw evidence 収集」に再解釈する。具体的には次の 2 点を rg/grep で実測し、コマンドと raw 出力を 1:1 で記録する。

- `sync_audit_logs` / `sync_audit_outbox` が `apps/` 配下（マイグレーション・実コード）に **存在しない**（docs/skill 参照のみ）こと。
- 現行 ledger 群（`sync_jobs` / `sync_job_logs` / `metrics_json` zod / `notification_outbox` 前例）が `apps/api` 配下に **実在する** こと。

## docs-only / Ownership 宣言

- 本 Phase は検索（read-only）のみを行う。`apps/` / `packages/` / `.claude/` / 他 `docs/` を一切編集しない。
- 検索コマンドは判定の証跡であり、本仕様書では「想定結果」を記録する。実際のコマンド実行による再現確認は Phase 11 で行う（Phase 4 は検索戦略と期待結果の固定が責務）。

## 実行タスク

1. **`sync_audit_*` 非存在の実測**: `apps/` 配下で対象テーブル名を全文検索し、ヒット 0 件を示す。

   ```bash
   rg -n "sync_audit_logs|sync_audit_outbox" apps/
   ```

   期待結果: `apps/` 配下 0 件（exit 1 = no match）。docs/skill 参照のみであることを別表で示す。

2. **`sync_jobs` 定義箇所の棚卸し**: 実コード正本のヒット一覧（ファイル単位）を取得する。

   ```bash
   rg -ln "sync_jobs" apps/api/src apps/api/migrations
   ```

   期待ヒット: `apps/api/migrations/0003_auth_support.sql`（DDL）/ `apps/api/migrations/0002_sync_logs_locks.sql`（`sync_job_logs`）/ `apps/api/src/repository/syncJobs.ts`（lifecycle）/ `apps/api/src/jobs/_shared/sync-jobs-schema.ts`（metrics zod）等。

3. **`metrics_json` zod schema の確認**: 構造化キー定義の所在を確認する。

   ```bash
   rg -n "metricsJsonBaseSchema|metrics_json|assertNoPii|PII_FORBIDDEN_KEYS" apps/api/src/jobs/_shared/sync-jobs-schema.ts
   ```

   期待: `metrics_json` が自由形式 TEXT ではなく zod 構造化 + PII 遮断であることを示すヒット。

4. **`CREATE TABLE` の棚卸し（sync_audit_* 非作成の証明）**: マイグレーション内の全テーブル作成を列挙し、`sync_audit_logs` / `sync_audit_outbox` が **作成されていない** ことを示す。

   ```bash
   grep -rn "CREATE TABLE" apps/api/migrations/*.sql
   ```

   期待: `sync_jobs` / `sync_job_logs` / `sync_locks` / `notification_outbox` 等は作成されるが、`sync_audit_logs` / `sync_audit_outbox` は一切現れない。

5. **`notification_outbox` 前例の確認**: 実需ベース outbox 新設の前例が実在することを確認する。

   ```bash
   rg -ln "notification_outbox|notification_ledger" apps/api/migrations
   ```

   期待: `apps/api/migrations/0014_notification_outbox.sql`。判定で「outbox を一律不要とするのではなく実需ベースで新設する運用」の根拠に使う。

6. **証跡の構造化記録**: 各コマンドに「コマンド / 目的 / raw 結果サマリ / 判定への含意」の 4 列を付して `raw-evidence.md` に記録する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] `sync_audit_logs` / `sync_audit_outbox` の `apps/` 配下 0 件が記録され、docs/skill 参照のみであることが表で示されている
- [ ] `sync_jobs` 定義箇所の実コード正本ヒット一覧が記録されている
- [ ] `metrics_json` zod 構造化・PII 遮断のヒットが記録されている
- [ ] `CREATE TABLE` 棚卸しで `sync_audit_*` 非作成が示されている
- [ ] `notification_outbox` 前例が記録されている
- [ ] 各コマンドに「コマンド / 目的 / raw 結果サマリ / 判定への含意」が付されている
- [ ] 実行による再現確認が Phase 11 に委ねられる旨が注記されている

## 成果物/実行手順

- `outputs/phase-04/raw-evidence.md`
