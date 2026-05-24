# Phase 11 — RAC-2: recompute runtime（resolve → rollback → recompute）

[実装区分: 実装仕様書]

> 目的: staging `/admin/schema` で実 admin actor が dummy alias の **resolve → rollback → recompute** を実行し、(a) `audit_log` に 3 行（`schema_alias.resolve` / `.rollback` / `.recompute`）、(b) `response_fields` が `__extra__:{question_id}` へ復帰、(c) recompute job が `completed` になることを runtime evidence（screenshot + SQL query 結果）で確認する（RAC-2 / AC-1 / AC-3 / AC-4 / TC-RT-03 idempotency）。
> 実行区分: **user-gated**（実 admin 操作 + staging D1 SQL は user 明示承認後のみ）。

## 前提・不変条件

- Cloudflare / D1 操作は **`scripts/cf.sh` 経由のみ**。`wrangler` を直接呼ばない。
- evidence MD に **secret / token / D1 binding 実値・実 PII を記載しない**（不変条件 9）。記録するのは query 文・期待 shape・件数・status 文字列のみ。
- D1 直接アクセスは `apps/api` に閉じる。UI 操作は `/admin/schema` 経由（不変条件 5）。
- migration（RAC-1 / `migration-apply.md`）が staging へ apply 済みであることが前提。
- recompute は rollback 直後に自動実行されない（AC-5）。admin が SchemaDiffPanel の「再集計を実行」ボタンを押下したときのみ起動する。

## テストアカウント

- admin actor: `manjumoto.daishi@senpai-lab.com`（MEMORY: UBM-Hyogo テストアカウント / admin）

## シナリオ手順（staging・user-gated）

### Step 1: dummy alias の resolve（汚染を作る）

1. staging `/admin/schema` を admin actor で開く。
2. 未解決の dummy 項目（例: `__extra__:{questionId}` で残っている差分行）に対し、新しい stableKey（例 `dummy_recompute_target`）を割当（resolve）。
3. resolve 成功で `backfillResponseFields()`（`schemaAliasAssign.ts:192-277`）が `response_fields` を `__extra__:{questionId}` → `dummy_recompute_target` へ書き換える。
4. screenshot: `schema-diff-panel-recompute-idle.png`（この時点では recompute 未表示 or impact なし）。

### Step 2: 同 alias を rollback（取り消すが response_fields は残存）

1. resolve した alias を rollback（undo）する。
2. rollback で alias は soft-deleted、impact `recomputeRequired=true` / `affectedResponseCount` が表示される。
3. **この時点で `response_fields.stable_key` は `dummy_recompute_target` のまま残存**（汚染状態。recompute 未実行）。

### Step 3: recompute を実行（admin 明示・AC-5）

1. impact パネルの `data-role="recompute-trigger"`「再集計を実行」ボタンを押下。
2. submitting → API 応答で `completed`（少件数なら 1 回で完了）。バッジ「再集計済み」+ processedCount 表示。
3. screenshot: `schema-diff-panel-recompute-completed.png`。
4. recompute で `response_fields.stable_key` が `dummy_recompute_target` → `__extra__:{questionId}` へ reverse-backfill される。

## 確認項目（SQL query 文と期待 shape のみ記録・実値非記載）

> `scripts/cf.sh d1 execute ... --command "<SQL>"` で実行。**結果の件数・status・key 形だけを記録**し、PII / token は載せない。

### (a) audit_log 3 行の確認（AC-3）

```sql
SELECT action, COUNT(*) AS n
FROM audit_log
WHERE target_type = 'schema_alias'      -- 実 schema は 11-admin-management.md 準拠
  AND action IN ('schema_alias.resolve', 'schema_alias.rollback', 'schema_alias.recompute')
GROUP BY action;
```

期待 shape:

| action | n |
| --- | --- |
| schema_alias.resolve | 1 |
| schema_alias.rollback | 1 |
| schema_alias.recompute | 1 |

recompute 行の `after_json` に `{ jobId, affectedCount, processedCount, relatedRollbackAuditId }` を含むことを確認（AC-3）。`relatedRollbackAuditId` が Step 2 の rollback audit_id と一致。

```sql
SELECT json_extract(after_json, '$.jobId')                  AS job_id,
       json_extract(after_json, '$.affectedCount')          AS affected,
       json_extract(after_json, '$.processedCount')         AS processed,
       json_extract(after_json, '$.relatedRollbackAuditId') AS related_rollback_audit
FROM audit_log
WHERE action = 'schema_alias.recompute'
ORDER BY created_at DESC LIMIT 1;
```

### (b) response_fields の `__extra__:{question_id}` 復帰（AC-1）

```sql
-- recompute 後: 旧 stableKey が 0 件、__extra__:{qid} が affectedCount 件に復帰
SELECT
  SUM(CASE WHEN stable_key = 'dummy_recompute_target'        THEN 1 ELSE 0 END) AS remaining_old,
  SUM(CASE WHEN stable_key = '__extra__:' || :questionId     THEN 1 ELSE 0 END) AS reverted
FROM response_fields
WHERE stable_key IN ('dummy_recompute_target', '__extra__:' || :questionId);
```

期待: `remaining_old = 0` / `reverted = affectedCount`（Step 1 で resolve した件数と一致）。

### (c) recompute job が completed（AC-4）

```sql
SELECT status, affected_count, processed_count, last_error
FROM schema_alias_recompute_jobs
WHERE alias_id = :aliasId
ORDER BY created_at DESC LIMIT 1;
```

期待 shape: `status = 'completed'` / `last_error IS NULL` / `processed_count = affected_count`。

`GET /api/admin/schema/aliases/:aliasId/recompute` も同 status を返すことを UI / API で確認（AC-4。job 不在時は 200 + null）。

## idempotency runtime 確認（TC-RT-03 / AC-2）

1. Step 3 完了後、同 alias で **recompute をもう一度実行**（completed ボタン再押下 = no-op、または同 triggerKey で再 POST）。
2. server は同一 `(alias_id, stable_key, trigger_key)` の completed job を冪等返却（reverse-backfill を再実行しない）。
3. (b) の query を再実行し、`reverted` 件数が **1 回実行後と不変**（二重変動なし）であることを確認。

```sql
-- 2 回目 recompute 後も件数が変わらないこと
SELECT COUNT(*) AS reverted_after_second_run
FROM response_fields
WHERE stable_key = '__extra__:' || :questionId;
```

期待: `reverted_after_second_run == reverted`（1 回目の値）。`schema_alias_recompute_jobs` の行数も増えない（UNIQUE 制約で 1 job のまま）。

## evidence として記録する項目

> 実行後に追記。**SQL 結果の件数 / status / key 形のみ。PII（実 response 値）・token・接続情報は記載しない。**

```text
## 実行ログ（YYYY-MM-DD・admin actor）
- env: staging / actor: manjumoto.daishi@senpai-lab.com
- Step1 resolve: 成功（affected = N 件 → dummy_recompute_target）
- Step2 rollback: 成功（impact.recomputeRequired = true / affectedResponseCount = N）
- Step3 recompute: job completed / processed = N / affected = N
- audit_log: resolve=1 / rollback=1 / recompute=1（3 行）
- after_json: relatedRollbackAuditId = (Step2 rollback audit と一致)
- response_fields: remaining_old=0 / reverted=N（__extra__:{qid} 復帰）
- idempotency: 2 回目 recompute 後 reverted=N（不変）/ job 行数 1（増えない）
- screenshots: schema-diff-panel-recompute-idle.png / -completed.png
```

## 失敗時 / 補助 state（任意撮影）

- CPU budget exhausted を意図的に起こせる大量 dummy がある場合: `status:"running"` + `schema-diff-panel-recompute-running.png` を撮影（AC-8 runtime 確認）。再押下「再集計を続行」で `completed` まで遷移。
- API error を mock / 強制した場合: `schema-diff-panel-recompute-failed.png` + `recompute-error` 表示を撮影。

## 確認項目（DoD / RAC-2）

- [ ] audit_log に 3 行（resolve / rollback / recompute）（AC-3）
- [ ] recompute 行 `after_json` が 4 キーを含み `relatedRollbackAuditId` が rollback audit と一致
- [ ] `response_fields` が `__extra__:{question_id}` へ復帰（remaining_old=0）（AC-1）
- [ ] recompute job が `completed` / last_error NULL（AC-4）
- [ ] idempotency: 2 回目実行で response_fields・job 行数が不変（AC-2 / TC-RT-03）
- [ ] screenshot canonical 命名と一致（idle / completed・任意で running / failed）
- [ ] secret / token / PII が本ファイルに混入していない
