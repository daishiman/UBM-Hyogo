# Phase 5 出力 — 実装結果

> **2026-06-01 実装レビュー追記**: 初回作成時は `spec_created` の見込み記録だったが、現在のワークツリーには Phase 5 の実コード差分が存在する。本ファイルは実装済み差分の記録として更新する。commit / push / PR / remote migration apply は未実行。

## 1. 変更/新規ファイル（実装済み）

| # | 種別 | パス | 実装内容 |
|---|------|------|------|
| 1 | 新規 | `apps/api/migrations/0023_member_photos_variants.sql` | `thumb_object_key TEXT` / `thumb_byte_size INTEGER` / `content_hash TEXT` / `processing_status TEXT NOT NULL DEFAULT 'none'` を ADD COLUMN |
| 2 | 編集 | `apps/api/src/lib/r2/member-photo-presign.ts` | `MEMBER_PHOTO_THUMB_OBJECT_KEY` / `MEMBER_PHOTO_THUMB_MAX_BYTES`(64KB) / `MemberPhotoVariant` / `MemberPhotoProcessingStatus` を追加（既存 export は byte-identical 維持）|
| 3 | 編集 | `apps/api/src/repository/memberPhotos.ts` | `MemberPhotoRow` + `RawMemberPhotoRow` に 4 列、`getMemberPhoto`/`upsertMemberPhoto` の SQL とマップ拡張 |
| 4 | 編集 | `apps/api/src/routes/admin/members.ts` | POST 多 variant 受領 + 検証 + 両 R2 put + upsert、GET の `photoThumbUrl` マージ、DELETE 両 key |
| 5 | 編集 | `packages/shared/src/zod/viewmodel.ts` + `packages/shared/src/types/viewmodel/index.ts` | `photoThumbUrl?: z.string().url().optional()` / `readonly photoThumbUrl?: string` |
| 6 | 新規 | `apps/web/src/lib/admin/image-resize.ts` | `buildMemberPhotoVariants` |
| 7 | 編集 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | `PhotoUploadAffordance` で variant 生成 → display/thumb/contentHash append、drawer→avatar に `photoThumbUrl` 伝播 |
| 8 | 編集 | `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` | `photoThumbUrl?` prop + size 別 src 選択 |

新規テスト spec（Phase 4/6 で定義）:
- `apps/api/src/repository/__tests__/memberPhotos.spec.ts`（新規）
- `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts`（追記）
- `apps/web/src/lib/admin/__tests__/image-resize.spec.ts`（新規）
- `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx`（追記）
- `packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts`（追記）

## 2. 検証結果

| コマンド | 期待 |
|----------|------|
| `pnpm exec vitest run apps/api/src/repository/__tests__/memberPhotos.spec.ts apps/web/src/lib/admin/__tests__/image-resize.spec.ts apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts` | PASS: 4 files / 39 tests。初回 timeout 後、新規 repo spec の hook timeout を 60s に補正して green。 |
| `pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` | PASS: 1 file / 31 tests。route contract は root unit config では exclude されるため D1 config で実行。 |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS（既存 `PublicConsentCallout.tsx` の stablekey warning 2 件は warning のみ・今回変更外） |

## 3. 後方互換・非破壊の確認観点（実装時チェック）

- 旧 `file` 単一 upload が 200 で受理され `original_fallback` になる（ROUTE-V-3 / ROUTE-R-1）。
- 0023 以前の既存行が detail 200・get 成功（REPO-V-3 / ROUTE-R-2）。
- 既存 photo テスト（ROUTE-C/E・AVATAR-R/E・SCHEMA-P）全 pass。
- migration は ADD COLUMN のみで既存行非破壊。

## 4. user-gated 事項（未実行）

- migration 0023 の D1 apply（`bash scripts/cf.sh d1 migrations apply ...`）。
- staging / production deploy・実 R2 put 検証。
- commit・push・PR・Issue #1030 mutation。

## 5. 結論

実装区分は **実装仕様書**。現在のワークツリーでは Phase 5 の実コード差分が `apps/`, `packages/`, `apps/api/migrations/` に反映済み。残りは targeted vitest 再実行、typecheck/lint、Phase 11 視覚証跡、remote migration/deploy の user-gated 外部操作。
