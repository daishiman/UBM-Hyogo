# Phase 5: 実装（GREEN）

> **[実装区分: 実装仕様書]**。Phase 4 の RED spec を GREEN にするための変更対象ファイルと実装方針を記載する。

---

## 0. 着手前解消事項（MINOR-1 / MINOR-3）

### MINOR-1: presign secret env キー名の確認・統一

```bash
# admin route の env キー名を確認（正解を grep）
grep -n "R2_ACCOUNT_ID\|R2_ACCESS_KEY_ID\|R2_SECRET_ACCESS_KEY" \
  apps/api/src/routes/admin/_shared.ts

# 期待: R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY の 3 キー
# MeRouteEnv にも同名で追加する（Phase 5 §2 に記述）
```

実確認結果: `apps/api/src/routes/admin/_shared.ts` L10-12 に
`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` が定義済み。
`MeRouteEnv` にも **同名** で追加する。

### MINOR-3: パッケージ filter 名確認（確定済み）

| パッケージ | filter 名 |
|---|---|
| `apps/api` | `@ubm-hyogo/api` |
| `apps/web` | `@ubm-hyogo/web` |
| `packages/shared` | `@ubm-hyogo/shared` |

Phase 4 targeted run コマンドに反映済み。

---

## 1. 変更対象ファイル一覧（index.md §1.5 inventory と一致）

### 新規作成

| ファイルパス | 責務 |
|---|---|
| `apps/api/migrations/0023_member_photos_source.sql` | `member_photos` に `source` 列を additive 追加 |
| `apps/web/app/api/me/photo/route.ts` | multipart POST / DELETE を API Worker へ proxy する Next.js Route Handler |
| `apps/web/src/lib/api/me-photo-client.ts` | `uploadOwnPhoto(file)` / `deleteOwnPhoto()` + `PhotoRequestError` |
| `apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx` | avatar 表示 + upload/delete 状態機械 + a11y |
| `apps/api/src/routes/me/__tests__/photo.route.spec.ts` | Phase 4 作成済み |
| `apps/api/src/repository/__tests__/memberPhotos.source.spec.ts` | Phase 4 作成済み |
| `apps/web/app/(member)/profile/_components/__tests__/PhotoUpload.client.component.spec.tsx` | Phase 4 作成済み |
| `apps/web/app/api/me/photo/__tests__/route.spec.ts` | Phase 4 作成済み |

### 編集

| ファイルパス | 変更内容 |
|---|---|
| `apps/api/src/repository/memberPhotos.ts` | `MemberPhotoRow.source` / `RawMemberPhotoRow.source` 追加。`getMemberPhoto` SELECT に source 追加。`upsertMemberPhoto` に `source` 引数 |
| `apps/api/src/routes/admin/members.ts` | upsert 呼び出しに `source: "admin"` を明示（既存挙動維持・backfill） |
| `apps/api/src/routes/me/index.ts` | `POST /me/photo` / `DELETE /me/photo` 追加。`MeRouteEnv` に R2 binding / presign secrets 追加。`GET /me/profile` に `photoUrl` fail-soft 同梱 |
| `apps/api/src/routes/me/schemas.ts` | `MeProfileResponseZ.photoUrl?` 追加 / `MePhotoUploadAcceptedZ` 追加 |
| `apps/web/app/(member)/profile/page.tsx` | `PhotoUpload` を mount。`photoUrl` を渡す |
| `apps/web/src/lib/api/me-types.ts` | `MeProfileResponse` に `photoUrl?: string` を追加 |
| `vitest.d1.config.ts` | `D1_INCLUDE` に `photo.route.spec.ts` / `memberPhotos.source.spec.ts` のパスを追加 |

---

## 2. Task A — storage/API layer

### 2.1 migration 0023（DDL 全文）

ファイル: `apps/api/migrations/0023_member_photos_source.sql`

```sql
-- 0023_member_photos_source.sql
-- issue-1031: member self-upload を区別する source 列を additive 追加。
-- 既存行（admin upload）は DEFAULT 'admin' で backfill される（非破壊）。
-- invariant #4: member_photos は admin-managed data。Google Form schema 表には触れない。
ALTER TABLE member_photos ADD COLUMN source TEXT NOT NULL DEFAULT 'admin';
```

- 値域: `'admin'` | `'self'`（CHECK 制約は付けない ― 既存 migration 流儀に合わせ application 層 zod / 型で担保）。
- backfill: 既存行は `DEFAULT 'admin'` で自動 backfill。明示 UPDATE 不要。
- migration 連番: 最新は `0022_member_photos.sql`。0023 が次番。
  `apps/api/migrations/sequence-exceptions.json` が存在する場合は確認し、必要なら 0023 を追記。

### 2.2 `apps/api/src/repository/memberPhotos.ts` 拡張

現行の `MemberPhotoRow` / `RawMemberPhotoRow` に `source` を追加し、
`getMemberPhoto` の SELECT / `upsertMemberPhoto` の INSERT を更新する。

```ts
// MemberPhotoRow — source フィールドを追加
export interface MemberPhotoRow {
  readonly memberId: string;
  readonly objectKey: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly uploadedBy: string;
  readonly source: "admin" | "self";   // ← 追加（issue-1031）
  readonly uploadedAt: string;
}

// RawMemberPhotoRow — DB row 対応（snake_case）
interface RawMemberPhotoRow {
  member_id: string;
  object_key: string;
  content_type: string;
  byte_size: number;
  uploaded_by: string;
  source: string;                        // ← 追加（"admin"/"self" 以外は "admin" 正規化）
  uploaded_at: string;
}

// getMemberPhoto: SELECT に source を追加
// SQL 差分: `SELECT member_id, object_key, content_type, byte_size, uploaded_by, source, uploaded_at`
// 正規化: `source: row.source === "self" ? "self" : "admin"`

// upsertMemberPhoto: 引数 Omit<MemberPhotoRow, "uploadedAt"> に source が含まれる
// SQL 差分:
//   INSERT OR REPLACE INTO member_photos
//     (member_id, object_key, content_type, byte_size, uploaded_by, source, uploaded_at)
//   VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
```

### 2.3 `apps/api/src/routes/admin/members.ts` — source 明示

`upsertMemberPhoto` の呼び出し（L540 付近）に `source: "admin"` を追加する。
これにより既存の admin upload が `source` 列追加後も `'admin'` を正しく書くことを保証する。

```ts
// 変更前（現行）
await upsertMemberPhoto(db, {
  memberId,
  objectKey,
  contentType: file.type,
  byteSize: buf.byteLength,
  uploadedBy: actorEmail,
});

// 変更後（source 明示）
await upsertMemberPhoto(db, {
  memberId,
  objectKey,
  contentType: file.type,
  byteSize: buf.byteLength,
  uploadedBy: actorEmail,
  source: "admin",  // ← issue-1031 追加。既存挙動維持・backfill 確認
});
```

### 2.4 `apps/api/src/routes/me/schemas.ts` — schema 追加

```ts
// MeProfileResponseZ に photoUrl? を追加（.strict() 維持）
export const MeProfileResponseZ = z.object({
  profile: MemberProfileZ,
  // 既存フィールド（statusSummary, editResponseUrl, pendingRequests 等）...
  photoUrl: z.string().url().optional(), // ← issue-1031 追加
}).strict();

// 新規 MePhotoUploadAcceptedZ（/me/photo POST 成功レスポンス）
export const MePhotoUploadAcceptedZ = z.object({ ok: z.literal(true) }).strict();
export type MePhotoUploadAccepted = z.infer<typeof MePhotoUploadAcceptedZ>;
```

### 2.5 `apps/api/src/routes/me/index.ts` — MeRouteEnv 拡張 + endpoint 追加

#### MeRouteEnv 拡張（MINOR-1 解消: admin route と同名キー）

```ts
export interface MeRouteEnv extends SessionGuardEnv {
  readonly ENVIRONMENT?: "production" | "staging" | "development";
  readonly GOOGLE_FORM_RESPONDER_URL?: string;
  readonly RESPONDER_URL?: string;
  // issue-1031: self-upload 用 R2 binding / presign secrets（admin route と同名キー — MINOR-1）
  readonly MEMBER_PHOTOS?: R2Bucket;
  readonly R2_ACCOUNT_ID?: string;
  readonly R2_ACCESS_KEY_ID?: string;
  readonly R2_SECRET_ACCESS_KEY?: string;
}
```

#### import 追加

```ts
import {
  getMemberPhoto,
  upsertMemberPhoto,
  deleteMemberPhoto,
} from "../../repository/memberPhotos";
import {
  MEMBER_PHOTO_ALLOWED_MIME,
  MEMBER_PHOTO_MAX_BYTES,
  MEMBER_PHOTO_OBJECT_KEY,
  presignMemberPhotoGetUrl,
  MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
} from "../../lib/r2/member-photo-presign";
import {
  MePhotoUploadAcceptedZ,
} from "./schemas";
```

#### resolveMyPhotoUrl ヘルパー（admin の resolvePhotoUrl と同ロジック）

`createMeRoute` 内（または top-level）に以下のヘルパーを定義する（admin route と重複しないよう me/index.ts に閉じる）。

```ts
// issue-1031: /me/profile の photoUrl fail-soft 解決（admin route の resolvePhotoUrl と同ロジック）
// invariant #4 整合コメント: member_photos は admin-managed data（Google Form schema 外）であり、
// invariant #4「Form 本文編集禁止」の対象外。photo は本人直接 mutate を許容する（Phase 2 §2.2 参照）。
const resolveMyPhotoUrl = async (
  env: MeRouteEnv,
  db: DbCtx,
  memberId: string,
): Promise<string | undefined> => {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    return undefined;
  }
  const photo = await getMemberPhoto(db, memberId as MemberId);
  if (!photo) return undefined;
  const bucketName = env.MEMBER_PHOTOS
    ? env.ENVIRONMENT === "production"
      ? "ubm-hyogo-member-photos-prod"
      : "ubm-hyogo-member-photos-staging"
    : null;
  if (!bucketName) return undefined;
  const url = await presignMemberPhotoGetUrl(
    {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: bucketName,
    },
    photo.objectKey,
    MEMBER_PHOTO_PRESIGN_TTL_SECONDS,
  );
  return url ?? undefined;
};
```

#### POST /me/photo 実装

`app.use("*", sessionGuard(...))` の後に追加する。

```ts
// POST /me/photo — member self-upload
// middleware: sessionGuard（/me/* 全体に適用済み）→ requireRulesConsent → rateLimitSelfRequest
app.post(
  "/photo",
  requireRulesConsent,
  rateLimitSelfRequest,
  async (c) => {
    const user = c.get("user");
    const memberId = user.memberId;
    const ctx = c.get("ctx");

    // multipart body
    const formData = await c.req.formData().catch(() => null);
    const file = formData?.get("file");
    if (!file || !(file instanceof File)) {
      return c.json({ ok: false, error: "file field required" }, 400);
    }

    // MIME 検証
    if (!(MEMBER_PHOTO_ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return c.json({ ok: false, error: "unsupported media type" }, 415);
    }

    // バイト数検証
    const buf = await file.arrayBuffer();
    if (buf.byteLength === 0) {
      return c.json({ ok: false, error: "empty file" }, 400);
    }
    if (buf.byteLength > MEMBER_PHOTO_MAX_BYTES) {
      return c.json({ ok: false, error: "file too large" }, 413);
    }

    // R2 binding 確認
    if (!c.env.MEMBER_PHOTOS) {
      return c.json({ ok: false, error: "R2 binding missing" }, 503);
    }

    const objectKey = MEMBER_PHOTO_OBJECT_KEY(memberId);

    // R2 put
    await c.env.MEMBER_PHOTOS.put(objectKey, buf, {
      httpMetadata: { contentType: file.type },
    });

    // D1 upsert（source='self' — invariant #4 整合: photo は Form 本文外）
    await upsertMemberPhoto(ctx, {
      memberId,
      objectKey,
      contentType: file.type,
      byteSize: buf.byteLength,
      uploadedBy: user.email,
      source: "self",
    });

    // audit（actor = session email。admin 系 "admin.member.photo_uploaded" とは区別）
    await auditAction(ctx, {
      action: "member.photo_uploaded",
      targetType: "member",
      targetId: memberId,
      actorEmail: user.email,
      after: { objectKey, contentType: file.type, byteSize: buf.byteLength, source: "self" },
    });

    return c.json(MePhotoUploadAcceptedZ.parse({ ok: true }));
  },
);
```

> `auditAction` の呼び出し形式は既存 `/me` 内の audit call（visibility-request 等）を参照し合わせる。
> `auditAction` は free-text brand（enum 更新不要）— index.md §2 確定済み。

#### DELETE /me/photo 実装

```ts
// DELETE /me/photo — member self-delete（同意ゲート不要。sessionGuard のみ）
app.delete("/photo", async (c) => {
  const user = c.get("user");
  const memberId = user.memberId;
  const ctx = c.get("ctx");

  const photo = await getMemberPhoto(ctx, memberId as MemberId);
  if (!photo) {
    return c.json({ ok: false, error: "photo not found" }, 404);
  }

  // R2 delete（binding 有時のみ。無くても D1 は削除する）
  if (c.env.MEMBER_PHOTOS) {
    await c.env.MEMBER_PHOTOS.delete(photo.objectKey);
  }

  // D1 delete
  await deleteMemberPhoto(ctx, memberId as MemberId);

  // audit
  await auditAction(ctx, {
    action: "member.photo_deleted",
    targetType: "member",
    targetId: memberId,
    actorEmail: user.email,
    before: { objectKey: photo.objectKey },
  });

  return c.json({ ok: true });
});
```

#### GET /me/profile 拡張（photoUrl fail-soft 同梱）

既存の `app.get("/profile", ...)` handler 内で profile 組み立て完了後、以下を挿入する。

```ts
// issue-1031: presign で photoUrl を fail-soft 同梱（失敗時は photoUrl なし・200 維持）
const photoUrl = await resolveMyPhotoUrl(c.env, ctx, user.memberId).catch(() => undefined);

const responseBody = {
  ...existingProfileBody,
  ...(photoUrl !== undefined ? { photoUrl } : {}),
};
return c.json(MeProfileResponseZ.parse(responseBody));
```

---

## 3. Task B — web layer

### 3.1 `apps/web/src/lib/api/me-photo-client.ts`（新規）

既存 `me-requests-client.ts` の `SelfRequestError` パターンを踏襲する。

```ts
// apps/web/src/lib/api/me-photo-client.ts
// issue-1031: member self-upload / delete クライアント
// 雛形: apps/web/src/lib/api/me-requests-client.ts（SelfRequestError パターン）

export type PhotoErrorCode =
  | "UNSUPPORTED_MEDIA_TYPE"   // 415
  | "FILE_TOO_LARGE"           // 413
  | "EMPTY_FILE"               // 400 (empty)
  | "RULES_CONSENT_REQUIRED"   // 403
  | "RATE_LIMITED"             // 429
  | "UNAUTHENTICATED"          // 401
  | "INVALID_REQUEST"          // 400 (other)
  | "NOT_FOUND"                // 404
  | "UNKNOWN";                 // その他

export class PhotoRequestError extends Error {
  readonly status: number;
  readonly code: PhotoErrorCode;
  constructor(status: number, code: PhotoErrorCode, message: string) {
    super(message);
    this.name = "PhotoRequestError";
    this.status = status;
    this.code = code;
  }
}

const mapStatus = (status: number, body: string): PhotoErrorCode => {
  if (status === 415) return "UNSUPPORTED_MEDIA_TYPE";
  if (status === 413) return "FILE_TOO_LARGE";
  if (status === 403) return "RULES_CONSENT_REQUIRED";
  if (status === 429) return "RATE_LIMITED";
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 404) return "NOT_FOUND";
  if (status === 400) {
    if (body.includes("empty")) return "EMPTY_FILE";
    return "INVALID_REQUEST";
  }
  return "UNKNOWN";
};

/** multipart POST /api/me/photo でファイルをアップロードする。失敗時は PhotoRequestError を throw。 */
export async function uploadOwnPhoto(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/me/photo", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PhotoRequestError(res.status, mapStatus(res.status, text), text);
  }
}

/** DELETE /api/me/photo で写真を削除する。失敗時は PhotoRequestError を throw。 */
export async function deleteOwnPhoto(): Promise<void> {
  const res = await fetch("/api/me/photo", {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new PhotoRequestError(res.status, mapStatus(res.status, text), text);
  }
}
```

### 3.2 `apps/web/app/api/me/photo/route.ts`（新規）

雛形: `apps/web/app/api/me/visibility-request/route.ts`（proxy パターン）。
multipart の body はそのまま stream 転送する（Content-Type を再構築しない）。

```ts
// apps/web/app/api/me/photo/route.ts
// issue-1031: /api/me/photo (Next.js Route Handler) → API Worker /me/photo proxy
// MINOR-2 解消: multipart は body そのまま転送（Content-Type: multipart/form-data は stream で維持）

import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:8787";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const upstream = await fetch(`${API_BASE}/me/photo`, {
    method: "POST",
    headers: {
      // cookie を転送（認証）
      cookie: req.headers.get("cookie") ?? "",
      // Content-Type は multipart/form-data で body が決まるため転送する
      ...(req.headers.get("content-type")
        ? { "content-type": req.headers.get("content-type")! }
        : {}),
    },
    body: req.body,
    // @ts-expect-error: Next.js の duplex 設定
    duplex: "half",
  });
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const upstream = await fetch(`${API_BASE}/me/photo`, {
    method: "DELETE",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
  });
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
```

> `INTERNAL_API_BASE_URL` は existing proxy routes と同じ env variable を使用する。
> 既存 `visibility-request/route.ts` の API_BASE 定数を確認し同名に揃えること。

### 3.3 `apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx`（新規）

雛形: `VisibilityRequest.client.tsx`。

```tsx
// apps/web/app/(member)/profile/_components/PhotoUpload.client.tsx
// issue-1031: member self-upload/delete UI
// 不変条件 #8: 色は OKLch token のみ。新規 primitive は生やさない。
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { uploadOwnPhoto, deleteOwnPhoto, PhotoRequestError } from "@/lib/api/me-photo-client";

// 許容 MIME / サイズ（server 検証と同値。client は事前 feedback 用）
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 256 * 1024; // 262144

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type DeleteState =
  | { kind: "idle" }
  | { kind: "confirm" }
  | { kind: "deleting" }
  | { kind: "error"; message: string };

export interface PhotoUploadProps {
  readonly memberId: string;
  readonly name?: string;
  readonly photoUrl?: string;
  readonly hue?: number;
}

export function PhotoUpload({ memberId, name = "", photoUrl, hue }: PhotoUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" });
  const [deleteState, setDeleteState] = useState<DeleteState>({ kind: "idle" });

  const isLocked =
    uploadState.kind === "uploading" || deleteState.kind === "deleting";

  // client 事前 MIME/size チェック
  const validateFile = (file: File): string | null => {
    if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return `対応していない形式です（jpeg / png / webp のみ）`;
    }
    if (file.size > MAX_BYTES) {
      return `ファイルが大きすぎます（上限 256KB）`;
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({ kind: "error", message: validationError });
      return;
    }

    setUploadState({ kind: "uploading" });
    try {
      await uploadOwnPhoto(file);
      setUploadState({ kind: "success" });
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof PhotoRequestError
          ? `アップロードに失敗しました（${err.code}）`
          : "アップロードに失敗しました";
      setUploadState({ kind: "error", message: msg });
      // ロック解放: finally で isLocked が解除される（try/finally 経路）
    }
    // NOTE: try/finally を使わず catch で明示的に状態更新することで
    // success / error どちらでも isLocked が解放されることを保証する。
    // （setUploadState を両ブランチで呼ぶことが try/finally と等価）
  };

  const handleDeleteConfirm = async () => {
    setDeleteState({ kind: "deleting" });
    try {
      await deleteOwnPhoto();
      setDeleteState({ kind: "idle" });
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof PhotoRequestError
          ? `削除に失敗しました（${err.code}）`
          : "削除に失敗しました";
      setDeleteState({ kind: "error", message: msg });
      // ロック解放: error 状態にセットすることで isLocked が解除される
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* アバター表示 */}
      <Avatar
        memberId={memberId}
        name={name}
        hue={hue}
        src={uploadState.kind === "success" ? undefined : photoUrl}
        size="lg"
      />

      {/* upload 操作 */}
      <div className="flex items-center gap-2">
        <label
          className={[
            "cursor-pointer rounded px-3 py-1.5 text-sm",
            "bg-[var(--ubm-color-surface-panel-2)]",
            "text-[var(--ubm-color-accent)]",
            "border border-[var(--ubm-color-border-default)]",
            isLocked ? "opacity-50 pointer-events-none" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-disabled={isLocked}
        >
          {uploadState.kind === "uploading" ? "アップロード中…" : "写真を変更"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isLocked}
            aria-label="プロフィール写真を変更"
          />
        </label>

        {/* 削除ボタン（photo 登録済みの場合のみ表示） */}
        {photoUrl && deleteState.kind !== "confirm" && (
          <button
            type="button"
            onClick={() => setDeleteState({ kind: "confirm" })}
            disabled={isLocked}
            className={[
              "rounded px-3 py-1.5 text-sm",
              "text-[var(--ubm-color-danger)]",
              "border border-[var(--ubm-color-border-default)]",
              isLocked ? "opacity-50" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="プロフィール写真を削除"
          >
            {deleteState.kind === "deleting" ? "削除中…" : "削除"}
          </button>
        )}
      </div>

      {/* 削除確認 */}
      {deleteState.kind === "confirm" && (
        <div role="alertdialog" aria-label="削除確認" className="flex items-center gap-2">
          <span className="text-sm">写真を削除しますか？</span>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className="rounded px-2 py-1 text-sm text-[var(--ubm-color-danger)] border border-[var(--ubm-color-border-default)]"
          >
            削除する
          </button>
          <button
            type="button"
            onClick={() => setDeleteState({ kind: "idle" })}
            className="rounded px-2 py-1 text-sm border border-[var(--ubm-color-border-default)]"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* 状態メッセージ */}
      {uploadState.kind === "success" && (
        <p role="status" className="text-sm text-[var(--ubm-color-success)]">
          写真を更新しました
        </p>
      )}
      {uploadState.kind === "error" && (
        <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">
          {uploadState.message}
        </p>
      )}
      {deleteState.kind === "error" && (
        <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">
          {deleteState.message}
        </p>
      )}
      {(uploadState.kind === "uploading" || deleteState.kind === "deleting") && (
        <p role="status" className="sr-only">処理中</p>
      )}
    </div>
  );
}
```

> **ロック変数解放（STATE-DETAIL-01）**: upload / delete の lock（`isLocked`）は `uploadState` / `deleteState` の state 遷移で管理。
> 正常終了: success state にセット → `isLocked = false`。
> エラー: error state にセット → `isLocked = false`。
> すなわち **try/catch の catch ブランチで必ず state を更新する**ことが「try/finally と等価」のロック解放経路。
> Phase 4 PHOTO-UP-6 / PHOTO-UP-10 がこの経路を検証する。

### 3.4 `apps/web/app/(member)/profile/page.tsx` — PhotoUpload mount

既存の Server Component で `/me/profile` から取得した `profileRes` を使い `PhotoUpload` を mount する。

```tsx
// 既存 import に追加
import { PhotoUpload } from "./_components/PhotoUpload.client";

// Server Component 内（ProfileHeader 付近）に追加
<PhotoUpload
  memberId={me.user.memberId}
  name={profileRes.profile.fullName ?? ""}
  photoUrl={profileRes.photoUrl}
/>
```

### 3.5 `apps/web/src/lib/api/me-types.ts` — photoUrl 追加

```ts
export interface MeProfileResponse {
  // 既存フィールド
  profile: MemberProfile;
  // ...
  photoUrl?: string; // issue-1031: self-upload presigned URL（存在する場合のみ）
}
```

---

## 4. 実行コマンド（実装後の検証）

```bash
# shared build（schema 型変更を反映）
mise exec -- pnpm --filter @ubm-hyogo/shared build

# 型チェック
mise exec -- pnpm typecheck

# lint（OKLch token / no-restricted-globals 等の確認）
mise exec -- pnpm lint

# api unit + D1 contract
mise exec -- pnpm --filter @ubm-hyogo/api \
  exec vitest run --config ../../vitest.d1.config.ts \
  apps/api/src/routes/me/__tests__/photo.route.spec.ts \
  apps/api/src/repository/__tests__/memberPhotos.source.spec.ts

# web unit（PhotoUpload / proxy）
mise exec -- pnpm --filter @ubm-hyogo/web \
  exec vitest run \
  "apps/web/app/(member)/profile/_components/__tests__/PhotoUpload.client.component.spec.tsx" \
  "apps/web/app/api/me/photo/__tests__/route.spec.ts"

# 全 unit テスト（回帰確認）
mise exec -- pnpm exec vitest run
```

---

## 完了条件（Phase 5）

- [ ] Phase 4 の全 spec（ME-PHOTO-C-1〜C-21 / REPO-SRC-1〜8 / PHOTO-UP-1〜17 / PROXY-1〜10）が GREEN
- [ ] `pnpm typecheck` が PASS（shared build 後）
- [ ] `pnpm lint` が PASS（OKLch token / no-restricted-globals ルール含む）
- [ ] `0023_member_photos_source.sql` が `apps/api/migrations/` に存在する
- [ ] `memberPhotos.ts` の `upsertMemberPhoto` に `source` 引数が追加されている
- [ ] `admin/members.ts` の upsert 呼び出しに `source: "admin"` が明示されている
- [ ] `apps/api/src/routes/me/index.ts` に `POST /me/photo` / `DELETE /me/photo` が mount されている
- [ ] `MeRouteEnv` に `MEMBER_PHOTOS?` / `R2_ACCOUNT_ID?` / `R2_ACCESS_KEY_ID?` / `R2_SECRET_ACCESS_KEY?` が追加されている（admin route と同名 — MINOR-1 解消）
- [ ] `MeProfileResponseZ.photoUrl?` が追加され `.strict()` が維持されている
- [ ] `GET /me/profile` が presign 失敗時・row 無し時でも 200 を返す（fail-soft 維持）
- [ ] `PhotoUpload.client.tsx` の upload/delete ロック変数が catch ブランチで確実に解放されている（STATE-DETAIL-01）
- [ ] proxy route が multipart body を stream 転送しており Content-Type を再構築していない（MINOR-2 解消）
- [ ] `me-types.ts` の `MeProfileResponse` に `photoUrl?: string` が追加されている

## メタ情報
workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 参照資料
- `phase-4.md`
- `phase-2.md`（contract 仕様正本）

## 統合テスト連携
Phase 6-9 は本 Phase の実装差分に対して拡充テスト、coverage、QA gate を実行する。
