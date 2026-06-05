# Phase 11 手動テスト結果 — tag master reactivate + physical delete

**[実装区分: implementation / implemented_local_evidence_captured / NON_VISUAL]**

## 成果物

reactivate + physical delete は `apps/api` の NON_VISUAL API 変更として local 実装済み。Phase 11 は screenshot ではなく、focused D1 Vitest、API typecheck、repo lint、grep gate を一次証跡とする。

## NON_VISUAL 宣言

本タスクは `apps/api` の admin tag lifecycle endpoint 追加であり、UI/UX 変更を含まない（`apps/web` 非接触）。視覚的差分は存在しないため Phase 11 screenshot は **n/a**。

## 1. focused D1 Vitest

実行コマンド:

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

結果: **PASS（2 files / 15 tests）**

| spec | tests | 主な確認 |
|------|-------|----------|
| `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` | 6 PASS | create/update/deactivate 既存回帰、reactivate idempotency、`countMemberTagReferences`、参照あり physical delete 409 相当、参照0 physical delete、code 解放 |
| `apps/api/src/routes/admin/tags.contract.spec.ts` | 9 PASS | CRUD 既存回帰、logical delete + member_tags 保持、`POST /tags/:tagId/reactivate` audit、`DELETE /tags/:tagId/physical` 409 `tag_has_references` + referenceCount、成功時 audit |

## 2. typecheck / lint

| 検証 | コマンド | 結果 |
|------|---------|------|
| API typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| repo lint | `mise exec -- pnpm lint` | PASS |

## 3. 実装確認

| 対象 | 状態 |
|------|------|
| `apps/api/src/repository/tagDefinitions.ts` | `reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition` + `PhysicalDeleteTagDefinitionResult` 追加済み |
| `apps/api/src/routes/admin/tags.ts` | `POST /tags/:tagId/reactivate` / `DELETE /tags/:tagId/physical` 追加、audit action union 拡張、`tag_has_references:409` 追加済み |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | reactivate / physical delete endpoint + 参照ガード不変条件 + logical/physical の code 占有差を同期済み |

## 4. User-Gated 境界

staging deploy / runtime smoke / wrangler tail / **physical delete の staging・production mutation** / commit / push / PR / Issue #1070 状態変更は **user-gated** で未実行。Issue #1070 は **CLOSED 維持**（reopen しない・PR 作成時も `Refs #1070`）。
