# Phase 1 — 要件定義

> **実装区分: 実装仕様書**。本 Phase は scope / 受入条件 / inventory / 命名規則を固定する。

## 1. 真の論点（1文）

「admin が登録した member photo を、フル解像度 1 枚（≤256KB）のまま全表示サイズへ配信している」非効率を、**無料枠を維持したまま** 表示用 variant 配信へ置き換える。

## 2. P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No（variant 実装ゼロ） | 通常の実装 Phase（`implementation_mode: new`） |
| upstream（dev）にマージ済み | No（#983 基盤のみ dev 済） | 本タスクは未実装として扱う |
| 前提タスク（#983）完了済み | Yes（PR #1038 / `ae773ba38`） | 依存解消済み・差分拡張として設計 |

## 3. 現状コード inventory（実測・命名規則）

| レイヤ | ファイル | 現状 | 命名規則 |
|--------|----------|------|----------|
| migration | `apps/api/migrations/0022_member_photos.sql` | `member_photos(member_id PK, object_key, content_type, byte_size, uploaded_by, uploaded_at)` | snake_case 列 / `NNNN_name.sql` |
| presign | `apps/api/src/lib/r2/member-photo-presign.ts` | `MEMBER_PHOTO_OBJECT_KEY(memberId)=members/{id}/avatar` / `MAX_BYTES=256KB` / `ALLOWED_MIME=[jpeg,png,webp]` / `presignMemberPhotoGetUrl()` / `TTL=300` | UPPER_SNAKE 定数 / camelCase fn |
| repository | `apps/api/src/repository/memberPhotos.ts` | `MemberPhotoRow` / `getMemberPhoto` / `upsertMemberPhoto`（INSERT OR REPLACE）/ `deleteMemberPhoto` | camelCase fn / Raw*Row interface |
| route | `apps/api/src/routes/admin/members.ts` | `resolvePhotoUrl()`（detail に `photoUrl` マージ）/ `POST /members/:memberId/photo`（multipart `file` → R2 put + upsert + audit）/ delete | camelCase / Hono app.post |
| shared | `packages/shared`（MemberDetail viewmodel に `photoUrl?`） | 単一 URL | camelCase / zod `*Z` suffix |
| web | `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` / `MemberDrawer.tsx`（`PhotoUploadAffordance`） | 生 File 送信 / `<Avatar src={photoUrl}>` 全サイズ同一 | PascalCase component / camelCase props |
| 既存テスト | `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` / `MemberAvatar.spec.tsx` | upload/presign/fallback contract | `*.spec.ts(x)`（invariant #8） |

**命名方針（本タスクで踏襲）**: D1 列 = snake_case / TS = camelCase / 定数 = UPPER_SNAKE / variant 識別子 = `thumb` / `display`（kebab/lower）。新規テストは `*.spec.{ts,tsx}` のみ（invariant #8）。

## 4. 受入条件（issue 原文 AC を現コードへ最適化）

| # | issue 原文 AC | 現コード最適化後の受入条件 |
|---|----------------|----------------------------|
| AC-1 | 原本と表示用 variant の保存方針が ADR 化 | Phase 2 ADR で「client が `display`(≤512px webp) を canonical 保存・`thumb`(96px webp cover) を併存保存・サーバ側原本処理なし」を決定・記録 |
| AC-2 | 画像処理方式のコスト/無料枠/失敗時 fallback 比較 | ADR に Cloudflare Images（有料・却下）/ Image Resizing（有料・却下）/ client-side Canvas（無料・採用）の比較表と fallback 設計を記載 |
| AC-3 | `member_photos` metadata に variant 識別情報を追加 | migration 0023 で `thumb_object_key` / `content_hash` / `processing_status` を後方互換 ADD COLUMN |
| AC-4 | admin drawer は avatar 表示に小サイズ variant を使う | `MemberAvatar`(sm/md) / list / drawer header が `photoThumbUrl` を消費。lg は `photoUrl`(display) |
| AC-5 | 処理失敗時も原本または hue placeholder に安全 fallback | thumb 欠落 → display → `<img onError>` で hue placeholder（既存 `Avatar` 挙動）の 3 段 fallback |

## 5. 非機能・不変条件

- **無料枠維持**: サーバ/外部の有料画像処理を導入しない（CPU 課金・Images 課金回避）。Canvas 処理は client。
- invariant #5: R2/D1 は `apps/api` に閉じる。`apps/web` は variant を生成して multipart 送信するのみ。
- invariant #4: variant メタは admin-managed として `member_photos` に分離。
- 後方互換: 既存 key `members/{memberId}/avatar` を display canonical として維持。旧 client（`file` 単一フィールド）からの upload も 503/破壊なく受理（thumb null）。既存 row（新列 NULL）も detail 200 を維持。

## 6. carry-over 確認

直近コミット（`git log --oneline -5`）は #1047/#1048/#991/#1049/#1046 で member photo variant とは無関係。本タスクは #983 基盤への純粋な機能追加で衝突なし。

## 完了条件（Phase 1）

- [x] scope / 受入条件 / inventory / 命名規則を固定
- [x] `implementation_mode: new` を確定
- [x] 出力: [outputs/phase-1/requirements-definition.md](outputs/phase-1/requirements-definition.md) / [acceptance-criteria.md](outputs/phase-1/acceptance-criteria.md) / [scope-definition.md](outputs/phase-1/scope-definition.md)
