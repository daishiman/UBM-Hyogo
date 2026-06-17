# Phase 12 — system spec update summary

**[実装区分: 実装 / 状態: implemented_local_evidence_captured]**

新規インターフェースの追加有無と、system spec（`specs/*.md`）への影響を記録する。

## 結論

- **API surface 変更なし**。`apps/api/src/routes/admin/identity-conflicts.ts` のエンドポイント / レスポンス shape / `packages/shared` の identity-conflict 型は不変。
- Step 2 判定 = **新規 UI 表現層 helper のみ・API surface 変更なし**。
- system spec（`docs/00-getting-started-manual/specs/*.md`）への追記は不要（API/型/D1 不変・新規 endpoint なし）。

## 新規インターフェース（UI 表現層 / testing seed 層のみ・実装済み）

| 種別 | 識別子 | パス | シグネチャ / 役割 | throw |
| --- | --- | --- | --- | --- |
| 純データ | `MATCHED_FIELD_LABELS` | `apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts` | `Record<string, string>`（`name→氏名` / `affiliation→職業`） | しない |
| 純関数 | `matchedFieldLabel` | 同上 | `(field: string) => string`（未登録は原文 fallback） | しない |
| component | `IdentityConflictGuide` | `apps/web/src/components/admin/IdentityConflictGuide.tsx` | ページ冒頭の 3 点平易説明（presentational） | しない |
| 純関数 | `buildIdentityConflictSeedSql` | `apps/api/src/testing/identity-conflicts/build-seed-sql.ts` | `(catalog?) => string`（apply SQL） | しない |
| 純関数 | `buildIdentityConflictCleanupSql` | `apps/api/src/testing/identity-conflicts/build-seed-sql.ts` | `(catalog?) => string`（cleanup SQL） | しない |
| 純データ | identity-conflicts catalog（5 ペア SSOT） | `apps/api/src/testing/identity-conflicts/catalog.ts` | 重複ペア定義 | — |

> いずれも UI 表現層 / testing seed 層に閉じる。ランタイム API・D1 schema・state machine には影響しない。

## API/型 不変の確認方針（実装済み）

```bash
git diff -- apps/api/src/routes apps/api/src/repository apps/api/src/services packages/shared
# concern 4 の apps/api/src/testing と migrations/seed を除き空であること（AC-8）
```

## same-wave system spec sync

- 該当なし（implemented_local_evidence_captured・API/型/D1 schema 不変）。本サイクルで system spec 更新は不要と判定済み。
- ただし workflow registration / active guide / index / artifact inventory は aiworkflow-requirements 側へ同一 wave で同期済み。
