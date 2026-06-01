# Phase 5 — 実装

> **実装区分: 実装仕様書**。本 Phase は変更/新規ファイル・差分方針・シグネチャ・後方互換・実行順序・DoD を確定する。
> **実装は user-gated。この Phase 仕様の承認後に着手する。SubAgent / 本フローではコードを書かない。**
> 不変条件: #5（R2/D1 は apps/api に閉じる）/ #4（admin-managed 分離）/ 無料枠（client-side Canvas）/ #8（`*.spec.*` のみ）/ #10（admin mutation は `@/features/admin/hooks/useAdminMutation` 経由）。

## 1. 変更/新規ファイル一覧（実行順序）

| # | 種別 | パス | 概要 |
|---|------|------|------|
| 1 | 新規 | `apps/api/migrations/0023_member_photos_variants.sql` | thumb/hash/status 列を後方互換 ADD COLUMN |
| 2 | 編集 | `apps/api/src/lib/r2/member-photo-presign.ts` | thumb key 定数・thumb 上限・variant/status 型を追加 |
| 3 | 編集 | `apps/api/src/repository/memberPhotos.ts` | `MemberPhotoRow` 4 列追加・get/upsert SQL 拡張 |
| 4 | 編集 | `apps/api/src/routes/admin/members.ts` | POST 多 variant 受領・GET で photoThumbUrl・DELETE 両 key |
| 5 | 編集 | `packages/shared`（zod viewmodel + types） | `photoThumbUrl?` 追加 |
| 6 | 新規 | `apps/web/src/lib/admin/image-resize.ts` | `buildMemberPhotoVariants` |
| 7 | 編集 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | `PhotoUploadAffordance` で variant 生成 → multipart append |
| 8 | 編集 | `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` | `photoThumbUrl?` prop・size 別 src 選択 |

実装は **migration → presign → repo → route → shared → web util → component** の順（下流が上流の型/契約に依存するため）。

## 2. ファイル別差分方針

### 2-1. migration `0023_member_photos_variants.sql`（新規）
```sql
ALTER TABLE member_photos ADD COLUMN thumb_object_key  TEXT;
ALTER TABLE member_photos ADD COLUMN thumb_byte_size   INTEGER;
ALTER TABLE member_photos ADD COLUMN content_hash      TEXT;
ALTER TABLE member_photos ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'none';
```
- 全列 nullable または DEFAULT 付き = 既存行非破壊（SQLite `ADD COLUMN` は再書き込みなし）。apply は user-gated。

### 2-2. presign `member-photo-presign.ts`（編集・追加のみ）
```ts
export const MEMBER_PHOTO_THUMB_OBJECT_KEY = (memberId: string): string =>
  `members/${memberId}/thumb`;
export const MEMBER_PHOTO_THUMB_MAX_BYTES = 64 * 1024; // 65536
export type MemberPhotoVariant = "display" | "thumb";
export type MemberPhotoProcessingStatus =
  | "client_generated" | "original_fallback" | "none";
```
- 既存 `MEMBER_PHOTO_OBJECT_KEY` / `MEMBER_PHOTO_MAX_BYTES`(256KB) / `presignMemberPhotoGetUrl` 本体は **不変**（追加のみ・byte-identical 維持）。

### 2-3. repository `memberPhotos.ts`（編集）
- `MemberPhotoRow` に `thumbObjectKey: string | null` / `thumbByteSize: number | null` / `contentHash: string | null` / `processingStatus: string` を追加。
- `RawMemberPhotoRow`（private）に `thumb_object_key` / `thumb_byte_size` / `content_hash` / `processing_status` を追加。
- `getMemberPhoto`: SELECT に 4 列追加 + snake_case→camelCase マップ。
- `upsertMemberPhoto`: INSERT OR REPLACE のカラム/プレースホルダを拡張。引数は `Omit<MemberPhotoRow, "uploadedAt">`。thumb 系 null 許容。
  - 入出力: 副作用 = D1 書込のみ。戻り値 `void`。例外は上位 route が catch しない（既存方針）。
- `deleteMemberPhoto`: 変更なし。

### 2-4. route `admin/members.ts`（編集）

**GET `/members/:memberId`（`resolvePhotoUrl` 拡張）**
- `resolvePhotoUrl` を display key + thumb key 双方を presign する形へ拡張（または別 helper `resolvePhotoThumbUrl` を追加）。
  - display → `photoUrl`（既存・後方互換）。
  - `photo.thumbObjectKey` が非 null のときのみ thumb key を presign → `photoThumbUrl`。
  - 各 presign は独立 fail-soft（片方 null でももう片方は返る）。detail は常に 200。
- merge: `{ ...parsed.data, ...(photoUrl ? {photoUrl} : {}), ...(photoThumbUrl ? {photoThumbUrl} : {}) }`。

**POST `/members/:memberId/photo`（多 variant・後方互換）**
- 受領: `formData.get("display")`（File・必須）/ `get("thumb")`（File・任意）/ `get("contentHash")`（string・任意）。
  - **後方互換**: `display` 不在で旧 `file` が在れば `file` を display 扱い・thumb なし。両方不在は 400。
- 検証順（既存パターン踏襲）: MIME（display は `MEMBER_PHOTO_ALLOWED_MIME`）→ display サイズ（0 で 400 / `> MEMBER_PHOTO_MAX_BYTES` で 413）。thumb 在れば MIME（`MEMBER_PHOTO_ALLOWED_MIME`・違反 415）+ `> MEMBER_PHOTO_THUMB_MAX_BYTES` で 413。**検証失敗時は R2 put / D1 upsert を一切行わない**（副作用ゼロ）。
- R2 put: display → `MEMBER_PHOTO_OBJECT_KEY`、thumb 在れば → `MEMBER_PHOTO_THUMB_OBJECT_KEY`。`MEMBER_PHOTOS` 未 bind は 503。
- D1 upsert: `processingStatus = thumb 有 ? "client_generated" : "original_fallback"`・`contentHash = contentHash ?? null`・`thumbObjectKey = thumb 有 ? key : null`・`thumbByteSize = thumb 有 ? bytes : null`。
- audit: 既存 action 踏襲。`after` summary に thumb 有無（`hasThumb: boolean`）のみ追加し signed URL / raw bytes は残さない。

**DELETE `/members/:memberId/photo`**
- display + thumb（`photo.thumbObjectKey` 在れば）両 R2 key を delete（thumb は best-effort・例外で 500 にしない）。D1 行削除は既存通り。audit 既存踏襲。

### 2-5. shared（編集）
- `packages/shared/src/zod/viewmodel.ts` の `AdminMemberDetailViewZ` に `photoThumbUrl: z.string().url().optional()` を `photoUrl` の隣に追加（`.strict()` 維持・後方互換）。
- `packages/shared/src/types/viewmodel/index.ts` の `AdminMemberDetailView` interface に `readonly photoThumbUrl?: string;` を追加。
- root barrel（`@ubm-hyogo/shared` export 経路）は変更不要（既存 re-export に追従）。

### 2-6. web util `image-resize.ts`（新規）
```ts
export interface ResizedVariants {
  readonly display: File;
  readonly thumb: File | null;
  readonly contentHash: string;
  readonly status: "client_generated" | "original_fallback";
}
export async function buildMemberPhotoVariants(file: File): Promise<ResizedVariants>;
```
- 実装: `createImageBitmap(file)` → `OffscreenCanvas`（fallback `document.createElement("canvas")`）→ `drawImage` で長辺 512 / 96×96 cover → `convertToBlob({type:"image/webp",quality:0.82})`（fallback `canvas.toBlob`）→ `new File([blob], name, {type:"image/webp"})`。`crypto.subtle.digest("SHA-256", displayBytes)` を hex 化。
- ガード: `typeof document === "undefined"`（SSR）/ API 不在 / 変換 throw / blob null は **例外を投げず** `original_fallback`（display=原 File・thumb=null）を返す（WEEKGRD-02 純粋関数ガード）。hash 不能時も display は原 File を維持。
- 入出力: 入力 File 不変（非破壊）・副作用なし。

### 2-7. component
- `MemberDrawer.tsx` `PhotoUploadAffordance` の `mutationFn`: `const v = await buildMemberPhotoVariants(payload as File); fd.append("display", v.display); if (v.thumb) fd.append("thumb", v.thumb); fd.append("contentHash", v.contentHash);` に置換。`useAdminMutation` 経由（invariant #10）は維持。drawer は `detail.photoThumbUrl` を `MemberAvatar` に渡す。
- `MemberAvatar.tsx`: props に `readonly photoThumbUrl?: string`。size `sm`/`md` → `src = photoThumbUrl ?? photoUrl`、`lg` → `src = photoUrl`。`Avatar` の `<img onError>`→hue placeholder は既存挙動を維持。

## 3. 後方互換（明記）

- 旧 `file` 単一フィールド upload を受理（thumb なし・`original_fallback`）。
- 0023 以前の既存行（新列 NULL / status `none`）も detail 200・get 成功。
- 既存 key `members/{id}/avatar` を display canonical として維持（key 変更なし）。
- 既存テスト（ROUTE-C-1..10 / ROUTE-E-1..12 / AVATAR-R/E / SCHEMA-P）は全て pass を維持（追加のみ・破壊なし）。

## 4. 検証コマンド・DoD

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
pnpm --filter @repo/api test     # api（route + repository contract）
# web / shared は該当 vitest project（image-resize / MemberAvatar / viewmodel-photo）
```

**DoD**:
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green（HEX 直書きなし・`process.env` 直参照なし）
- [ ] Phase 4 の全 spec が pass（Red→Green）
- [ ] 既存 photo 関連テスト 全 pass（回帰なし）
- [ ] migration 0023 が既存行非破壊（ADD COLUMN のみ）

> migration apply / staging deploy / 実 R2 put は user-gated。本 Phase ではコードを書かない。

## 完了条件（Phase 5）

- [x] 変更/新規ファイル一覧（種別付き）・差分方針・シグネチャ・入出力・副作用・エラーハンドリング
- [x] 後方互換（旧 file / 既存行 / 既存 key）を明記
- [x] 実行順序・検証コマンド・DoD・user-gated 明記
- [x] 出力: [outputs/phase-5/implementation-result.md](outputs/phase-5/implementation-result.md)
