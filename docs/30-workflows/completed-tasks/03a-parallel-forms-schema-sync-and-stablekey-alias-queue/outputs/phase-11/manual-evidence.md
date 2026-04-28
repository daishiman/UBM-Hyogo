# 手動 smoke evidence — 03a-parallel-forms-schema-sync-and-stablekey-alias-queue

> **Note**: 本タスクは UI 無し（`ui_routes: []`）のため、API smoke のドライラン evidence として記述する。
> 実 Cloudflare staging 実行は wave 9b（`makeDefaultSchemaSyncDeps` 実装後）で行い、その時点で本ファイルに実値を追記する。
> 本フェーズで確定する一次 evidence は **既存 vitest 194 / 194 PASS**（Phase 5 main.md 参照）。

## 実行日時（dry-run 記述日）
- 2026-04-28（dry-run 手順確定日）
- staging 実機実行予定日: wave 9b 着手時に追記

## 実行者
- Claude Code（dry-run 整理）
- staging 実機実行担当: wave 9b 担当者

---

## A. local 起動手順

```bash
# Node 24 / pnpm 10 を保証
mise install
mise exec -- pnpm install

# D1 (local) migrations
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging --local

# api dev 起動
mise exec -- pnpm --filter @ubm-hyogo-hyogo/api dev
# → http://localhost:8787 で起動
```

---

## B. 同期実行（curl シナリオ）

### B-1. 401 Unauthorized — Authorization header 無し

```bash
curl -i -X POST http://localhost:8787/admin/sync/schema
```

期待 response:

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"error":"unauthorized","message":"missing admin token"}
```

該当実装: `apps/api/src/middleware/admin-gate.ts`

### B-2. 403 Forbidden — 不正 token

```bash
curl -i -X POST http://localhost:8787/admin/sync/schema \
  -H 'Authorization: Bearer invalid-token'
```

期待 response:

```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"error":"forbidden","message":"invalid admin token"}
```

### B-3. 200 OK — 正常同期

```bash
curl -i -X POST http://localhost:8787/admin/sync/schema \
  -H 'Authorization: Bearer dev-admin'
```

期待 response:

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jobId": "<uuid>",
  "status": "succeeded",
  "stats": {
    "questionsTotal": 31,
    "sectionsTotal": 6,
    "diffQueueAdded": 0,
    "schemaVersionCreated": true
  }
}
```

### B-4. 409 Conflict — 同種 job 排他

```bash
# 並列で 2 リクエスト送出
curl -X POST http://localhost:8787/admin/sync/schema -H 'Authorization: Bearer dev-admin' &
curl -X POST http://localhost:8787/admin/sync/schema -H 'Authorization: Bearer dev-admin' &
wait
```

期待:
- 1 つ目: `200 OK` (status=`succeeded`)
- 2 つ目: `409 Conflict`

```json
{ "error": "conflict", "message": "schema_sync already running", "runningJobId": "<uuid>" }
```

該当実装: `apps/api/src/sync/schema/forms-schema-sync.ts`（sync_jobs ledger チェック）

---

## C. D1 row 確認（wrangler）

> 本プロジェクトでは `wrangler` 直接実行を禁じており、`scripts/cf.sh` 経由で実行する。

### C-1. schema_questions 件数 = 31

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --local \
  --command "SELECT count(*) AS cnt FROM schema_questions"
```

期待出力（抜粋）:

```
┌─────┐
│ cnt │
├─────┤
│ 31  │
└─────┘
```

### C-2. schema_versions 件数 = 1（初回）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --local \
  --command "SELECT count(*) AS cnt FROM schema_versions"
```

期待: `1`

### C-3. schema_diff_queue 件数 = 0（既知 31 項目のみのとき）

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --local \
  --command "SELECT count(*) AS cnt FROM schema_diff_queue WHERE status='open'"
```

期待: `0`

### C-4. sync_jobs 遷移確認

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --local \
  --command "SELECT id, kind, status, started_at, finished_at FROM sync_jobs ORDER BY started_at DESC LIMIT 5"
```

期待:
- 直近 1 件: `kind=schema_sync`, `status=succeeded`, `finished_at` が `started_at` より後
- B-4 排他テスト直後の場合: 1 件 `succeeded`, もう 1 件 row 無し（409 で job 作成自体を skip）

---

## D. 一次 evidence: 既存 vitest 結果

```
$ mise exec -- pnpm --filter @ubm-hyogo-hyogo/api test

Test Files  XX passed (XX)
     Tests  194 passed (194)
```

詳細: Phase 5 main.md（typecheck / lint / test 194 / 194 PASS）。

カバー範囲:
- `apps/api/src/sync/schema/flatten.test.ts` — 31 項目・6 セクション flatten
- `apps/api/src/sync/schema/resolve-stable-key.test.ts` — alias 解決 / unresolved 検出
- `apps/api/src/sync/schema/schema-hash.test.ts` — revisionId 重複時 no-op
- `apps/api/src/sync/schema/diff-queue-writer.test.ts` — added/changed/removed/unresolved
- `apps/api/src/sync/schema/forms-schema-sync.test.ts` — 統合（sync_jobs ledger / 排他 / 失敗時 status=failed）
- `apps/api/src/routes/admin/sync-schema.test.ts` — 200 / 401 / 403 / 409 routing
- `apps/api/src/middleware/admin-gate.test.ts`（admin-gate.ts 経由） — token validation

---

## E. 結論

| 検証項目 | 結果 |
| --- | --- |
| ドライラン手順 4 種（401 / 403 / 200 / 409）記述 | PASS |
| row count 3 種（31 / 1 / 0）期待値記述 | PASS |
| sync_jobs 遷移期待値記述 | PASS |
| 一次 evidence（vitest 194 / 194 PASS）参照 | PASS |
| staging 実機実行 | **wave 9b 予定**（dry-run 完了） |

総合判定: **PASS（dry-run）** — 残課題は wave 9b の Cloudflare secrets provisioningのみ。
