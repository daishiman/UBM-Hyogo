# Phase 2: 設計

> **[実装区分: 実装仕様書]**。データフロー・型・関数シグネチャ・R2/D1 契約・ライブラリ選定を確定する。

## 1. トポロジ（責務境界）

```
[Browser <img src=presignedUrl>] ──直接GET──> [R2 bucket MEMBER_PHOTOS]   (TTL 300s 署名, public list 禁止)
        ▲ photoUrl                                   ▲ put/delete
        │ (detail view)                              │
[apps/web MemberDrawer] ──useAdminMutation──> [apps/api /admin/members/:id/photo] ──> R2 + D1 member_photos + audit_log
        │ MemberAvatar(photoUrl)                     │
        └── server fetch detail ──> /admin/members/:id (photoUrl 同梱)
```

- **状態所有権**: 写真バイナリ = R2。メタデータ（object_key/size/uploader）= D1 `member_photos`。presigned URL 生成 = `apps/api` のみ。`apps/web` は presignedUrl を受け取り `<img>` に渡すだけ（R2/D1 直アクセス無し = invariant #5）。
- **fail-soft**: photoUrl 解決（presign）失敗時は detail view から photoUrl を省略 → UI は hue placeholder（AC-3）。detail 本体は 200 を維持。

## 2. 既存コンポーネント再利用可否（FB-SDK-07-1）

| 候補 | 再利用 | 判断 |
|------|--------|------|
| `Avatar` primitive | **拡張**（`src?` 追加） | 新規 primitive を作らず既存に `<img>` 分岐を足す（prototype alignment invariant #3） |
| `MemberAvatar` | **拡張**（`photoUrl?` 追加） | hue fallback を温存 |
| `useAdminMutation` | **再利用** | invariant #10。新規 mutation hook を作らない |
| `Drawer` / `KVList` | **再利用** | upload affordance は drawer 内に配置 |
| audit log 基盤 | **再利用** | `apps/api/src/repository/auditLog.ts` の既存 writer |

## 3. R2 storage contract（確定値）

| 項目 | 値 |
|------|-----|
| binding | `MEMBER_PHOTOS`（`env.ts` に `readonly MEMBER_PHOTOS?: R2Bucket;`） |
| bucket 名 | `ubm-hyogo-member-photos-staging` / `ubm-hyogo-member-photos-prod` |
| object key | `members/{memberId}/avatar`（1 member 1 photo・上書き保存） |
| 上限サイズ | 256 KB（server 側で `byteLength` 検証。超過は 413） |
| 許可 MIME | `image/jpeg` / `image/png` / `image/webp`（他は 415） |
| GET 方式 | **presigned URL（S3 互換 SigV4）**、TTL **300 秒** |
| public list | **禁止**（bucket 設定で public access 無効。アクセスは presign のみ）— AC-5 |

### presign ライブラリ選定（FB-CRONVL-001: 実挙動確認を Phase 4 で必須化）

- 採用: **`aws4fetch`**（軽量・Workers 互換の SigV4 署名）で R2 の S3 API endpoint に対し presigned GET URL を生成。
- 必要 secret（`bash scripts/cf.sh secret put`、`.dev.vars.example` には `op://` 参照のみ）:
  - `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`（presign 専用 scoped token）
  - endpoint: `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{bucket}/{key}`
- 代替案（不採用）: ① Worker proxy stream（`<img>` がブラウザ直リクで cookie 認証を運べず admin 限定が崩れる）② Cloudflare Images（無料枠超過）。
- **Phase 4 実測必須**: 生成した presigned URL が `aws4fetch` の `aws.sign(..., { aws: { signQuery: true } })` で query 署名され、TTL 経過後に 403 になることを mock/contract で確認。

## 4. D1 schema（migration 0022_member_photos.sql）

```sql
-- 0022_member_photos.sql
-- admin-managed member photo metadata (invariant #4: Google Form schema 外データを分離)
CREATE TABLE IF NOT EXISTS member_photos (
  member_id    TEXT PRIMARY KEY,
  object_key   TEXT    NOT NULL,
  content_type TEXT    NOT NULL,
  byte_size    INTEGER NOT NULL,
  uploaded_by  TEXT    NOT NULL,
  uploaded_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

- Google Form schema 表（responses / response_sections / response_fields）には一切触れない。
- `member_id` は既存 member と論理 FK（D1 では FK 制約を貼らず application 層で整合）。

## 5. shared schema 変更

`packages/shared/src/zod/viewmodel.ts` `AdminMemberDetailViewZ`（`.strict()` 維持）:

```ts
export const AdminMemberDetailViewZ = z
  .object({
    identityMemberId: z.string().min(1),
    identityEmail: EmailZ,
    status: z.object({ /* 既存 */ }),
    profile: MemberProfileZ,
    audit: z.array(/* 既存 */),
    photoUrl: z.string().url().optional(), // ← 追加（issue AC-2）
  })
  .strict();
```

`packages/shared/src/types/viewmodel/index.ts` `interface AdminMemberDetailView` に `readonly photoUrl?: string;` を追加。

> 注意（FB-W0-01）: root barrel 衝突回避のため既存 export 経路（`@ubm-hyogo/shared`）をそのまま使い、新規 subpath は作らない。`AdminMemberListView` には photoUrl を**追加しない**（list は presign コスト回避）。

## 6. API 関数シグネチャ

### presign util — `apps/api/src/lib/r2/member-photo-presign.ts`

```ts
export interface PresignDeps {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
}
/** members/{memberId}/avatar の presigned GET URL (TTL 秒) を返す。失敗時 null（fail-soft）。 */
export async function presignMemberPhotoGetUrl(
  deps: PresignDeps,
  objectKey: string,
  ttlSeconds: number, // 既定 300
): Promise<string | null>;

export const MEMBER_PHOTO_OBJECT_KEY = (memberId: string): string => `members/${memberId}/avatar`;
export const MEMBER_PHOTO_MAX_BYTES = 256 * 1024;
export const MEMBER_PHOTO_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
```

### repository — `apps/api/src/repository/memberPhotos.ts`

```ts
export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
}
export function getMemberPhoto(c: Ctx, mid: MemberId): Promise<MemberPhotoRow | null>;
export function upsertMemberPhoto(c: Ctx, row: Omit<MemberPhotoRow, "uploadedAt">): Promise<void>;
export function deleteMemberPhoto(c: Ctx, mid: MemberId): Promise<void>;
```

### route — `apps/api/src/routes/admin/members.ts`（`requireAdmin` 配下に追加）

| メソッド/パス | 入力 | 出力 | 副作用 |
|--------------|------|------|--------|
| `POST /admin/members/:memberId/photo` | `multipart/form-data` file（`image/*`, ≤256KB） | `200 { ok: true }` / `413` / `415` / `404`(member不在) | R2 `put(key, body, {httpMetadata})` + `upsertMemberPhoto` + audit `admin.member.photo_uploaded` |
| `DELETE /admin/members/:memberId/photo` | path のみ | `200 { ok: true }` / `404` | R2 `delete(key)` + `deleteMemberPhoto` + audit `admin.member.photo_deleted` |
| `GET /admin/members/:memberId`（既存拡張） | path | 既存 `AdminMemberDetailView` + `photoUrl?`（photo row 有 かつ presign 成功時のみ） | 副作用なし（read のみ） |

- detail での photoUrl 解決: route handler が `getMemberPhoto` → 有れば `presignMemberPhotoGetUrl` → 成功時のみ view に注入。`buildAdminMemberDetailView` は photoUrl を引数 or 後段マージで受ける（builder を R2 依存にしない＝テスト容易性のため route 層で注入）。

## 7. web 側シグネチャ

### `Avatar`（`apps/web/src/components/ui/Avatar.tsx`）

```ts
export interface AvatarProps {
  memberId?: string;
  name: string;
  hue?: number;
  src?: string;       // ← 追加: 有れば <img>、onError で hue placeholder へ
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}
```

- `src` 有: `<img src alt={name} onError={() => setFailed(true)} />`。`failed` 時は従来の initial+hue div を render（AC-3 / AC-4: src 無/失敗時は現行と同一 DOM → pixel diff ゼロ）。

### `MemberAvatar`

```ts
export interface MemberAvatarProps {
  readonly memberId: string;
  readonly fullName: string;
  readonly photoUrl?: string; // ← 追加
  readonly size?: "sm" | "md" | "lg";
}
```

- `<Avatar memberId name hue src={photoUrl} size />`。MembersTable（list）は photoUrl を渡さない（list view に無いため自然に hue のまま）。

### MemberDrawer upload affordance

- drawer の avatar 近傍に「写真を変更 / 削除」ボタン。`useAdminMutation` で `POST/DELETE /admin/members/:id/photo` を叩き、成功で detail 再取得。loading state を明示（issue リスク対策）。

## 8. ステップ間 state / loading 設計

| 状態 | 表示 |
|------|------|
| photoUrl 未取得（detail fetch 中） | hue placeholder（既存 skeleton 流用） |
| photoUrl 有・`<img>` load 中 | hue placeholder を背面に維持 → load 完了で差し替え |
| `<img>` onError | hue placeholder へ恒久 fallback |
| upload 中 | ボタン disabled + spinner |

## 完了条件（Phase 2）

- [ ] R2 contract（bucket/key/TTL/size/MIME/presign lib）が確定
- [ ] D1 `member_photos` DDL が確定（Google Form 表非依存）
- [ ] shared schema 追加箇所が `.strict()` 維持で確定
- [ ] API 3 endpoint と presign/repository のシグネチャ確定
- [ ] web 側 `src`/`photoUrl` prop と loading/fallback 設計確定
- [ ] 全て invariant #4/#5/#6/#10 と整合

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
R2、D1、API、shared schema、web UI の責務境界と実装シグネチャを固定する。

## 実行タスク
- R2 presigned URL storage contract を確定する。
- API と UI のデータフローを一方向に整理する。

## 参照資料
- `phase-1.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`

## 成果物
- Phase 2 設計仕様

## 統合テスト連携
Phase 4 の presign unit、route contract、avatar render spec が本設計を検証する。
