# スコープ定義 — issue-1030

## 含む（1 実装サイクルで完了 / CONST_007）

- migration `0023_member_photos_variants.sql`
- `member-photo-presign.ts`: thumb key helper + variant 定数/型
- `memberPhotos.ts`: variant メタ列の get/upsert 拡張
- `routes/admin/members.ts`: multipart 複数 variant 受領 + display/thumb presign + delete 両 key
- `packages/shared`: MemberDetail に `photoThumbUrl?`
- `apps/web/src/lib/admin/image-resize.ts`（新規）+ `PhotoUploadAffordance` 配線
- `MemberAvatar` / `MemberDrawer` / members list の thumb 消費
- テスト: API contract / repo / image-resize util / component
- ADR-1030

## 含まない（別レーン・将来送りではない）

| 項目 | 担当 | 理由 |
|------|------|------|
| 公開メンバー表示での thumb 露出 | #1029 | 責務分離（公開 consent/exposure policy） |
| member self upload UX | #1031 | 責務分離（OPEN issue） |
| Google Form schema 変更 | — | #983 invariant と矛盾（実施しない） |
| サーバ/外部画像処理 | — | 無料枠 invariant（ADR で却下） |
| content_hash による R2 dedup | 未タスク候補 M-1 | 本タスクは hash 記録のみ。Phase 12 で未タスク化要否判定 |

## 分離理由の妥当性（CONST_007）

上記「含まない」は分量や時間ではなく **責務境界・無料枠 invariant・別 issue の存在** による分離。本タスク自体（admin variant pipeline）は 1 サイクルで完結する。
