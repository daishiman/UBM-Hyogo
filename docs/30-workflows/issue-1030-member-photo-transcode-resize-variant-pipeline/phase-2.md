# Phase 2 — 設計（ADR 含む）

> **実装区分: 実装仕様書**。topology / 関数シグネチャ / データ構造 / variant key / fallback を確定する。

## 0. ADR-1030: 画像処理方式の決定（AC-1 / AC-2）

### 決定

**client-side Canvas resize（admin ブラウザでアップロード前に variant 生成）を採用する。**

### 比較

| 方式 | 無料枠適合 | 失敗時 fallback | 判定 |
|------|-----------|-----------------|------|
| Cloudflare Images | ✗ 有料（保存・配信課金） | service 障害時に配信不可 | **却下**（`specs/08-free-database.md` 無料枠 invariant 違反） |
| Cloudflare Image Resizing（Workers transform / `cdn-cgi/image`） | ✗ 有料プラン必須 | origin fetch fallback | **却下**（同上） |
| client-side Canvas resize | ✓ 完全無料（処理は client、R2 put のみ） | Canvas 失敗時は原 File を display として送信 | **採用** |

### 帰結

- サーバ CPU / 外部 API 課金ゼロ。R2 は put/get のみ（egress 無料）。
- 保存方針: `display`(≤512px 長辺 webp) を canonical（既存 key 維持）、`thumb`(96×96 cover webp) を併存。サーバ側で原本を別保持しない（client が縮小済みを送る）。
- `processing_status` は client 生成のため主に `client_generated`。Canvas 不可時は `original_fallback`（display=原 File、thumb なし）。

## 1. variant key 設計（後方互換）

```
display(canonical): members/{memberId}/avatar      ← 既存 key 維持（後方互換の要）
thumb:              members/{memberId}/thumb        ← 新規 key（avatar prefix と衝突しない兄弟 key）
```

- `presignMemberPhotoGetUrl` の `encodeURIComponent(...).replace(/%2F/g,"/")` は両 key で同一挙動。`avatar` と `thumb` は別セグメントで prefix 衝突なし（`avatar@thumb` のような同セグメント派生は取り違えリスクがあるため不採用）。
- delete は両 key を削除（orphan 防止）。

### 新規定数・関数（`apps/api/src/lib/r2/member-photo-presign.ts`）

```ts
export const MEMBER_PHOTO_THUMB_OBJECT_KEY = (memberId: string): string =>
  `members/${memberId}/thumb`;

/** variant 別 byte 上限。thumb は小さいので display と分ける。 */
export const MEMBER_PHOTO_THUMB_MAX_BYTES = 64 * 1024;   // 65536
// MEMBER_PHOTO_MAX_BYTES（既存 256KB）= display 上限として継続

/** variant 種別。 */
export type MemberPhotoVariant = "display" | "thumb";

/** processing status。 */
export type MemberPhotoProcessingStatus =
  | "client_generated"   // client Canvas で display+thumb を生成
  | "original_fallback"  // Canvas 不可 → 原 File を display として保存・thumb なし
  | "none";              // 既存行（0023 以前）/ 未設定
```

`presignMemberPhotoGetUrl()` 本体は変更しない（key を引数で受ける汎用のまま）。route 層が display/thumb 双方を presign する。

## 2. migration `0024_member_photos_variants.sql`（AC-3）

```sql
-- 0024_member_photos_variants.sql
-- issue-1030: member photo display/thumb variant metadata（client-side 生成）
-- invariant #4: Google Form schema 外データを admin-managed として分離。
-- 後方互換: 全列 nullable / DEFAULT 付きで ADD COLUMN（既存行は NULL/default を維持）。
ALTER TABLE member_photos ADD COLUMN thumb_object_key  TEXT;
ALTER TABLE member_photos ADD COLUMN thumb_byte_size   INTEGER;
ALTER TABLE member_photos ADD COLUMN content_hash      TEXT;
ALTER TABLE member_photos ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'none';
```

- SQLite の `ALTER TABLE ADD COLUMN` は非破壊。`NOT NULL DEFAULT 'none'` で既存行も整合。
- `object_key`（display）/ `content_type` / `byte_size` は既存列を display 用として継続使用。
- `content_hash` = display 原 bytes の sha-256 hex（cache-busting / 将来の dedup 用、本タスクでは記録のみ）。

## 3. repository 拡張（`apps/api/src/repository/memberPhotos.ts`）

```ts
export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;            // display(canonical)
  readonly contentType: string;
  readonly byteSize: number;
  readonly thumbObjectKey: string | null; // 追加
  readonly thumbByteSize: number | null;  // 追加
  readonly contentHash: string | null;    // 追加
  readonly processingStatus: string;      // 追加（'none'|'client_generated'|'original_fallback'）
  readonly uploadedBy: string;
  readonly uploadedAt: string;
}
```

- `getMemberPhoto`: SELECT に 4 列追加。Raw 行の snake_case → camelCase マップ。
- `upsertMemberPhoto`: INSERT OR REPLACE のカラム/プレースホルダを拡張。引数 `Omit<MemberPhotoRow,"uploadedAt">`。thumb 系 null 許容。
- `deleteMemberPhoto`: 変更なし（D1 行削除）。R2 側 thumb 削除は route 層。

## 4. route 拡張（`apps/api/src/routes/admin/members.ts`）

### 4.1 GET detail（`resolvePhotoUrl`）

- display key を presign → `photoUrl`（既存・後方互換）。
- `photo.thumbObjectKey` が非 null なら thumb key を presign → `photoThumbUrl`（新規・optional）。
- presign 失敗は各々 fail-soft（undefined）。detail は 200 維持。

```ts
// 返却 merge（擬似）
const photoUrl = await presign(display);
const photoThumbUrl = photo.thumbObjectKey ? await presign(thumb) : undefined;
return c.json({ ...parsed.data, ...(photoUrl ? { photoUrl } : {}), ...(photoThumbUrl ? { photoThumbUrl } : {}) }, 200);
```

### 4.2 POST `/members/:memberId/photo`（multipart 拡張・後方互換）

- 受領フィールド: `display`（File・必須）/ `thumb`（File・任意）/ `contentHash`（string・任意）。
  - **後方互換**: `display` 不在で旧 `file` が在る場合は `file` を display として扱い thumb なし（`processing_status='original_fallback'`）。
- 検証: display は `MEMBER_PHOTO_ALLOWED_MIME` かつ `≤ MEMBER_PHOTO_MAX_BYTES`(256KB)。thumb は `image/webp` 想定だが ALLOWED_MIME 許容かつ `≤ MEMBER_PHOTO_THUMB_MAX_BYTES`(64KB)。違反は 415/413 相当（既存パターン踏襲）。
- R2 put: display → `MEMBER_PHOTO_OBJECT_KEY`、thumb 在れば → `MEMBER_PHOTO_THUMB_OBJECT_KEY`。`MEMBER_PHOTOS` binding 無は 503。
- D1 upsert: `processing_status = thumb 有 ? 'client_generated' : 'original_fallback'`。`content_hash = contentHash ?? null`。
- audit: 既存 audit action 踏襲（variant 情報は summary に thumb 有無のみ・signed URL 実値は残さない）。

### 4.3 DELETE

- display + thumb 両 R2 key を delete（thumb は best-effort）。D1 行削除は既存通り。

## 5. shared schema（`packages/shared`）

- MemberDetail viewmodel zod に `photoThumbUrl: z.string().url().optional()` を追加（既存 `photoUrl?` の隣）。root barrel は触らず既存 export 経路に追従（invariant: 既存 `@ubm-hyogo/shared` 経路）。

## 6. web: client-side variant 生成（`apps/web/src/lib/admin/image-resize.ts` 新規）

```ts
export interface ResizedVariants {
  readonly display: File;            // ≤512px 長辺 webp
  readonly thumb: File | null;       // 96×96 cover webp（生成失敗時 null）
  readonly contentHash: string;      // display bytes の sha-256 hex
  readonly status: "client_generated" | "original_fallback";
}

/**
 * 入力 File をブラウザ Canvas で display/thumb webp へ変換する。
 * Canvas / OffscreenCanvas / createImageBitmap が使えない、または変換失敗時は
 * 原 File を display としてそのまま返し status='original_fallback'（例外を投げない）。
 */
export async function buildMemberPhotoVariants(file: File): Promise<ResizedVariants>;
```

- 実装方針: `createImageBitmap(file)` → `OffscreenCanvas`（fallback: `document.createElement('canvas')`）→ `drawImage` で長辺 512 / 96 cover → `canvas.convertToBlob({type:'image/webp',quality:0.82})` → `File`。`crypto.subtle.digest('SHA-256', displayBytes)` で hash。
- SSR/非対応環境ガード: `typeof document === 'undefined'` 等で original_fallback。
- 純粋関数ガード方針（WEEKGRD-02）: 例外を投げず fallback 値を返す。

### `PhotoUploadAffordance`（`MemberDrawer.tsx`）配線

```ts
const variants = await buildMemberPhotoVariants(file);
const formData = new FormData();
formData.append("display", variants.display);
if (variants.thumb) formData.append("thumb", variants.thumb);
formData.append("contentHash", variants.contentHash);
upload(formData);
```

## 7. web: avatar variant 消費（AC-4）

- `MemberAvatarProps` に `photoThumbUrl?: string` 追加。
- size `sm`/`md`（list 行・drawer header の小 avatar）→ `src = photoThumbUrl ?? photoUrl`。
- size `lg`（拡大表示）→ `src = photoUrl`（display）。
- `MemberDrawer` / members list が `detail.photoThumbUrl` を渡す。

## 8. fallback チェーン（AC-5）

```
thumb 要求(sm/md): photoThumbUrl → (null) photoUrl → (<img onError>) hue placeholder
display 要求(lg):  photoUrl → (<img onError>) hue placeholder
```

`Avatar` の既存 `<img onError>` → hue placeholder は維持。本タスクは src 選択を多段化するのみ。

## 9. 状態所有権

| 関心 | 所有 |
|------|------|
| variant 生成 | client（`image-resize.ts`） |
| variant 保存・presign | `apps/api`（R2 + D1 + route） |
| variant 識別メタ | D1 `member_photos`（admin-managed） |
| 表示サイズ→variant 選択 | `MemberAvatar`（UI） |

## 完了条件（Phase 2）

- [x] ADR-1030 決定・比較表・帰結
- [x] variant key / migration DDL / 関数シグネチャ / route 契約 / shared schema / web util / fallback を確定
- [x] 出力: [outputs/phase-2/architecture-design.md](outputs/phase-2/architecture-design.md) / [api-specification.md](outputs/phase-2/api-specification.md) / [database-schema.md](outputs/phase-2/database-schema.md) / [adr-1030-image-processing.md](outputs/phase-2/adr-1030-image-processing.md)
