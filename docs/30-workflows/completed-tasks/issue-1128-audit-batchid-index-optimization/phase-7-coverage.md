# Phase 7: カバレッジ確認（変更行限定）

> [Feedback BEFORE-QUIT-002] coverage は変更したブロックに限定する。全件 coverage は対象外。

## 1. coverage 対象範囲（限定）

| 対象 | ファイル | 範囲 |
| --- | --- | --- |
| batchId 検索分岐 | `apps/api/src/repository/auditLog.ts` | `listFiltered` の `if (filters.batchId)` 分岐（切替後の `add("batch_id = ?", ...)` 行）。 |
| append 相関列書込（方式B採用時のみ） | `apps/api/src/repository/auditLog.ts` | `append` 内の `correlationId` 算出 + INSERT bind 追加行。方式A採用時は対象外（generated column のため write コードなし）。 |
| 0026 migration | `apps/api/migrations/0026_audit_log_batchid_index.sql` | 列追加 / index 作成 /（方式B時）backfill UPDATE が適用され、index 走査・既存行ヒットで実行が検証されること（SQL は line coverage 計測対象外のため、TC-01/TC-01b/TC-02 の PASS をもって被覆とみなす）。 |

## 2. 全件対象外の明記

- `auditLog.ts` の他関数（`listRecent` / `listByActor` / `listByTarget` / `listForExport` / export manifest 系）は本タスクで変更しないため coverage 目標の対象外。
- `apps/api` 全体カバレッジ・他 repository / route は対象外。

## 3. 変更関数の line / branch coverage 実測の残し方

[Feedback 5] に従い、広域比率ではなく変更ブロックの実測値を証跡に残す。

```bash
# D1 group の coverage を auditLog.ts に絞って計測
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  --coverage \
  --coverage.include="apps/api/src/repository/auditLog.ts" \
  apps/api/src/repository/__tests__/auditLog.repository.spec.ts \
  apps/api/migrations/__tests__/0026_audit_log_batchid_index.spec.ts
```

証跡として記録する数値（Phase 7 実行時に埋める）:

| 対象ブロック | line coverage | branch coverage | 担保テスト |
| --- | --- | --- | --- |
| `listFiltered` batchId 分岐 | （実測値）% | （実測値）% | TC-03（after/before 両方向）/ TC-04（NULL 除外）/ 既存 batchId 3 ケース |
| `append` 相関列書込（方式B時） | （実測値）% | （実測値）% | TC-05（write-path）/ TC-03 |
| 0026 migration 適用経路 | N/A（SQL） | N/A（SQL） | TC-01 / TC-01b / TC-02（PASS で被覆） |

> branch coverage の重点: batchId 分岐の真（指定あり）/ 偽（未指定）、方式B の `append` における `after.batchId ?? before.batchId ?? null` の 3 分岐（after あり / before あり / 両 NULL）。TC-03 + TC-04 + TC-05 で全分岐を踏む設計。

## 4. DoD

- [ ] 変更ブロックの line / branch coverage 実測値を表に記入した。
- [ ] batchId 分岐の真偽両方、（方式B時）相関列算出の 3 分岐がテストで踏まれていることを確認した。
- [ ] 全件 coverage は対象外である旨を本書に明記した（記入済み）。
