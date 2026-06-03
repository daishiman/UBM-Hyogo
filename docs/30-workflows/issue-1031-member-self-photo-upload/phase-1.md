# Phase 1: 要件定義

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。

## 1.1 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在する | No | 通常の実装 Phase（`implementation_mode: "new"`） |
| upstream（main/dev）にマージ済み | No（origin/main・origin/dev と HEAD は behind 0 だが self-upload 実装は不在） | 未マージとして扱う |
| 前提タスク（#983 admin-managed photo）完了済み | Yes（local 実装あり: migration 0022 / presign util / admin route / Avatar src） | 依存を baseline 化し再実装しない |

→ `implementation_mode: "new"`。ただし **既存資産（admin route / presign util / Avatar primitive / rateLimitSelfRequest middleware）を最大限再利用**し、新規実装面を最小化する。

## 1.2 タスク分類

- **UI task / VISUAL**（profile に photo upload/delete UI を追加するため）。Phase 11 は VISUAL（screenshot 必須）。
- ただし主たる難所は **API 認証境界（own-profile only mutation）** と **D1 additive migration** であり、API 層は NON_VISUAL contract test 中心。

## 1.3 受け入れ基準（Issue #1031 AC を最新コードへ写像）

| # | Issue AC 原文 | 最新コードへの写像（測定可能化） |
|---|------|------|
| AC-1 | `/(member)/profile` から本人写真の upload/delete ができる | `apps/web/app/(member)/profile/` に `PhotoUpload.client.tsx` を mount。file 選択 → upload、delete ボタン → 削除が動作 |
| AC-2 | API は認証済み member の own profile だけ mutation でき、他 memberId への書き込みを拒否する | `/me/photo` は path に memberId を含めず `session.user.memberId` のみで R2 key と D1 row を解決。未認証は 401（sessionGuard）|
| AC-3 | `member_photos` に `uploaded_by` または同等の監査情報が残る | 既存 `uploaded_by`（actor email）+ 新規 `source`（'self'）+ audit `member.photo_uploaded`/`member.photo_deleted` |
| AC-4 | admin-managed photo と member self-upload photo の優先順位が仕様化されている | **単一 avatar スロット last-write-wins**。`source` が最終書き込み主体を記録。Phase 2 §2.4 で固定 |
| AC-5 | R2 object key / presign TTL が #983 の `members/{memberId}/avatar` / 300s と互換 | object key・TTL ともに既存定数（`MEMBER_PHOTO_OBJECT_KEY` / `MEMBER_PHOTO_PRESIGN_TTL_SECONDS`）を再利用。新設しない |
| AC-6 | MIME は jpeg/png/webp、上限は 256KB を基準に再評価 | 既存 `MEMBER_PHOTO_ALLOWED_MIME` / `MEMBER_PHOTO_MAX_BYTES`（256KB）を server 検証で再利用。再評価結果=据え置き（client 体感に十分・無料枠配慮） |

### 追加 AC（self-service 文脈で必須化）

| # | 内容 |
|---|------|
| AC-7 | upload は rulesConsent 必須（`requireRulesConsent`）。未同意は 403 `RULES_CONSENT_REQUIRED`。delete は session のみ（自分の写真撤去は同意ゲート不要） |
| AC-8 | self mutation は `rateLimitSelfRequest`（60s / 5 回）を適用（既存 self-service と同一防御） |
| AC-9 | 写真未登録 member の profile 描画は現行と pixel diff ゼロ（Avatar src 無し → hue placeholder） |

## 1.4 既存コードの命名規則分析（FB-01 / FB-SDK-07-4 対応）

| 領域 | 既存規則 | 本タスクの新規命名（一貫性担保） |
|------|---------|------|
| API route | kebab path / handler は inline | `POST /me/photo` / `DELETE /me/photo`（`:memberId` 無し） |
| audit action | `admin.member.photo_uploaded` / `member.tag_assigned`（dot 区切り snake） | `member.photo_uploaded` / `member.photo_deleted` |
| repo 関数 | `getMemberPhoto` / `upsertMemberPhoto` / `deleteMemberPhoto`（camelCase） | 既存関数を拡張（新規関数を増やさない） |
| shared schema | `MeProfileResponseZ` / `MeQueueAcceptedResponseZ`（`Me*Z` PascalCase + Z suffix） | `MePhotoUploadAcceptedZ` |
| web client | `me-requests-client.ts` / `SelfRequestError`（kebab file / Error class） | `me-photo-client.ts` / 既存 `SelfRequestError` を再利用 or 拡張 |
| web component | `VisibilityRequest.client.tsx`（PascalCase + `.client.tsx`） | `PhotoUpload.client.tsx` |
| web proxy | `apps/web/app/api/me/visibility-request/route.ts` | `apps/web/app/api/me/photo/route.ts` |
| DB column | snake_case（`uploaded_by`） | `source` |

## 1.5 inventory（変更対象ファイル俯瞰）

### apps/api（Task A）

| ファイル | 種別 | 概要 |
|---------|------|------|
| `apps/api/migrations/0023_member_photos_source.sql` | 新規 | `ALTER TABLE member_photos ADD COLUMN source TEXT NOT NULL DEFAULT 'admin'` |
| `apps/api/src/repository/memberPhotos.ts` | 編集 | `MemberPhotoRow.source` / `RawMemberPhotoRow.source` 追加。`getMemberPhoto` SELECT 追加。`upsertMemberPhoto` に `source` 引数 |
| `apps/api/src/routes/admin/members.ts` | 編集 | upsert 呼び出しに `source: "admin"` を明示（既存挙動維持） |
| `apps/api/src/routes/me/index.ts` | 編集 | `POST /me/photo` / `DELETE /me/photo` を追加。`/me/profile` に `photoUrl` 同梱（fail-soft） |
| `apps/api/src/routes/me/schemas.ts` | 編集 | `MeProfileResponseZ.photoUrl?` 追加 / `MePhotoUploadAcceptedZ` 追加 |
| `apps/api/src/routes/me/index.ts`（env） | 編集 | `MeRouteEnv` に R2 binding `MEMBER_PHOTOS` と presign secret 群を追加（admin route と同型） |
| `packages/shared/src/zod/*`（必要時） | 編集 | client 共有が必要な場合のみ。原則 me/schemas.ts 内に閉じる |

### apps/web（Task B）

| ファイル | 種別 | 概要 |
|---------|------|------|
| `apps/web/app/api/me/photo/route.ts` | 新規 | multipart POST / DELETE を API Worker `/me/photo` へ proxy（fetchAuthed 相当・cookie 転送） |
| `apps/web/src/lib/api/me-photo-client.ts` | 新規 | `uploadOwnPhoto(file)` / `deleteOwnPhoto()` + error code 写像（既存 `SelfRequestError` パターン踏襲） |
| `apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx` | 新規 | avatar 表示 + file input + upload/delete + 状態機械 + a11y |
| `apps/web/app/(member)/profile/page.tsx` | 編集 | `PhotoUpload` を mount。`/me/profile` の `photoUrl` を渡す |
| `apps/web/src/lib/api/me-types.ts` | 編集 | `MeProfileResponse` に `photoUrl?` を反映 |

### テスト（Phase 4/6）

| ファイル | 種別 |
|---------|------|
| `apps/api/src/routes/me/__tests__/photo.route.spec.ts`（または既存 me test に追加） | 新規 |
| `apps/api/src/repository/__tests__/memberPhotos.source.spec.ts` | 新規 |
| `apps/web/app/(member)/profile/_components/PhotoUpload.client.component.spec.tsx` | 新規 |
| `apps/web/app/api/me/photo/route.spec.ts` | 新規 |
| Playwright visual（profile photo 有無 / upload affordance） | 新規 |

## 1.6 targeted test run リスト（FB-UI-02-2: 全件 test の SIGKILL 回避）

実装フェーズで全件 `pnpm test` を避け、以下を targeted run する（リポジトリルートから vitest 実行）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- me/photo memberPhotos
mise exec -- pnpm --filter @ubm-hyogo/web test -- PhotoUpload me/photo
mise exec -- pnpm --filter @ubm-hyogo/shared test -- viewmodel
```

> 2026-06-01 実測で package 名は `@ubm-hyogo/api` / `@ubm-hyogo/web` / `@ubm-hyogo/shared`。`@repo/*` は stale command として使用禁止。

## 1.7 carry-over 確認

直前コミット（`git log --oneline -5`）は #1010 / #1008 / #1047 等で本タスクと無関係。本タスクは #983（admin photo）の followup-001 の新規作業であり、carry-over なし。

## 完了条件

- [x] P50 チェック実施・`implementation_mode` 確定
- [x] タスク分類（VISUAL）記録
- [x] Issue AC を最新コードへ写像（AC-1〜AC-9）
- [x] 命名規則分析・inventory・targeted run リスト確定
