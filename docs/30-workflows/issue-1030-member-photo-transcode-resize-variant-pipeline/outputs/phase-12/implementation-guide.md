# 実装ガイド — issue-1030 member photo variant pipeline

## Part 1: 中学生にもわかる説明

### なぜ必要か

会員の顔写真を、いまは「大きいサイズの写真 1 枚」だけ保存しています。一覧ページでは小さな丸いアイコンで表示するのに、毎回その大きい写真をまるごとダウンロードしています。

**たとえば**、教室の連絡網で全員の証明写真を配るとき、本当は名簿の横に貼る切手サイズで十分なのに、A4 の大きな写真をクラス全員分配っているようなものです。紙（通信量）がもったいないし、配るのに時間がかかります。

### 何をするか

写真をアップロードするとき、パソコンのブラウザの中で**先に 2 種類に縮小**してから送ります。

- 小さい版（thumb）= 切手サイズ。一覧やパネルの小さいアイコン用。
- 表示版（display）= はがきサイズ。大きく見せるとき用。

こうすると、一覧ページでは切手サイズだけを取りに行くので、軽くて速くなります。しかもこの縮小作業は**自分のパソコンの中で無料でやる**ので、追加のお金（有料サービス）は一切かかりません。

もし縮小がうまくいかない端末でも、元の写真をそのまま送るので**壊れません**。写真が無い・読めないときは、いままで通り色付きの丸（プレースホルダ）が出ます。

### 今回作ったもの

- 13 Phase の実装仕様書。
- display/thumb variant の保存・配信ルール。
- API / DB / shared schema / web UI の実装差分。
- 実装レビュー用の自動テストとスクリーンショット計画。

## Part 2: 技術者向け詳細

### 全体契約

client（admin ブラウザ）の Canvas で `display`(≤512px webp) と `thumb`(96×96 cover webp) を生成 → multipart で API へ送信 → API が R2 へ 2 key 保存 + D1 にメタ記録 → detail で両方を presign 返却 → avatar が表示サイズで variant を選択。サーバ/外部の有料画像処理は使わない（ADR-1030）。

### 型定義（TypeScript）

```ts
// apps/web/src/lib/admin/image-resize.ts（新規）
export interface ResizedVariants {
  readonly display: File;       // ≤512px 長辺 webp
  readonly thumb: File | null;  // 96×96 cover webp（失敗時 null）
  readonly contentHash: string; // display bytes の sha-256 hex
  readonly status: "client_generated" | "original_fallback";
}
export async function buildMemberPhotoVariants(file: File): Promise<ResizedVariants>;

// apps/api/src/lib/r2/member-photo-presign.ts（拡張）
export const MEMBER_PHOTO_THUMB_OBJECT_KEY: (memberId: string) => string; // `members/${id}/thumb`
export const MEMBER_PHOTO_THUMB_MAX_BYTES: number; // 64 * 1024
export type MemberPhotoVariant = "display" | "thumb";
export type MemberPhotoProcessingStatus = "client_generated" | "original_fallback" | "none";

// apps/api/src/repository/memberPhotos.ts（拡張）
export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;            // display(canonical)
  readonly contentType: string;
  readonly byteSize: number;
  readonly thumbObjectKey: string | null;
  readonly thumbByteSize: number | null;
  readonly contentHash: string | null;
  readonly processingStatus: string;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
}
```

### APIシグネチャ

```
POST /admin/members/:memberId/photo  (multipart)
  fields: display:File(必須/旧 file 後方互換), thumb:File?, contentHash:string?
  → { ok: true } | 415 | 413 | 503

GET /admin/members/:memberId
  → { ...detail, photoUrl?: string, photoThumbUrl?: string }
```

### 使用例

```ts
// PhotoUploadAffordance（MemberDrawer.tsx）使用例
const variants = await buildMemberPhotoVariants(file);
const fd = new FormData();
fd.append("display", variants.display);
if (variants.thumb) fd.append("thumb", variants.thumb);
fd.append("contentHash", variants.contentHash);
await upload(fd);

// MemberAvatar（src 選択）
const src = (size === "lg") ? photoUrl : (photoThumbUrl ?? photoUrl);
```

### エラーハンドリング

- Canvas 非対応 / SSR / `convertToBlob` 失敗 → 例外を投げず `original_fallback`（display=原 File, thumb=null）。
- thumb size 超過(>64KB) → 413 相当。display MIME 違反 → 415。R2 binding 無 → 503。
- presign 失敗 → 該当 URL 省略（fail-soft）、detail 本体 200 維持。

### エッジケース

- 旧 client（`file` 単一）upload → display 扱い・thumb なし・`processing_status='original_fallback'`。
- 既存行（migration 0023 以前）→ 新列 NULL / `'none'` で SELECT 200。

### 設定項目と定数一覧

| 定数 | 値 | 用途 |
|------|----|------|
| `MEMBER_PHOTO_MAX_BYTES` | 256KB | display 上限（既存） |
| `MEMBER_PHOTO_THUMB_MAX_BYTES` | 64KB | thumb 上限（新規） |
| display 長辺 | 512px | client resize 目標 |
| thumb | 96×96 cover | client resize 目標 |
| webp quality | 0.82 | convertToBlob 品質 |
| presign TTL | 300s | 既存 |

### テスト構成

| 領域 | テスト |
| --- | --- |
| API repository | `memberPhotos.spec.ts` |
| API route | `member-photo.contract.spec.ts` |
| Web util | `image-resize.spec.ts` |
| Web UI | `MemberAvatar.spec.tsx` |
| Shared schema | `viewmodel-photo.spec.ts` |

### 視覚証跡

VISUAL_ON_EXECUTION。ローカル実装レビューでは Phase 11 の visual harness で `photoThumbUrl` 使用、display fallback、placeholder fallback の状態を撮影する。authenticated staging での実データ撮影は deploy 後の user-gated 外部操作として残る。撮影予定の状態は [../phase-11/screenshot-plan.json](../phase-11/screenshot-plan.json) を参照。

### 実装識別子の現コード整合

`photoUrl` / `resolvePhotoUrls` / `PhotoUploadAffordance` / `MemberAvatar` / `MEMBER_PHOTO_OBJECT_KEY` / `member_photos` は現行コード（`apps/api/src/routes/admin/members.ts`・`apps/api/src/lib/r2/member-photo-presign.ts`・`apps/web/src/features/admin/components/_members/`）に実在。新規識別子（`photoThumbUrl` / `buildMemberPhotoVariants` / `MEMBER_PHOTO_THUMB_OBJECT_KEY` / `thumb_object_key`）も 2026-06-01 実装レビュー時点のワークツリーに追加済み。
