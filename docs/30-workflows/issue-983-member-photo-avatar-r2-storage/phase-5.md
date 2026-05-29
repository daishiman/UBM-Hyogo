# Phase 5: 実装

> **[実装区分: 実装仕様書]**。Phase 4 の RED spec を GREEN にするための変更対象ファイルと実装方針を記載する。

---

## 1. 変更対象ファイル一覧

### 新規作成（FB-RT-03 必須記載）

| ファイルパス | 責務 |
|---|---|
| `apps/api/migrations/0022_member_photos.sql` | D1 `member_photos` 表 DDL |
| `apps/api/src/lib/r2/member-photo-presign.ts` | R2 SigV4 presigned GET URL 生成ユーティリティ |
| `apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts` | presign unit test（Phase 4 作成済み） |
| `apps/api/src/repository/memberPhotos.ts` | `member_photos` 表への CRUD repository |
| `apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts` | route contract test（Phase 4 作成済み） |
| `packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts` | schema parse test（Phase 4 作成済み） |
| `apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx` | Avatar render test（Phase 4 作成済み） |

### 編集

| ファイルパス | 変更内容 |
|---|---|
| `apps/api/src/env.ts` | L22 付近の `Env` interface に `MEMBER_PHOTOS`, presign 用 secret 3 件を追加 |
| `apps/api/wrangler.toml` | `[env.staging]` / `[env.production]` に `[[r2_buckets]]` binding `MEMBER_PHOTOS` を追加 |
| `apps/api/src/routes/admin/members.ts` | `POST/DELETE /admin/members/:memberId/photo` ルート追加、`GET /admin/members/:memberId` を `photoUrl` 同梱に拡張 |
| `apps/api/src/repository/_shared/builder.ts` | `buildAdminMemberDetailView`（L372-446）の戻り値型に `photoUrl?` を追加し、呼び出し元から photoUrl を注入できるシグネチャ拡張 |
| `packages/shared/src/zod/viewmodel.ts` | `AdminMemberDetailViewZ`（L291-312）に `photoUrl: z.string().url().optional()` を追加 |
| `packages/shared/src/types/viewmodel/index.ts` | `AdminMemberDetailView` interface に `readonly photoUrl?: string;` を追加 |
| `apps/web/src/components/ui/Avatar.tsx` | `AvatarProps` に `src?: string` 追加・render 分岐実装 |
| `apps/web/src/features/admin/components/_members/MemberAvatar.tsx` | `MemberAvatarProps` に `photoUrl?: string` 追加・`Avatar` に `src={photoUrl}` を渡す |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | upload/delete affordance を `MemberDrawerBody` の header 内 `MemberAvatar` 近傍に追加 |
| `vitest.d1.config.ts` | `D1_INCLUDE` 配列に `member-photo.contract.spec.ts` のパスを追加 |

---

## 2. D1 migration — `0022_member_photos.sql`（DDL 全文）

```sql
-- 0022_member_photos.sql
-- admin-managed member photo metadata
-- invariant #4: Google Form schema 外データを admin-managed として分離する。
-- member_id は member_identities と論理 FK（D1 は application 層で整合、FK 制約なし）。
CREATE TABLE IF NOT EXISTS member_photos (
  member_id    TEXT    PRIMARY KEY,
  object_key   TEXT    NOT NULL,
  content_type TEXT    NOT NULL,
  byte_size    INTEGER NOT NULL,
  uploaded_by  TEXT    NOT NULL,
  uploaded_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

- `member_id` は `TEXT PRIMARY KEY`（1 member に 1 行 = 上書き保存 = upsert で実現）。
- `object_key` = `members/{memberId}/avatar`（constant に固定）。
- `content_type` は MIME 文字列（`image/jpeg` 等）。
- `uploaded_by` は admin 操作者の email（audit と対応）。
- `uploaded_at` は ISO-8601 文字列（SQLite の `datetime('now')` 既定）。

---

## 3. `apps/api/src/env.ts` 追記差分

現行の `Env` interface（L21-115）に以下を追加する。追加位置は既存 R2 binding（L33-35）の後（L36 付近）。

```ts
// apps/api/src/env.ts — Env interface への追加差分

// wrangler.toml [[env.*.r2_buckets]] binding = "MEMBER_PHOTOS"
// issue-983: admin-managed member photo storage
readonly MEMBER_PHOTOS?: R2Bucket;

// secrets (wrangler secret put) — R2 SigV4 presign 用
// Phase 5 user-gated runtime ops: bash scripts/cf.sh secret put R2_ACCOUNT_ID
readonly R2_ACCOUNT_ID?: string;
readonly R2_ACCESS_KEY_ID?: string;
readonly R2_SECRET_ACCESS_KEY?: string;
```

- 全て `?` optional（staging で bucket 未作成でも既存 route が壊れないように fail-soft）。
- presign secret は `wrangler secret put` 経由のみ。`.env` には `op://Vault/R2/...` 参照のみ書く。

---

## 4. `apps/api/wrangler.toml` 追記差分

`[[env.staging.r2_buckets]]` ブロックの末尾（現行 L211 付近）と `[[env.production.r2_buckets]]` ブロックの末尾（現行 L128 付近）にそれぞれ追記する。

```toml
# issue-983: admin-managed member photo storage
# bucket 作成は Phase 11 user-gated runtime ops で実行する
[[env.staging.r2_buckets]]
binding = "MEMBER_PHOTOS"
bucket_name = "ubm-hyogo-member-photos-staging"
preview_bucket_name = "ubm-hyogo-member-photos-staging"

[[env.production.r2_buckets]]
binding = "MEMBER_PHOTOS"
bucket_name = "ubm-hyogo-member-photos-prod"
```

- `preview_bucket_name` は staging のみ（wrangler dev 時に使用）。
- bucket の実作成は後述の user-gated runtime ops で行う（toml に書くだけでは bucket は作成されない）。

---

## 5. presign util — `apps/api/src/lib/r2/member-photo-presign.ts`

### 実装方針

```ts
import { AwsClient } from "aws4fetch";

export interface PresignDeps {
  readonly accountId: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
}

export const MEMBER_PHOTO_OBJECT_KEY = (memberId: string): string =>
  `members/${memberId}/avatar`;

export const MEMBER_PHOTO_MAX_BYTES = 256 * 1024; // 262144

export const MEMBER_PHOTO_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * members/{memberId}/avatar の presigned GET URL（TTL 秒）を返す。
 * 失敗時（deps 不正 / aws4fetch throw）は null を返す（fail-soft）。
 * 呼び出し元が null チェックして photoUrl を省略すること。
 */
export async function presignMemberPhotoGetUrl(
  deps: PresignDeps,
  objectKey: string,
  ttlSeconds: number,
): Promise<string | null> {
  if (
    !deps.accountId ||
    !deps.accessKeyId ||
    !deps.secretAccessKey ||
    ttlSeconds <= 0
  ) {
    return null;
  }
  try {
    const endpoint = `https://${deps.accountId}.r2.cloudflarestorage.com/${deps.bucket}/${encodeURIComponent(objectKey).replace(/%2F/g, "/")}`;
    const aws = new AwsClient({
      accessKeyId: deps.accessKeyId,
      secretAccessKey: deps.secretAccessKey,
      service: "s3",
      region: "auto",
    });
    const signed = await aws.sign(
      new Request(endpoint, { method: "GET" }),
      { aws: { signQuery: true }, expiresIn: ttlSeconds },
    );
    return signed.url;
  } catch {
    // fail-soft: presign 失敗は null 返却。detail は 200 を維持。
    return null;
  }
}
```

> `aws4fetch` はルート `package.json` か `apps/api/package.json` に依存追加が必要。
> インストール: `mise exec -- pnpm --filter @ubm-hyogo/api add aws4fetch`

---

## 6. repository — `apps/api/src/repository/memberPhotos.ts`

### 実装方針

```ts
import type { DbCtx } from "./_shared/db";
import type { MemberId } from "./_shared/brand";

export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
}

/** member_photos から 1 行取得。存在しない場合 null。 */
export async function getMemberPhoto(
  c: DbCtx,
  memberId: MemberId,
): Promise<MemberPhotoRow | null> {
  const row = await c.db
    .prepare(
      `SELECT member_id, object_key, content_type, byte_size, uploaded_by, uploaded_at
       FROM member_photos WHERE member_id = ?`,
    )
    .bind(memberId)
    .first<{
      member_id: string;
      object_key: string;
      content_type: string;
      byte_size: number;
      uploaded_by: string;
      uploaded_at: string;
    }>();
  if (!row) return null;
  return {
    memberId: row.member_id,
    objectKey: row.object_key,
    contentType: row.content_type,
    byteSize: row.byte_size,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

/** member_photos を INSERT OR REPLACE（upsert）する。 */
export async function upsertMemberPhoto(
  c: DbCtx,
  row: Omit<MemberPhotoRow, "uploadedAt">,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT OR REPLACE INTO member_photos
       (member_id, object_key, content_type, byte_size, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(row.memberId, row.objectKey, row.contentType, row.byteSize, row.uploadedBy)
    .run();
}

/** member_photos から 1 行削除する。 */
export async function deleteMemberPhoto(
  c: DbCtx,
  memberId: MemberId,
): Promise<void> {
  await c.db
    .prepare(`DELETE FROM member_photos WHERE member_id = ?`)
    .bind(memberId)
    .run();
}
```

---

## 7. route 実装 — `apps/api/src/routes/admin/members.ts`

### `POST /admin/members/:memberId/photo`

`createAdminMembersRoute` 内（`app.use("*", requireAdmin)` 配下）に追加する。

```ts
app.post("/members/:memberId/photo", async (c) => {
  const memberId = c.req.param("memberId") as MemberId;
  if (!c.env?.DB) return c.json({ ok: false, error: "DB binding missing" }, 503);

  // member 存在確認
  const db = ctx({ DB: c.env.DB });
  const identity = await findMemberById(db, memberId);
  if (!identity) return c.json({ ok: false, error: "member not found" }, 404);

  // multipart body 取得
  const formData = await c.req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return c.json({ ok: false, error: "file field required" }, 400);
  }

  // MIME 検証
  if (!(MEMBER_PHOTO_ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return c.json({ ok: false, error: "unsupported media type" }, 415);
  }

  // サイズ検証
  const buf = await file.arrayBuffer();
  if (buf.byteLength === 0) return c.json({ ok: false, error: "empty file" }, 400);
  if (buf.byteLength > MEMBER_PHOTO_MAX_BYTES) {
    return c.json({ ok: false, error: "file too large" }, 413);
  }

  const objectKey = MEMBER_PHOTO_OBJECT_KEY(memberId);

  // R2 put（binding が無い場合は 503）
  if (!c.env.MEMBER_PHOTOS) {
    return c.json({ ok: false, error: "R2 binding missing" }, 503);
  }
  await c.env.MEMBER_PHOTOS.put(objectKey, buf, {
    httpMetadata: { contentType: file.type },
  });

  // D1 upsert
  const admin = c.get("admin"); // requireAdmin がセットする admin info
  await upsertMemberPhoto(db, {
    memberId,
    objectKey,
    contentType: file.type,
    byteSize: buf.byteLength,
    uploadedBy: admin.email ?? "unknown",
  });

  // audit
  await writeAuditLog(db, {
    actorId: admin.adminId ?? null,
    actorEmail: admin.email ?? null,
    action: "admin.member.photo_uploaded" as AuditAction,
    targetType: "member",
    targetId: memberId,
    after: { objectKey, contentType: file.type, byteSize: buf.byteLength },
  });

  return c.json({ ok: true });
});
```

### `DELETE /admin/members/:memberId/photo`

```ts
app.delete("/members/:memberId/photo", async (c) => {
  const memberId = c.req.param("memberId") as MemberId;
  if (!c.env?.DB) return c.json({ ok: false, error: "DB binding missing" }, 503);

  const db = ctx({ DB: c.env.DB });
  const photo = await getMemberPhoto(db, memberId);
  if (!photo) return c.json({ ok: false, error: "photo not found" }, 404);

  // R2 delete
  if (c.env.MEMBER_PHOTOS) {
    await c.env.MEMBER_PHOTOS.delete(photo.objectKey);
  }

  // D1 delete
  await deleteMemberPhoto(db, memberId);

  // audit
  const admin = c.get("admin");
  await writeAuditLog(db, {
    actorId: admin.adminId ?? null,
    actorEmail: admin.email ?? null,
    action: "admin.member.photo_deleted" as AuditAction,
    targetType: "member",
    targetId: memberId,
    before: { objectKey: photo.objectKey },
  });

  return c.json({ ok: true });
});
```

### `GET /admin/members/:memberId` 拡張

既存の detail handler を以下の手順で拡張する（`buildAdminMemberDetailView` を R2 依存にしない設計）。

```ts
// 既存 detail handler 内（buildAdminMemberDetailView の呼び出し後）に追記
const view = await buildAdminMemberDetailView(db, mid, adminNotes, deps);
if (!view) return c.json({ ok: false, error: "not found" }, 404);

// photoUrl 解決（fail-soft）
let photoUrl: string | undefined;
if (c.env.R2_ACCOUNT_ID && c.env.R2_ACCESS_KEY_ID && c.env.R2_SECRET_ACCESS_KEY) {
  const photo = await getMemberPhoto(db, mid);
  if (photo) {
    const bucketName = c.env.MEMBER_PHOTOS
      ? (c.env.ENVIRONMENT === "production"
          ? "ubm-hyogo-member-photos-prod"
          : "ubm-hyogo-member-photos-staging")
      : null;
    if (bucketName) {
      const url = await presignMemberPhotoGetUrl(
        {
          accountId: c.env.R2_ACCOUNT_ID,
          accessKeyId: c.env.R2_ACCESS_KEY_ID,
          secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
          bucket: bucketName,
        },
        photo.objectKey,
        300, // TTL 300s
      );
      if (url) photoUrl = url;
    }
  }
}

// photoUrl を view に後段マージ（builder を R2 非依存に保つ）
return c.json(photoUrl !== undefined ? { ...view, photoUrl } : view);
```

---

## 8. shared schema 変更

### `packages/shared/src/zod/viewmodel.ts`（L291-312 の `AdminMemberDetailViewZ`）

```ts
// 変更前（L291-312）
export const AdminMemberDetailViewZ = z
  .object({
    identityMemberId: z.string().min(1),
    identityEmail: EmailZ,
    status: z.object({
      publicConsent: ConsentStatusZ,
      rulesConsent: ConsentStatusZ,
      publishState: PublishStateZ,
      isDeleted: z.boolean(),
      notificationOptOut: z.boolean(),
    }),
    profile: MemberProfileZ,
    audit: z.array(
      z.object({
        actor: z.string().min(1),
        action: z.string(),
        occurredAt: Iso8601Z,
        note: z.string().nullable(),
      }),
    ),
  })
  .strict();

// 変更後（photoUrl を追加、.strict() 維持）
export const AdminMemberDetailViewZ = z
  .object({
    identityMemberId: z.string().min(1),
    identityEmail: EmailZ,
    status: z.object({
      publicConsent: ConsentStatusZ,
      rulesConsent: ConsentStatusZ,
      publishState: PublishStateZ,
      isDeleted: z.boolean(),
      notificationOptOut: z.boolean(),
    }),
    profile: MemberProfileZ,
    audit: z.array(
      z.object({
        actor: z.string().min(1),
        action: z.string(),
        occurredAt: Iso8601Z,
        note: z.string().nullable(),
      }),
    ),
    photoUrl: z.string().url().optional(), // ← issue-983 AC-2
  })
  .strict();
```

### `packages/shared/src/types/viewmodel/index.ts`

`AdminMemberDetailView` interface に追加:

```ts
readonly photoUrl?: string; // issue-983 AC-2: presigned GET URL（TTL 300s）
```

---

## 9. web 実装

### `apps/web/src/components/ui/Avatar.tsx`（全文置換）

現行 L1-31 を以下に置換する。

```tsx
"use client";
import { useState } from "react";

function hashStringToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash % 360;
}

export interface AvatarProps {
  memberId?: string;
  name: string;
  hue?: number;
  src?: string;      // issue-983: 有れば <img>、onError で hue fallback
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ memberId, name, hue, src, size = "md", className }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedHue = hue ?? hashStringToHue(memberId ?? name);
  const hueBucket = Math.round((((resolvedHue % 360) + 360) % 360) / 30) % 12;
  const initial = name.trim().charAt(0) || "?";

  if (src && !imgFailed) {
    return (
      <div
        role="img"
        aria-label={name}
        data-size={size}
        data-hue={hueBucket}
        className={["ui-avatar", "ui-avatar--photo", className].filter(Boolean).join(" ")}
      >
        <img
          src={src}
          alt={name}
          onError={() => setImgFailed(true)}
          className="ui-avatar__photo"
        />
      </div>
    );
  }

  // src なし / onError 後 → 従来の initial+hue div（AC-4: 現行 DOM と同一）
  return (
    <div
      role="img"
      aria-label={name}
      data-size={size}
      data-hue={hueBucket}
      className={["ui-avatar", className].filter(Boolean).join(" ")}
    >
      {initial}
    </div>
  );
}
```

> `"use client"` は追加（useState を使うため）。現行は純関数だったが client component に昇格する。
> OKLch token で色指定（HEX 禁止）— CSS は `tokens.css` の `--ubm-color-*` トークンを参照。
> `ui-avatar__photo` のスタイルは `tokens.css` または既存 CSS モジュールで `width:100%;height:100%;object-fit:cover;border-radius:inherit;` を定義する。

### `apps/web/src/features/admin/components/_members/MemberAvatar.tsx`

```tsx
"use client";
import { Avatar } from "../../../../components/ui/Avatar";
import { memberHue } from "../../../../lib/admin/member-hue";

export interface MemberAvatarProps {
  readonly memberId: string;
  readonly fullName: string;
  readonly photoUrl?: string; // issue-983: 有れば写真、無し/失敗は hue fallback
  readonly size?: "sm" | "md" | "lg";
}

export function MemberAvatar({ memberId, fullName, photoUrl, size = "md" }: MemberAvatarProps) {
  const hue8 = memberHue(memberId);
  const hue360 = Math.round((hue8 / 8) * 360);
  return (
    <Avatar
      memberId={memberId}
      name={fullName}
      hue={hue360}
      src={photoUrl}
      size={size}
    />
  );
}
```

### `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` 変更差分

`MemberDrawerBody` 関数内の `<header>` ブロック（L102-119）に upload/delete affordance を追加する。

既存の `<MemberAvatar memberId={memberId} fullName={fullName} size="md" />` を以下に置換する:

```tsx
<MemberAvatar
  memberId={memberId}
  fullName={fullName}
  photoUrl={detail.photoUrl}
  size="md"
/>
```

その下（`<div className="flex min-w-0 flex-1 flex-col">` の後）に `PhotoUploadAffordance` サブコンポーネントを配置する:

```tsx
<PhotoUploadAffordance memberId={memberId} hasPhoto={!!detail.photoUrl} />
```

`PhotoUploadAffordance` コンポーネント実装:

```tsx
interface PhotoUploadAffordanceProps {
  readonly memberId: string;
  readonly hasPhoto: boolean;
}

function PhotoUploadAffordance({ memberId, hasPhoto }: PhotoUploadAffordanceProps) {
  const { trigger: upload, isLoading: uploading } = useAdminMutation<{ ok: boolean }>(
    `/api/admin/members/${encodeURIComponent(memberId)}/photo`,
    "POST",
    {
      successMessage: "✓ 写真を更新しました",
      refreshOnSuccess: true,
      // multipart は mutationFn 経由で実装
      mutationFn: async (payload: unknown) => {
        const formData = new FormData();
        formData.append("file", payload as File);
        const res = await fetch(
          `/api/admin/members/${encodeURIComponent(memberId)}/photo`,
          { method: "POST", body: formData, credentials: "same-origin" },
        );
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return (await res.json()) as { ok: boolean };
      },
    },
  );

  const { trigger: remove, isLoading: removing } = useAdminMutation<{ ok: boolean }>(
    `/api/admin/members/${encodeURIComponent(memberId)}/photo`,
    "DELETE",
    {
      successMessage: "✓ 写真を削除しました",
      refreshOnSuccess: true,
    },
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    upload(file).catch(() => {});
    e.currentTarget.value = "";
  };

  const isLoading = uploading || removing;

  return (
    <div className="flex items-center gap-1">
      <label
        className={[
          "cursor-pointer rounded px-2 py-1 text-xs",
          "bg-[var(--ubm-color-surface-panel-2)] text-[var(--ubm-color-accent)]",
          "border border-[var(--ubm-color-border-default)]",
          isLoading ? "opacity-50 pointer-events-none" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-disabled={isLoading}
      >
        {uploading ? "アップロード中…" : "写真を変更"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isLoading}
          data-testid="photo-upload-input"
        />
      </label>
      {hasPhoto && (
        <button
          type="button"
          onClick={() => remove({}).catch(() => {})}
          disabled={isLoading}
          className={[
            "rounded px-2 py-1 text-xs",
            "text-[var(--ubm-color-danger)]",
            "border border-[var(--ubm-color-border-default)]",
            isLoading ? "opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="写真を削除"
        >
          {removing ? "削除中…" : "削除"}
        </button>
      )}
    </div>
  );
}
```

---

## 10. user-gated runtime ops（R2 bucket 作成・secret 投入）

以下はコード実装後に**ユーザーが承認した後**に実行する runtime 操作。Phase 11 / Phase 13 の user-gated gate と連動する。

### R2 bucket 作成

```bash
# staging
bash scripts/cf.sh r2 bucket create ubm-hyogo-member-photos-staging

# production
bash scripts/cf.sh r2 bucket create ubm-hyogo-member-photos-prod

# bucket 一覧確認
bash scripts/cf.sh r2 bucket list
```

### presign 用 R2 API token（scoped）作成

Cloudflare ダッシュボードで R2 API token を作成する（`Object Read and Write` 権限・対象 bucket 限定）。
発行された値を 1Password `op://UBM-Hyogo/R2-member-photos/account_id` 等に保管後:

```bash
# staging secret 投入
bash scripts/cf.sh secret put R2_ACCOUNT_ID --env staging
bash scripts/cf.sh secret put R2_ACCESS_KEY_ID --env staging
bash scripts/cf.sh secret put R2_SECRET_ACCESS_KEY --env staging

# production secret 投入
bash scripts/cf.sh secret put R2_ACCOUNT_ID --env production
bash scripts/cf.sh secret put R2_ACCESS_KEY_ID --env production
bash scripts/cf.sh secret put R2_SECRET_ACCESS_KEY --env production
```

### `.dev.vars.example` 追記

```
# issue-983: R2 member photo presign secrets (op:// 参照のみ。実値を書かないこと)
R2_ACCOUNT_ID=op://UBM-Hyogo/R2-member-photos/account_id
R2_ACCESS_KEY_ID=op://UBM-Hyogo/R2-member-photos/access_key_id
R2_SECRET_ACCESS_KEY=op://UBM-Hyogo/R2-member-photos/secret_access_key
```

---

## 11. 実行コマンド（実装後の検証）

```bash
# 型チェック
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# shared build（viewmodel 型変更を反映）
mise exec -- pnpm --filter @ubm-hyogo/shared build

# unit test（presign util / Avatar spec / shared schema）
mise exec -- pnpm exec vitest run \
  apps/api/src/lib/r2/__tests__/member-photo-presign.spec.ts \
  packages/shared/src/zod/__tests__/viewmodel-photo.spec.ts \
  apps/web/src/features/admin/components/_members/__tests__/MemberAvatar.spec.tsx

# D1 contract test（member-photo.contract.spec.ts）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts \
  apps/api/src/routes/admin/__tests__/member-photo.contract.spec.ts

# 全 unit テスト
mise exec -- pnpm exec vitest run
```

---

## 完了条件（Phase 5）

- [ ] Phase 4 の全 spec（PRESIGN-U-1〜U-8 / ROUTE-C-1〜C-10 / SCHEMA-P-1〜P-5 / AVATAR-R-1〜R-6）が GREEN
- [ ] `pnpm typecheck` が PASS（shared build 後）
- [ ] `pnpm lint` が PASS
- [ ] `0022_member_photos.sql` が `apps/api/migrations/` に存在する
- [ ] `env.ts` に `MEMBER_PHOTOS?: R2Bucket` / `R2_ACCOUNT_ID?` / `R2_ACCESS_KEY_ID?` / `R2_SECRET_ACCESS_KEY?` が追加されている
- [ ] `wrangler.toml` の staging/production に `[[r2_buckets]] binding = "MEMBER_PHOTOS"` が追加されている
- [ ] `AdminMemberDetailViewZ.photoUrl` が追加され `.strict()` が維持されている
- [ ] `Avatar` に `src?` prop が追加され `onError` で hue fallback する実装になっている
- [ ] `MemberDrawer` に upload/delete affordance が追加され `useAdminMutation` 経由になっている（invariant #10）
- [ ] R2 bucket 作成・secret 投入手順が本仕様書（§10）に明記されており、user-gated であることが記録されている

## メタ情報
workflow_state: `spec_created` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
Phase 4 のテストを満たす最小実装で、admin-managed photo avatar の垂直スライスを完成させる。

## 実行タスク
- API/storage/shared/web の実装対象を追加・編集する。
- RED テストを GREEN にする。

## 参照資料
- `phase-4.md`
- `outputs/phase-12/implementation-guide.md`

## 成果物
- Phase 5 実装仕様

## 統合テスト連携
Phase 6-9 は本 Phase の実装差分に対して拡充テスト、coverage、QA gate を実行する。
