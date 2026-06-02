// issue-1031: member self-upload / delete UI。
// 不変条件 #5: API は /api/me/photo proxy 経由（D1 / R2 直接禁止）。
// 不変条件 #8: 色は OKLch token のみ。新規 primitive は生やさず Avatar を再利用。
// 不変条件 #11: memberId は表示用のみ。mutation は session 由来 memberId で API が解決する。
// ロック解放（STATE-DETAIL-01）: upload / delete の lock は success / error どちらの分岐でも
//   必ず state 更新するため try/finally と等価にロックが解放される。

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import {
  uploadOwnPhoto,
  deleteOwnPhoto,
  PhotoRequestError,
} from "@/lib/api/me-photo-client";

// 許容 MIME / サイズ（server 検証と同値。client は事前 feedback 用）。
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
  readonly name?: string | undefined;
  readonly photoUrl?: string | undefined;
  readonly hue?: number | undefined;
}

const photoErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof PhotoRequestError) {
    switch (err.code) {
      case "UNSUPPORTED_MEDIA_TYPE":
        return "対応していない形式です（jpeg / png / webp のみ）。";
      case "FILE_TOO_LARGE":
        return "ファイルが大きすぎます（上限 256KB）。";
      case "EMPTY_FILE":
        return "空のファイルはアップロードできません。";
      case "RULES_CONSENT_REQUIRED":
        return "利用規約への同意が必要です。最新の Google Form から再同意してください。";
      case "RATE_LIMITED":
        return "短時間に操作が集中しました。しばらく待って再度お試しください。";
      case "UNAUTHENTICATED":
        return "セッションが切れました。再ログインしてください。";
      case "NOT_FOUND":
        return "対象の写真が見つかりませんでした。";
      default:
        return fallback;
    }
  }
  return fallback;
};

export function PhotoUpload({ memberId, name = "", photoUrl, hue }: PhotoUploadProps) {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>({ kind: "idle" });
  const [deleteState, setDeleteState] = useState<DeleteState>({ kind: "idle" });

  const isLocked =
    uploadState.kind === "uploading" || deleteState.kind === "deleting";
  const hasPhoto = Boolean(photoUrl);

  // client 事前 MIME / size チェック（即時 feedback。最終判定は server）。
  const validateFile = (file: File): string | null => {
    if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return "対応していない形式です（jpeg / png / webp のみ）。";
    }
    if (file.size > MAX_BYTES) {
      return "ファイルが大きすぎます（上限 256KB）。";
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
      // 成功: success state へ → isLocked 解放。
      setUploadState({ kind: "success" });
      router.refresh();
    } catch (err) {
      // エラー: error state へ → isLocked 解放（try/finally と等価のロック解放経路）。
      setUploadState({
        kind: "error",
        message: photoErrorMessage(err, "アップロードに失敗しました。"),
      });
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteState({ kind: "deleting" });
    try {
      await deleteOwnPhoto();
      setDeleteState({ kind: "idle" });
      router.refresh();
    } catch (err) {
      setDeleteState({
        kind: "error",
        message: photoErrorMessage(err, "削除に失敗しました。"),
      });
    }
  };

  return (
    <section aria-label="プロフィール写真" className="flex flex-col gap-3">
      <Avatar
        memberId={memberId}
        name={name}
        {...(hue !== undefined ? { hue } : {})}
        src={uploadState.kind === "success" ? undefined : photoUrl}
        size="lg"
      />

      <div className="flex items-center gap-2">
        <label
          className={[
            "cursor-pointer rounded px-3 py-1.5 text-sm",
            "bg-[var(--ubm-color-surface-panel-2)]",
            "text-[var(--ubm-color-accent)]",
            "border border-[var(--ubm-color-border-default)]",
            isLocked ? "pointer-events-none opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-disabled={isLocked}
        >
          {uploadState.kind === "uploading" ? "アップロード中…" : "写真を変更"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isLocked}
            aria-label="プロフィール写真を変更"
          />
        </label>

        {hasPhoto && deleteState.kind !== "confirm" && deleteState.kind !== "deleting" && (
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
            削除
          </button>
        )}
        {deleteState.kind === "deleting" && (
          <button
            type="button"
            disabled
            className="rounded px-3 py-1.5 text-sm text-[var(--ubm-color-danger)] border border-[var(--ubm-color-border-default)] opacity-50"
            aria-label="プロフィール写真を削除"
          >
            削除中…
          </button>
        )}
      </div>

      {deleteState.kind === "confirm" && (
        <div
          role="alertdialog"
          aria-label="写真削除の確認"
          className="flex items-center gap-2"
        >
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

      {uploadState.kind === "success" && (
        <p role="status" className="text-sm text-[var(--ubm-color-ok)]">
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
        <p role="status" className="sr-only">
          処理中
        </p>
      )}
    </section>
  );
}
