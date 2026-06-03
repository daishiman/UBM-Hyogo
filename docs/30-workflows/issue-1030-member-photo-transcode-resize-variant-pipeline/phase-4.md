# Phase 4 — テスト作成（TDD Red）

> **実装区分: 実装仕様書**。本 Phase は CONST_005（テスト先行）を満たすため、Phase 5 実装前に **fail する** テスト spec を確定する。実コードはこの Phase では書かない（user-gated）。
> テストファイルは `*.spec.{ts,tsx}` のみ（invariant #8）。`*.test.*` は禁止。
> 命名規則: D1 列 = snake_case / TS = camelCase / 定数 = UPPER_SNAKE / variant 識別子 = `display` / `thumb`。

## 0. TDD Red の前提

Phase 5 実装前は次が未存在のため全ケースが fail する想定:

- `apps/api/migrations/0024_member_photos_variants.sql`（新列なし → variant 列 SELECT/INSERT が SQLITE_ERROR）
- `MEMBER_PHOTO_THUMB_OBJECT_KEY` / `MEMBER_PHOTO_THUMB_MAX_BYTES` / `MemberPhotoVariant` / `MemberPhotoProcessingStatus`（未 export → import 解決失敗）
- `MemberPhotoRow.thumbObjectKey` 系 4 列（型未定義）
- route の `display` / `thumb` / `contentHash` multipart 受領（旧 `file` 単一のみ）
- viewmodel `photoThumbUrl`（未定義 → strict reject）
- `apps/web/src/lib/admin/image-resize.ts`（未存在 → import 解決失敗）
- `MemberAvatarProps.photoThumbUrl`（未定義）

実行コマンド: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / API は `pnpm --filter @repo/api test`、web/shared は該当 vitest project。

## 1. repository — variant 列 round-trip

**ファイル**: `apps/api/src/repository/__tests__/memberPhotos.spec.ts`（新規。既存 setupD1 `_setup` を再利用）

| ケース ID | 内容 | 期待値 |
|-----------|------|--------|
| REPO-V-1 | `upsertMemberPhoto` に thumb 系 4 列込み（`thumbObjectKey="members/m1/thumb"` / `thumbByteSize=2048` / `contentHash="<64hex>"` / `processingStatus="client_generated"`）で保存 → `getMemberPhoto` で同値が camelCase で round-trip | 取得行の `thumbObjectKey`/`thumbByteSize`/`contentHash`/`processingStatus` が投入値と一致 |
| REPO-V-2 | thumb なし upsert（`thumbObjectKey=null` / `thumbByteSize=null` / `contentHash=null` / `processingStatus="original_fallback"`）→ get | thumb 系 3 列 `null`・`processingStatus="original_fallback"` |
| REPO-V-3 | **後方互換**: 0022 までの列のみで INSERT した行（`processing_status` は DEFAULT `'none'`、新 thumb 列は NULL）を `getMemberPhoto` | 例外なく取得・`thumbObjectKey===null` / `processingStatus==="none"`、既存 `objectKey`/`contentType`/`byteSize` は不変 |
| REPO-V-4 | 同 memberId に 2 回 upsert（1 回目 thumb 有 → 2 回目 thumb なし）| INSERT OR REPLACE で後勝ち。`processingStatus==="original_fallback"`・`thumbObjectKey===null`・行数 1 |
| REPO-V-5 | `getMemberPhoto` で member 不在 | `null`（既存挙動不変） |

- 検証は raw SQL（`SELECT thumb_object_key, thumb_byte_size, content_hash, processing_status ...`）で snake_case 列を直読みし、repository 戻り値の camelCase マッピングと突合する。
- private/internal state なし（純関数 + D1）。`RawMemberPhotoRow` interface は repository 内部 private のためテストから直接参照しない（戻り型 `MemberPhotoRow` のみ assert）。

## 2. route contract — display+thumb multipart

**ファイル**: `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts`（既存に追記。`FakeR2Bucket` / `makeEnv` / `seedMember` / `presignMock` の既存ヘルパを流用）

新ヘルパ（追記）:
```ts
// display/thumb/contentHash を任意に組み立てる postVariants ヘルパ
const postVariants = async (env, r2, memberId, opts: {
  display?: File; thumb?: File; contentHash?: string; legacyFile?: File;
}) => { /* FormData に display/thumb/contentHash or 旧 file を append し POST */ };
const variantRow = async (env, memberId) =>
  // thumb_object_key, thumb_byte_size, content_hash, processing_status を直読み
```

| ケース ID | 内容 | 期待値 |
|-----------|------|--------|
| ROUTE-V-1 | `display`(jpeg 1KB) + `thumb`(webp 2KB) + `contentHash` → POST | 200 `{ok:true}`・R2 に `members/m_001/avatar` と `members/m_001/thumb` 両 put・`processing_status="client_generated"`・`thumb_object_key="members/m_001/thumb"`・`content_hash` 保存 |
| ROUTE-V-2 | `display` のみ（thumb 省略）→ POST | 200・R2 は avatar のみ（thumb key 不在）・`processing_status="original_fallback"`・`thumb_object_key IS NULL` |
| ROUTE-V-3 | **後方互換**: 旧 `file` 単一フィールドのみ → POST | 200・avatar put・`processing_status="original_fallback"`・thumb 列 null（旧 client 無改修で受理） |
| ROUTE-V-4 | `thumb` が 64KB 超過（65537B）→ POST | 413・**副作用なし**（avatar も put しない・D1 upsert なし・R2 size 0） |
| ROUTE-V-5 | `display` が 256KB 超過（262145B）→ POST | 413・副作用なし（既存 ROUTE-E-12 と整合） |
| ROUTE-V-6 | `thumb` の MIME が不許可（image/gif）→ POST | 415・副作用なし |
| ROUTE-V-7 | `display` 不在かつ旧 `file` も不在 → POST | 400（`file/display field required`）・副作用なし |
| ROUTE-V-8 | GET detail（display+thumb 保存後・presign 成功）| 200・`photoUrl` と `photoThumbUrl` 双方を含む。presignMock が 2 回（display key / thumb key）呼ばれる |
| ROUTE-V-9 | GET detail（display のみ保存・thumb null）| 200・`photoUrl` 有・`photoThumbUrl` undefined。presignMock は display key の 1 回のみ |
| ROUTE-V-10 | GET detail（thumb 保存済だが thumb presign が null を返す）| 200・`photoUrl` 有・`photoThumbUrl` undefined（**fail-soft**・detail は壊れない） |
| ROUTE-V-11 | GET detail（display presign 自体が null）| 200・`photoUrl` undefined・`photoThumbUrl` undefined（既存 fail-soft と整合・detail 200 維持） |
| ROUTE-V-12 | DELETE（display+thumb 保存後）| 200・R2 から avatar と thumb 両 key が削除（`r2.has(avatar)===false`・`r2.has(thumb)===false`）・D1 行削除 |
| ROUTE-V-13 | DELETE（thumb 不在・display のみ）| 200・avatar 削除・thumb delete 呼び出しは best-effort（存在しなくても 200・例外なし） |

- presignMock の呼び分けは `presignMock.mock.calls` の引数（objectKey = `members/m_001/avatar` vs `members/m_001/thumb`）で判定するか、`mockImplementation` で key→URL を返す。
- audit は既存 `admin.member.photo_uploaded` / `photo_deleted` を踏襲。variant 情報は after summary に thumb 有無のみ（signed URL 実値・raw bytes は残さない）を確認するアサートを 1 件含める（ROUTE-V-1 内）。

## 3. web util — client-side variant 生成

**ファイル**: `apps/web/src/lib/admin/__tests__/image-resize.spec.ts`（新規。jsdom project）

対象: `buildMemberPhotoVariants(file: File): Promise<ResizedVariants>`（`{display:File; thumb:File|null; contentHash:string; status:"client_generated"|"original_fallback"}`）。

| ケース ID | 内容 | 期待値 |
|-----------|------|--------|
| RESIZE-U-1 | Canvas/`createImageBitmap`/`OffscreenCanvas`/`crypto.subtle` を全て成功する mock を注入 → 正常 File を変換 | `status==="client_generated"`・`display instanceof File`・`thumb instanceof File`・`contentHash` が 64 桁 hex（`/^[0-9a-f]{64}$/`）・display/thumb の `type==="image/webp"` |
| RESIZE-U-2 | `createImageBitmap` が throw する mock | 例外を投げず `status==="original_fallback"`・`display===` 原 File（参照同一 or 同 bytes）・`thumb===null`・`contentHash` は原 bytes の sha-256（生成可能なら hex、不可なら空でなく fallback 値） |
| RESIZE-U-3 | `convertToBlob` / `toBlob` が null/throw する mock | `original_fallback`・`thumb===null`・例外なし |
| RESIZE-U-4 | **SSR ガード**: `globalThis.document` 未定義（or `typeof document === "undefined"` を模した環境）で呼ぶ | 例外なし・`original_fallback`・`display===` 原 File・`thumb===null` |
| RESIZE-U-5 | `crypto.subtle` 不在環境 | `original_fallback` への degrade か、hash 欠落でも `display` は原 File・例外なし（純粋関数ガード WEEKGRD-02） |
| RESIZE-U-6 | display の長辺が 512 を超える入力（mock bitmap width/height=2000）| drawImage に渡る縮小後寸法の長辺が 512 以内（mock canvas の width/height を assert）。thumb は 96×96 cover |

- 期待される副作用: なし（純粋関数・例外を投げない契約）。internal の Canvas/bitmap は全て mock 化し、jsdom にない `createImageBitmap`/`OffscreenCanvas`/`convertToBlob` は `vi.stubGlobal` で注入する。
- 命名: 戻り値 key は camelCase（`display`/`thumb`/`contentHash`/`status`）。

## 4. component — avatar variant 消費

**ファイル**: `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx`（既存に追記）

`MemberAvatarProps` に `photoThumbUrl?: string` 追加後の src 選択を検証。`<img>` の `src` 属性で判定する。

| ケース ID | 内容 | 期待値 |
|-----------|------|--------|
| AVATAR-V-1 | `size="sm"` + `photoUrl` + `photoThumbUrl` 双方有 → render | `<img src>` が `photoThumbUrl`（sm は thumb 使用） |
| AVATAR-V-2 | `size="md"` + 双方有 → render | `<img src>` が `photoThumbUrl`（md は thumb 使用） |
| AVATAR-V-3 | `size="lg"` + 双方有 → render | `<img src>` が `photoUrl`（lg は display 使用） |
| AVATAR-V-4 | `size="sm"` + `photoUrl` 有・`photoThumbUrl` undefined → render | `<img src>` が `photoUrl`（thumb null 時 display fallback） |
| AVATAR-V-5 | `photoUrl`/`photoThumbUrl` 双方なし（sm）→ render | `<img>` なし・hue placeholder（既存 AVATAR-R-5 と整合） |
| AVATAR-V-6 | sm + `photoThumbUrl` 有で `<img onError>` 発火 → fallback | `<img>` 消え hue placeholder（3 段 fallback の最終段・既存 AVATAR-R-3 挙動を thumb 経由で再確認） |

- private/internal state なし（純粋 render）。`Avatar` の onError→placeholder は既存挙動を踏襲し本テストでは src 選択ロジックのみ新規検証。

## 5. 期待値・命名規則の整合確認

- snake_case（D1）↔ camelCase（TS）の写像は repository テスト（§1）が単一の正本。route/web は camelCase のみ扱う。
- variant 識別子は `display`/`thumb` で全レイヤ統一（form field 名・object key segment・status enum）。
- 全テストは Phase 5 実装前に **fail** すること（import 解決失敗・列不在・型不在）を Red 確認の根拠とする。

## 完了条件（Phase 4）

- [x] repository / route contract / web util / component の追加 spec とケース ID を列挙
- [x] 各ケースの期待値・副作用・命名規則整合・private state 扱いを明記
- [x] `*.spec.{ts,tsx}` のみ（invariant #8）・TDD Red 前提を明記
- [x] 出力: [outputs/phase-4/test-design.md](outputs/phase-4/test-design.md)（実装サイクルで生成）
