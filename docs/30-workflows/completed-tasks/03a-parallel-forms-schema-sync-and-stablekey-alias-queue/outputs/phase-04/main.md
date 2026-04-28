# Phase 4 成果物: テスト戦略 — forms-schema-sync-and-stablekey-alias-queue

Phase 1 の AC-1〜AC-8 と Phase 3 の R-1〜R-9 を入力に、unit / contract / E2E / authorization の 4 区分で test を設計する。

---

## 1. テスト分類サマリ

| 区分 | 対象 | 主担当 |
| --- | --- | --- |
| unit | flatten / resolveStableKey / schemaHash / diffQueueWriter / runSchemaSync | 本タスク（apps/api 単体） |
| contract | `POST /admin/sync/schema` のレスポンス schema、`schema_versions` / `schema_questions` / `schema_diff_queue` row の column 充足 | 本タスク（Hono `app.request` + Miniflare D1） |
| authorization | 401 / 403 / 500 / 200 / 409 の 5 ケース | 本タスク（adminGate middleware） |
| E2E | `/admin/schema` UI から手動同期 → 一覧反映 → 模擬新規 question 追加 → 再同期で +1 | **Wave 8b 委譲** |

---

## 2. fixture 設計

実装位置: `apps/api/tests/fixtures/forms-get.ts`

| fixture 名 | 目的 | items 数 |
| --- | --- | --- |
| `FORMS_GET_31_ITEMS` | AC-1 / AC-4 / AC-5 / AC-8 の正常系。31 質問 + 6 sectionHeader を持つ RawForm | 31 + 6 |
| `FORMS_GET_WITH_UNKNOWN` | AC-2 の unresolved 投入。1 件を未知 label に差し替え | 31 + 6 |
| `FORMS_GET_REVISION_BUMPED` | revisionId のみ更新、items 同一 | 31 + 6 |

---

## 3. Phase 4 → Phase 5 引き継ぎ

- 各 fixture は `RawForm`（packages/integrations-google）型に揃え、stableKey を直書きしない。
- `D1` は `apps/api/src/repository/__tests__/_setup.ts` の Miniflare ベース `setupD1()` を流用する。
- testTimeout は 30000ms（Miniflare 起動 + migration の初回コスト）に統一する。

---

## 4. authorization テスト

| ケース | 期待 status | 検証手段 |
| --- | --- | --- |
| Authorization 未指定 | 401 | adminGate が `unauthorized` を即返却 |
| 不一致 Bearer（一般会員相当） | 403 | adminGate が `forbidden` を返却 |
| `SYNC_ADMIN_TOKEN` 未設定 | 500 | adminGate が configuration error を返却 |
| 一致 Bearer + 通常 | 200（jobId / status / upserted） | runSchemaSync 成功 |
| 一致 Bearer + 同種 running | 409（status='conflict'） | ConflictError → route が 409 |

---

## 5. test 実行結果（Phase 5 実装後）

- `mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api typecheck`: PASS
- `mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api lint`: PASS（typecheck 同等）
- `mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api test`: 194/194 PASS

---

## 6. AC × test 対応サマリ（詳細は test-matrix.md）

| AC | 主要 test | 結果 |
| --- | --- | --- |
| AC-1 | flatten.test / forms-schema-sync.test「31 項目・6 セクション保存」 | green |
| AC-2 | diff-queue-writer.test / forms-schema-sync.test「未知 → diff queue 1 件」 | green |
| AC-3 | resolve-stable-key.test「alias 優先採用」 | green |
| AC-4 | forms-schema-sync.test「同 revisionId 再実行 no-op」 | green |
| AC-5 | forms-schema-sync.test / sync-schema route「sync_jobs 遷移」 | green |
| AC-6 | sync-schema route 「同種 running は 409」 | green |
| AC-7 | sync モジュール内に stableKey リテラル無し（grep 静的検証） | green |
| AC-8 | forms-schema-sync.test「stable_key='unknown' が 0 件」 | green |

---

## 7. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | unit test 列挙 | completed |
| 2 | contract test 列挙 | completed |
| 3 | authz test 設計 | completed |
| 4 | fixture 設計 | completed |
| 5 | test matrix 出力 | completed（test-matrix.md） |
