# Phase 5 成果物: 実装ランブック — forms-schema-sync-and-stablekey-alias-queue

Phase 2 設計に基づき `apps/api/src/sync/schema/**` を実装し、`POST /admin/sync/schema` と cron `0 18 * * *` UTC (03:00 JST) を配線した。

---

## 1. 実装ファイル一覧

| パス | 役割 |
| --- | --- |
| `apps/api/src/sync/schema/index.ts` | re-export のみのエントリ |
| `apps/api/src/sync/schema/types.ts` | `FlatQuestion` / `RunResult` / `SchemaSyncEnv` / `ConflictError` / `SyncIntegrityError` |
| `apps/api/src/sync/schema/flatten.ts` | RawForm.items[] → FlatQuestion[] / `countSections()` |
| `apps/api/src/sync/schema/schema-hash.ts` | itemId 昇順正規化 + SHA-256 hex |
| `apps/api/src/sync/schema/resolve-stable-key.ts` | alias（D1 既存 stable_key）優先 → known map → unknown の 3 段階 |
| `apps/api/src/sync/schema/diff-queue-writer.ts` | 同 questionId で queued 既存があれば INSERT skip |
| `apps/api/src/sync/schema/forms-schema-sync.ts` | runSchemaSync 本体（ledger / fetch / flatten / upsert / diff queue） |
| `apps/api/src/middleware/admin-gate.ts` | Bearer SYNC_ADMIN_TOKEN ベースの最小 admin gate |
| `apps/api/src/routes/admin/sync-schema.ts` | `POST /admin/sync/schema` ルート（depsFactory 注入対応） |
| `apps/api/src/index.ts` | route 配線 + cron `0 18 * * *` UTC (03:00 JST) 分岐 |

---

## 2. 既存ファイルへの追加

| ファイル | 変更 |
| --- | --- |
| `apps/api/src/repository/schemaQuestions.ts` | `findStableKeyByQuestionId(ctx, questionId)` を追加（alias 解決源） |
| `apps/api/src/index.ts` | `adminSyncSchemaRoute` を `/admin` 配下に追加。`scheduled()` で `cron === "0 18 * * *"` のとき `runSchemaSync` を呼ぶ |
| `apps/api/package.json` | `@ubm-hyogo/integrations-google` を dependency に追加。`test` script を追加 |
| `vitest.config.ts` | `testTimeout` / `hookTimeout` を 30000ms に統一（Miniflare 起動コスト対応） |

---

## 3. 不変条件 / AC 適合まとめ

| 項目 | 担保箇所 |
| --- | --- |
| #1 stableKey 直書き禁止 | sync モジュール内に literal なし。known map は `mapFormSchema` 経由で動的構築し、`STABLE_KEY_LIST` でフィルタ |
| #5 apps/api 限定 | sync は全部 `apps/api/src/sync/schema/` 配下、apps/web import なし |
| #6 GAS 排除 | Forms API + Workers のみ、GAS 由来コード参照なし |
| #10 無料枠 | cron 1 日 1 回、retry は forms client backoff 上限内 |
| #14 schema 集約 | diff queue は `schema_diff_queue` テーブルに集約 |
| AC-6 排他 | `syncJobs.findLatest('schema_sync')` で running 検知 → ConflictError → 409 |
| AC-7 lint | grep 静的確認、Phase 8 で ESLint custom rule 化を予定 |

---

## 4. 検証コマンド結果

```bash
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api typecheck   # PASS
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api lint        # PASS（typecheck 同等）
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api test        # 194/194 PASS
```

---

## 5. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | runbook 章立て | completed（sync-runbook.md） |
| 2 | 擬似コード作成 | completed（pseudocode.md） |
| 3 | sanity check 列挙 | completed |
| 4 | local dev 手順 | completed（sync-runbook.md 章 7） |
| 5 | outputs 分離 | completed |
