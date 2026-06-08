# Phase 11: 手動テスト（NON_VISUAL）

## NON_VISUAL 宣言

- **タスク種別**: NON_VISUAL（API only / `apps/web` 非接触）
- **非視覚的理由**: 本タスクは `apps/api` の repository 関数追加と `DELETE /admin/tags/:tagId/physical` への `?migrateTo` query 分岐追加のみで、UI（`apps/web`）を一切変更しない。描画される画面が存在しないため screenshot は取得しない。
- **代替証跡**: focused D1 Vitest（repository + endpoint contract）、`@ubm-hyogo/api` typecheck、repo lint の実測結果を一次証跡とする。

## 証跡メタ情報（Feedback 4 準拠）

| 項目 | 内容 |
|------|------|
| 証跡の主ソース | `apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts` / `apps/api/src/routes/admin/tags.contract.spec.ts`（強制移行 + AC-7 regression ケース） |
| screenshot を作らない理由 | UI 非接触の API 専用タスク（NON_VISUAL）。描画対象なし |
| 実施区分 | **implemented_local_evidence_captured**。local 実装と focused D1 Vitest 実測を本サイクルで完了。staging runtime / production mutation / commit / push / PR は user-gated |

## focused D1 Vitest 実測

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.write.repository.spec.ts \
  apps/api/src/routes/admin/tags.contract.spec.ts
```

Result: PASS。2 files / 25 tests passed（`tagDefinitions.write.repository.spec.ts`: 11 tests、`tags.contract.spec.ts`: 14 tests）。

| ID | 観点 | 結果 |
|----|------|------|
| TC-FM-1 | `migrateTo` 指定で src 参照を dest へ全件移行 | PASS。src 参照 0、dest 集約 |
| TC-FM-2 | `(member_id, dest)` PK 衝突を吸収 | PASS。`INSERT OR IGNORE` + source delete で重複なし |
| TC-FM-3 | 移行後 src 参照 0 で物理削除成功 | PASS。`tag_definitions` から src 消滅、204 |
| TC-FM-4 | 移行先 not_found | PASS。404 `migration_target_not_found`、移行/削除なし |
| TC-FM-5 | 移行先 非 active | PASS。409 `migration_target_inactive`、移行/削除なし |
| TC-FM-6 | `src===dest` | PASS。400 `migration_target_same_as_source`、移行/削除なし |
| TC-FM-7 | `migrateTo` 前後空白 | PASS。trim 後の tag id で移行成功し、audit の `dest` も正規化済み |
| TC-AC7-1 | `migrateTo` 未指定 + 参照あり | PASS。409 `tag_has_references`（issue-1070 既存挙動・退化なし） |
| TC-AC7-2 | `migrateTo` 未指定 + 参照なし | PASS。204 物理削除（既存挙動） |
| TC-AUDIT-1 | 移行 + 削除の audit 2 件 | PASS。`admin.tag.references_migrated` + `admin.tag.physically_deleted` |

## source-level 確認（spec 段階）

| 確認 | 結果 |
|------|------|
| 強制移行が実装済みであること | PASS（`migrateMemberTagReferences` / `forceMigrateAndPhysicalDeleteTagDefinition` / `admin.tag.references_migrated` / `migration_target_*` が `apps/api` と正本 spec に存在） |
| 既存 409 拒否経路の所在 | PASS（`migrateTo` 未指定時の `tag_has_references` contract test で退化なし） |
| `member_tags` FK 不在 | PASS（`migrations/0002_admin_managed.sql:43-51`） |

> 環境ブロッカー（esbuild mismatch 等）と source-level 判定は分離記録する（WEEKGRD-01）。本タスクの local focused D1 evidence は取得済み。staging runtime smoke と production mutation は user-gated。
