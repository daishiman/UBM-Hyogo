# Implementation Guide: issue-1031-member-self-photo-upload

> **状態: 実装完了（implemented_local_runtime_pending）。** 実コードを apps/api + apps/web に追加・変更し、
> targeted vitest（53 件）/ typecheck / lint / verify-design-tokens を local で GREEN 確認済み。
> commit / push / PR / Issue mutation は未実施（ユーザー承認待ち・CONST_002）。

## Part 1: Concept（中学生にもわかる説明）

### なぜ必要か

これまで会員は、自分のプロフィール写真を変えるのに運営（admin）に頼むしかなかった。
たとえば学校の名簿写真を変えたいだけなのに、毎回先生に写真を渡して差し替えてもらう状態だった。
本人が自分で写真を変えられないと、写真が古いままになりやすく、誰の意思で写真を載せたのかも追跡しにくい。

### 何が変わるか

このタスクで「**会員が自分の写真だけを自分で登録・差し替え・削除できる経路**」を追加した。
写真置き場は issue #983 と同じ「1 人 1 枚」の棚（object key `members/{memberId}/avatar`）。
admin が上げても本人が上げても**同じ棚を上書き（last-write-wins）**し、`member_photos.source` 列に
「最後に書いたのは admin か self か」を記録する。これで「本人が自分の意思で載せた」という監査根拠が残る。

### 今回作ったもの

- 会員本人用の `POST /me/photo` / `DELETE /me/photo`
- `member_photos.source` を追加する D1 migration
- `/me/profile` の `photoUrl?` fail-soft 同梱
- `/profile` の `PhotoUpload.client.tsx` と `/api/me/photo` proxy
- API/repository/web component/proxy の focused tests と Phase 11 component screenshot

## Part 2: Technical Contract（実装済み）

### 型定義

```ts
type MemberPhotoSource = "admin" | "self";

interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly uploadedBy: string;
  readonly source: MemberPhotoSource;
  readonly uploadedAt: string;
}

interface MeProfileResponse {
  readonly photoUrl?: string;
}
```

### APIシグネチャ

```ts
POST /me/photo(file: multipart File): { ok: true }
DELETE /me/photo(): { ok: true }
GET /me/profile(): MeProfileResponse & { photoUrl?: string }
```

### 使用例

```ts
const file = new File([bytes], "avatar.jpg", { type: "image/jpeg" });
await uploadOwnPhoto(file);
await deleteOwnPhoto();
```

### apps/api（Task A）
- **migration `0023_member_photos_source.sql`**: `ALTER TABLE member_photos ADD COLUMN source TEXT NOT NULL DEFAULT 'admin'`（additive・既存行は DEFAULT で backfill）。
- **`memberPhotos.ts`**: `MemberPhotoRow.source` / `RawMemberPhotoRow.source` 追加。`getMemberPhoto` は SELECT に `source` を含め `"self"` 以外を `"admin"` に正規化。`upsertMemberPhoto` の INSERT に `source` を追加。
- **`admin/members.ts`**: 既存 upsert 呼び出しに `source: "admin"` を明示（挙動不変）。
- **`me/index.ts`**:
  - `MeRouteEnv` に `MEMBER_PHOTOS?` / `R2_ACCOUNT_ID?` / `R2_ACCESS_KEY_ID?` / `R2_SECRET_ACCESS_KEY?`（admin route と同名）を追加。
  - `POST /me/photo`: `sessionGuard → requireRulesConsent → rateLimitSelfRequest`。multipart → MIME(415)/空(400)/サイズ(413) server 検証 → R2 binding 無(503) → `MEMBER_PHOTOS.put` → `upsertMemberPhoto(source:"self")` → audit `member.photo_uploaded`。path に memberId を出さず `session.user.memberId` のみ解決（AC-2）。
  - `DELETE /me/photo`: sessionGuard のみ（同意ゲート不要）。row 無は 404 → R2 delete + D1 delete + audit `member.photo_deleted`。
  - `GET /me/profile`: `resolveMyPhotoUrl`（admin の resolvePhotoUrl と同ロジック）で presigned `photoUrl` を fail-soft 同梱（presign 失敗・row 無・secret 無は省略・200 維持）。
- **`me/schemas.ts`**: `MeProfileResponseZ.photoUrl?`（`.strict()` 維持）+ `MePhotoUploadAcceptedZ`。

### apps/web（Task B）
- **`app/api/me/photo/route.ts`**: `fetchAuthed` 経由の proxy（POST multipart / DELETE）。エラー status を passthrough（401/403/413/415/429/404）。env 不変条件遵守（`process.env` 直参照せず `fetchAuthed` の env accessor を利用）。
- **`src/lib/api/me-photo-client.ts`**: `uploadOwnPhoto(file)` / `deleteOwnPhoto()` + `PhotoRequestError`（status→code 写像）。
- **`app/(member)/profile/_components/PhotoUpload.client.tsx`**: Avatar 再利用 + file input + 2 段階削除確認 + 状態機械（idle/uploading/success/error, confirm/deleting）+ a11y。ロック解放は success/error 両分岐で state 更新（try/finally 等価）。色は OKLch token のみ。
- **`app/(member)/profile/page.tsx`**: `PhotoUpload` を ProfileHeader 直下に mount。`photoUrl={profileRes.photoUrl}`。
- **`src/lib/api/me-types.ts`**: `MeProfileResponse.photoUrl?`。

### エラーハンドリング

- `POST /me/photo`: file field 不在/空は 400、MIME 不許可は 415、256KB 超過は 413、R2 binding 不足は 503、rate limit は 429。
- `DELETE /me/photo`: row 不在は 404。R2 binding 不足時も D1 row は削除して本人の撤去意図を優先する。
- `GET /me/profile`: presign secret 不足や presign 失敗は `photoUrl` 省略で 200 維持。

### エッジケース

- path / query / multipart body に他人の `memberId` が混入しても参照しない。対象は session の `memberId` のみ。
- admin upload と self upload は同じ `members/{memberId}/avatar` を上書きし、orphan object を増やさない。
- legacy row や未知 `source` は repository read で `admin` に正規化する。

### 設定項目と定数一覧

| name | value |
| --- | --- |
| `MEMBER_PHOTO_ALLOWED_MIME` | `image/jpeg`, `image/png`, `image/webp` |
| `MEMBER_PHOTO_MAX_BYTES` | `256 * 1024` |
| `MEMBER_PHOTO_OBJECT_KEY(memberId)` | `members/{memberId}/avatar` |
| `MEMBER_PHOTO_PRESIGN_TTL_SECONDS` | `300` |
| `member_photos.source` | `admin` / `self`, default `admin` |

### テスト構成

| spec | 件数 | config |
|------|------|--------|
| `apps/api/src/routes/me/photo.contract.spec.ts`（ME-PHOTO-C-1..21） | 21 | vitest.d1 |
| `apps/api/src/repository/__tests__/memberPhotos.source.repository.spec.ts`（REPO-SRC-1..8） | 8 | vitest.d1 |
| `apps/web/app/(member)/profile/_components/__tests__/PhotoUpload.client.component.spec.tsx`（PHOTO-UP-1..17） | 15 | vitest unit |
| `apps/web/app/api/me/photo/__tests__/route.spec.ts`（PROXY-1..10） | 9 | vitest unit |

> spec 命名は D1 glob 自動マッチに合わせ `photo.contract.spec.ts` / `*.repository.spec.ts` を採用（D1_INCLUDE への手動追記不要）。
> 回帰: 既存 `admin/__tests__/member-photo.contract.spec.ts`(18) / `me/index.contract.spec.ts`(28) も GREEN（source:"admin" 明示 + /me/profile photoUrl 追加の非破壊性を確認）。

## Canonical Commands（local で実行・PASS 済み）

```bash
mise exec -- pnpm typecheck   # PASS（6 packages）
mise exec -- pnpm lint        # PASS（既存 PublicConsentCallout 警告2のみ・本変更由来0）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/routes/me/photo.contract.spec.ts \
  apps/api/src/repository/__tests__/memberPhotos.source.repository.spec.ts   # 29 passed
mise exec -- pnpm exec vitest run \
  "apps/web/app/(member)/profile/_components/__tests__/PhotoUpload.client.component.spec.tsx" \
  "apps/web/app/api/me/photo/__tests__/route.spec.ts"   # 24 passed
```

## Screenshots（Phase 11）

`outputs/phase-11/evidence/photo-upload-states.png` — PhotoUpload の 4 状態（idle 未登録 / 写真登録済み / 削除確認 / uploading+success+error）を実 OKLch token で描画した component-isolation harness 撮影。検証結果は `outputs/phase-11/visual-verification.md`。

## 不変条件の遵守

- #5 D1/R2 直接アクセスは apps/api に閉じる（web は proxy のみ）。
- #11 `/me/photo` は path に memberId を含めず session 由来 memberId のみ（AC-2 contract test で証明）。
- #4 member_photos は admin-managed data（Form 本文外）→ 本人直接 mutate は invariant #4 を侵さない（Phase 2 §2.2）。
- #8 新規 test は `*.spec.{ts,tsx}` のみ。色は OKLch token のみ（verify-design-tokens PASS）。

## Boundary

実コードは実装済み。runtime（staging deploy + 実 R2 + 実 auth セッションでの E2E）は未検証であり、これはユーザー承認後の deploy フェーズで確認する（`implemented_local_runtime_pending`）。
