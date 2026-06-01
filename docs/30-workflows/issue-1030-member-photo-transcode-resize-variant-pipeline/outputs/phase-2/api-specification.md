# API 仕様 — issue-1030（既存 endpoint 拡張・新設なし）

## POST /admin/members/:memberId/photo（multipart 拡張）

| フィールド | 型 | 必須 | 説明 |
|-----------|----|------|------|
| `display` | File | ○（後方互換: 不在なら旧 `file`） | ≤512px webp。`MEMBER_PHOTO_ALLOWED_MIME` / `≤256KB` |
| `thumb` | File | ✕ | 96×96 webp。`≤64KB`（`MEMBER_PHOTO_THUMB_MAX_BYTES`） |
| `contentHash` | string | ✕ | display bytes の sha-256 hex |

- 後方互換: `display` 不在で `file` 在 → `file` を display 扱い・thumb なし・`processing_status='original_fallback'`。
- レスポンス: `{ ok: true }`（既存踏襲）。MIME 違反 415 / size 超過 413 / R2 binding 無 503。
- 副作用: R2.put(display), R2.put(thumb?), D1 upsert, audit。

## GET /admin/members/:memberId（detail 拡張）

- 既存 `photoUrl`（display presigned）に加え、thumb 在れば `photoThumbUrl`（thumb presigned）を merge。
- presign 失敗は各 fail-soft（該当キー省略）。detail 本体 200 維持。

```ts
interface MemberDetailResponse {
  // ...existing...
  photoUrl?: string;       // display presigned（後方互換）
  photoThumbUrl?: string;  // thumb presigned（新規・optional）
}
```

## DELETE（既存）

- R2 display + thumb 両 key delete（thumb best-effort）+ D1 行削除。

## presign 定数/関数（`apps/api/src/lib/r2/member-photo-presign.ts`）

```ts
export const MEMBER_PHOTO_THUMB_OBJECT_KEY = (memberId: string) => `members/${memberId}/thumb`;
export const MEMBER_PHOTO_THUMB_MAX_BYTES = 64 * 1024;
export type MemberPhotoVariant = "display" | "thumb";
export type MemberPhotoProcessingStatus = "client_generated" | "original_fallback" | "none";
// presignMemberPhotoGetUrl(): 既存のまま（key 汎用引数）
```
