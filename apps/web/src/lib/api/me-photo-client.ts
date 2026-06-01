// issue-1031: member self photo upload / delete client helper
// 不変条件 #5: 直接 API worker を叩かず、必ず /api/me/photo proxy 経由。
// 不変条件 #11: memberId は path に出さない。session 由来 memberId のみで解決される。
// 雛形: apps/web/src/lib/api/me-requests-client.ts（SelfRequestError パターン）。

export type PhotoErrorCode =
  | "UNSUPPORTED_MEDIA_TYPE" // 415
  | "FILE_TOO_LARGE" // 413
  | "EMPTY_FILE" // 400 (empty)
  | "RULES_CONSENT_REQUIRED" // 403
  | "RATE_LIMITED" // 429
  | "UNAUTHENTICATED" // 401
  | "INVALID_REQUEST" // 400 (other)
  | "NOT_FOUND" // 404
  | "UNKNOWN"; // その他

export class PhotoRequestError extends Error {
  readonly status: number;
  readonly code: PhotoErrorCode;
  constructor(status: number, code: PhotoErrorCode, message?: string) {
    super(message ?? code);
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
