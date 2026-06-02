# Phase 2: 設計

> **[実装区分: 実装仕様書]** — 後続 Phase 4/5 が迷わず実装できる粒度で contract を固定する。

## 2.0 topology / SubAgent lane / validation path

| lane | 責務 | 並列 |
|------|------|------|
| Lane A（storage/API） | migration 0023 / repo / admin route source / `/me/photo` / `/me/profile` photoUrl / schema | 先行（shared contract を確定） |
| Lane B（web UI） | proxy route / client / PhotoUpload component / page mount | Lane A の contract 確定後 |
| Lane V（validation） | typecheck / lint / targeted vitest / Playwright visual | 直列で締め |

## 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

| 再利用資産 | 場所 | 本タスクでの利用 |
|-----------|------|------|
| MIME / size / object-key / TTL 定数 | `apps/api/src/lib/r2/member-photo-presign.ts` | そのまま import（新設しない） |
| `presignMemberPhotoGetUrl()` | 同上 | `/me/profile` の photoUrl 解決に再利用 |
| admin upload の multipart→put フロー | `admin/members.ts:497-558` | self 版のロジックひな型（authorization のみ差し替え） |
| `sessionGuard` / `requireRulesConsent` / `rateLimitSelfRequest` | `apps/api/src/middleware/` | self endpoint の認証・同意・rate limit |
| `Avatar`（src 対応） | `apps/web/src/components/ui/Avatar.tsx` | photo 表示（src + onError fallback 済み） |
| `Button` / `Modal` | `apps/web/src/components/ui/` | upload/delete UI |
| `SelfRequestError` + error code 写像 | `apps/web/src/lib/api/me-requests-client.ts` | photo client の error 表現に流用 |
| `/api/me/visibility-request/route.ts` | proxy パターン | photo proxy の雛形 |

→ **新規 primitive・新規 middleware・新規 presign util はゼロ**。新規面は「self endpoint 2 本 / source 列 / proxy 1 本 / client 1 本 / component 1 本」に限定。

## 2.2 核心設計判断: direct self-write vs request-queue（真の論点の解決）

### 判断: **direct self-write を採用**

| 観点 | direct self-write（採用） | request-queue（不採用） |
|------|------|------|
| Issue AC-1/AC-2 適合 | ○「本人が upload/delete できる」「own profile を mutation」に直接一致 | ✕ mutation でなく request になり AC と矛盾 |
| Issue 動機（admin 代行依存の解消） | ○ 即時更新で admin 不要化 | ✕ admin 承認が残り代行依存を温存 |
| invariant #4（/me で Form 本文編集禁止） | ○ photo は admin-managed data（`member_photos`）で **Form profile 本文ではない**。invariant #4 は保護対象外 | （承認経由でも可だが過剰） |
| invariant #11（path に memberId 不可） | ○ `session.user.memberId` のみで解決 | ○ |
| 運用コスト | ○ admin タスク増えない | ✕ admin 承認キュー処理が増える |

### invariant #4 との整合（明文化）

`apps/api/src/routes/me/index.ts` 冒頭の invariant #4 は **「本人プロフィール本文を D1 で編集する route を mount しない」**。
- ここでの「プロフィール本文」= Google Form 回答（responses / sections / fields）であり、本人更新は **Form 再回答が正式経路**（CLAUDE.md invariant #7）。
- `member_photos` は **invariant #4（Google Form schema 外データ = admin-managed data として分離）** に基づき Form schema から隔離された別データ。
- したがって `/me/photo` で `member_photos` を直接 mutate しても **「Form 本文編集」には当たらず invariant #4 を侵さない**。本 workflow ではこの解釈を Phase 1 inventory と Phase 5 実装コメントに明記する。

> この判断は Issue AC が「本人が直接 upload/delete できる」と明示し、かつ photo の境界が Form 本文と異なるため確定できる（ユーザーエスカレーション不要）。

## 2.3 D1 migration 0023（additive）

ファイル: `apps/api/migrations/0023_member_photos_source.sql`

```sql
-- 0023_member_photos_source.sql
-- issue-1031: member self-upload を区別する source 列を additive 追加。
-- 既存行（admin upload）は DEFAULT 'admin' で backfill される（非破壊）。
-- invariant #4: member_photos は admin-managed data。Google Form schema 表には触れない。
ALTER TABLE member_photos ADD COLUMN source TEXT NOT NULL DEFAULT 'admin';
```

- **値域**: `'admin'` | `'self'`（CHECK 制約は付けない＝既存 migration 流儀に合わせ application 層 zod / 型で担保）。
- **backfill**: 既存行は `DEFAULT 'admin'` で自動 backfill。明示 UPDATE 不要。
- **migration 連番**: 最新は `0022_member_photos.sql`。0023 が次番（`0020_*` が 2 本ある点は既存例外。`sequence-exceptions.json` を Phase 5 で確認し、必要なら登録）。

### `consent_at` を追加しない理由（AC-3 の最小実装）

Issue は `consent_at` を「など」として例示するが、本人による self-upload は **「自分の意思で自分の写真を上げた」という行為自体が同意の表明**であり、`source='self'` + audit `member.photo_uploaded`（timestamp 付き）で同意の時刻・主体は追跡可能。専用 `consent_at` 列は冗長になるため**追加しない**（over-scope 回避 / additive 列を最小化）。将来 public 表示（followup-002）で明示同意フローが必要になった時点で再評価。

## 2.4 admin / self の優先順位（AC-4 固定）

- object key = `members/{memberId}/avatar`（単一スロット・上書き）。member 1 人につき photo は常に 1 枚。
- **last-write-wins**: admin が上げても self が上げても同じ object/row を上書き。`source` 列が「最後に書いた主体」を記録する。
- admin/self で別スロットを持たない → **R2 orphan を構造的に発生させない**（Issue リスク「orphan object が増える」への対策）。
- 「admin がロックして self を拒否」等の優先制御は **しない**（MVP では本人が自分の avatar を自由に更新できることを優先）。この仕様を Phase 12 implementation-guide に明記。

## 2.5 repository 拡張（`memberPhotos.ts`）

```ts
export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly uploadedBy: string;
  readonly source: "admin" | "self";   // ← 追加
  readonly uploadedAt: string;
}

interface RawMemberPhotoRow {
  member_id: string;
  object_key: string;
  content_type: string;
  byte_size: number;
  uploaded_by: string;
  source: string;                        // ← 追加
  uploaded_at: string;
}

// getMemberPhoto: SELECT に source を追加し、戻り値に source をマップ（"admin"/"self" 以外は "admin" にフォールバック）
// upsertMemberPhoto: 引数 Omit<MemberPhotoRow, "uploadedAt"> に source を含める。INSERT 列/値に source を追加。
```

- `upsertMemberPhoto` の SQL: `INSERT OR REPLACE INTO member_photos (member_id, object_key, content_type, byte_size, uploaded_by, source, uploaded_at) VALUES (?1,?2,?3,?4,?5,?6, datetime('now'))`。
- `getMemberPhoto` の SELECT に `source` 追加。`source` の正規化: `row.source === "self" ? "self" : "admin"`。

### admin route 側の追随（`admin/members.ts:540`）

`upsertMemberPhoto(db, { ..., uploadedBy: actorEmail, source: "admin" })` に `source: "admin"` を明示追加（既存挙動維持）。

## 2.6 `/me/photo` endpoint contract

### env 拡張（`MeRouteEnv`）

admin route と同じ R2 binding / presign secret を `/me` でも参照するため、`MeRouteEnv` に以下を追加（admin の env 型を参照）:

```ts
export interface MeRouteEnv extends SessionGuardEnv {
  // 既存 ...
  readonly MEMBER_PHOTOS?: R2Bucket;
  readonly R2_ACCOUNT_ID?: string;
  readonly R2_ACCESS_KEY_ID?: string;
  readonly R2_SECRET_ACCESS_KEY?: string;
  readonly MEMBER_PHOTOS_BUCKET?: string;  // bucket 名（admin route と同じ解決方法に合わせる）
}
```

> Phase 5 で admin route が presign secret をどう解決しているか（`resolvePhotoUrl` 内）を確認し、同一の env キー名に揃える。

### `POST /me/photo`（multipart self-upload）

| 項目 | 仕様 |
|------|------|
| middleware | `sessionGuard`（/me/* 既存）→ `requireRulesConsent` → `rateLimitSelfRequest`（AC-7/AC-8） |
| body | `multipart/form-data`、`file` field（`File`） |
| 対象 member | `c.get("user").memberId`（path に出さない） |
| 検証 | file 不在 → 400 / MIME 不許可 → 415 / 空 → 400 / >256KB → 413 |
| R2 | `c.env.MEMBER_PHOTOS.put(MEMBER_PHOTO_OBJECT_KEY(memberId), buf, { httpMetadata: { contentType }})`。binding 無 → 503 |
| D1 | `upsertMemberPhoto(db, { memberId, objectKey, contentType, byteSize, uploadedBy: user.email, source: "self" })` |
| audit | `auditAction("member.photo_uploaded")`, targetType `"member"`, targetId `memberId`, after `{ objectKey, contentType, byteSize, source: "self" }` |
| 成功 | `200 { ok: true }`（または `MePhotoUploadAcceptedZ`）|

### `DELETE /me/photo`（self delete）

| 項目 | 仕様 |
|------|------|
| middleware | `sessionGuard`（同意ゲートは不要＝撤去は自由） |
| 対象 | `getMemberPhoto(db, user.memberId)` → 無ければ 404 |
| R2 | binding 有時 `delete(photo.objectKey)` |
| D1 | `deleteMemberPhoto(db, user.memberId)` |
| audit | `auditAction("member.photo_deleted")`, before `{ objectKey }` |
| 成功 | `200 { ok: true }` |

### `GET /me/profile` 拡張（photoUrl 同梱）

- 既存 profile 構築後、`resolveMyPhotoUrl(c.env, db, user.memberId)`（admin の `resolvePhotoUrl` と同ロジック）で presigned URL を解決。
- 成功時のみ `body.photoUrl` を付与（fail-soft: presign 失敗・row 無は省略 → 200 維持）。
- `MeProfileResponseZ` に `photoUrl: z.string().url().optional()` を追加（`.strict()` 維持）。

## 2.7 shared / me schema

`apps/api/src/routes/me/schemas.ts`:

```ts
export const MeProfileResponseZ = z.object({
  profile: MemberProfileZ,
  // 既存フィールド ...
  photoUrl: z.string().url().optional(),   // ← 追加（top-level, strict 維持）
}).strict();

export const MePhotoUploadAcceptedZ = z.object({ ok: z.literal(true) }).strict();
export type MePhotoUploadAccepted = z.infer<typeof MePhotoUploadAcceptedZ>;
```

## 2.8 web 層

### proxy `apps/web/app/api/me/photo/route.ts`

- `POST`: 受け取った `multipart/form-data` を API Worker `/me/photo` へ転送（cookie/credential 転送）。`fetchAuthed` 系の server proxy パターン（既存 visibility-request route.ts を雛形）。multipart の body はそのまま stream/transfer。
- `DELETE`: API Worker `/me/photo` DELETE へ転送。
- status code（401/403/413/415/429/409）と body をそのまま返す。

### client `apps/web/src/lib/api/me-photo-client.ts`

```ts
export type PhotoErrorCode =
  | "UNSUPPORTED_MEDIA_TYPE" | "FILE_TOO_LARGE" | "EMPTY_FILE"
  | "RULES_CONSENT_REQUIRED" | "RATE_LIMITED" | "UNAUTHENTICATED"
  | "INVALID_REQUEST" | "NOT_FOUND" | "UNKNOWN";

export class PhotoRequestError extends Error { status: number; code: PhotoErrorCode; /* ... */ }

export async function uploadOwnPhoto(file: File): Promise<void>;  // POST /api/me/photo (multipart)
export async function deleteOwnPhoto(): Promise<void>;            // DELETE /api/me/photo
```

- status→code 写像: 415→UNSUPPORTED_MEDIA_TYPE / 413→FILE_TOO_LARGE / 400→EMPTY_FILE|INVALID_REQUEST / 403→RULES_CONSENT_REQUIRED / 429→RATE_LIMITED / 401→UNAUTHENTICATED / 404→NOT_FOUND。

### component `PhotoUpload.client.tsx`

| 要素 | 仕様 |
|------|------|
| props | `{ memberId: string; photoUrl?: string; name?: string; hue?: number }` |
| 表示 | `<Avatar memberId src={photoUrl} ... />` で現在の写真 / placeholder |
| file 選択 | `<input type="file" accept="image/jpeg,image/png,image/webp">`（client で MIME/size 事前チェック→即時 feedback、最終判定は server） |
| 状態機械 | `idle` → `selected` → `uploading` → `success` / `error`。delete は `confirm`（Modal）→ `deleting` → `success`/`error` |
| 成功後 | `router.refresh()` で `/me/profile` 再取得（photoUrl 反映）。Server Component re-render |
| a11y | input に label、状態は `role="status"`/`role="alert"`、ボタン `disabled` 制御、Modal は既存 `Modal`（focus trap 済み） |
| token | 色は OKLch token のみ。新規 CSS は token 経由 |

### page.tsx mount

`apps/web/app/(member)/profile/page.tsx` に `photoUrl` を取得し `<PhotoUpload memberId={me.user.memberId} photoUrl={profileRes.photoUrl} ... />` を `ProfileHeader` 付近に配置。`MeProfileResponse`（`me-types.ts`）に `photoUrl?: string` を追加。

## 2.9 ロック変数の解放経路（STATE-DETAIL-01）

PhotoUpload の upload/delete lock（`submitting`/`deleting`）は **正常・エラー・キャンセルの 3 経路すべて**で解放する（`try/finally`）。Phase 4 テストに「エラー後に再 upload 可能」ケースを必須化。

## 2.10 リスクと対策

| リスク | 対策 |
|------|------|
| 他 member の写真を書ける authorization gap | path に memberId を出さず `session.user.memberId` のみ。Phase 4 で「body/query に memberId を混入させても自分の row しか触らない」ことを test |
| 既存 admin upload の挙動退行 | admin route の upsert に `source:"admin"` を明示し、admin route の既存 contract test が緑であることを Phase 6 で確認 |
| migration 破壊 | additive `ADD COLUMN ... DEFAULT 'admin'` のみ。0022 の表定義は触らない |
| multipart proxy で body 欠落 | proxy は formData を再構築 or stream 転送。Phase 4 で proxy route の multipart 透過を test |
| presign 失敗で /me/profile が 500 | fail-soft（null→photoUrl 省略）。admin の `resolvePhotoUrl` と同挙動 |

## 完了条件

- [x] direct self-write 判断と invariant #4 整合を明文化
- [x] migration 0023 / repo / endpoint / schema / web の contract を実装可能粒度で固定
- [x] admin/self 優先順位（last-write-wins）と source 値域を固定
- [x] 既存資産の再利用範囲を確定（新規 primitive ゼロ）
