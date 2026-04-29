// `/register` 登録案内 (Server Component)
// AC-11 — responderUrl + form-preview を表示
// 不変条件 #1: stableKey 経由のみ参照
// 不変条件 #9: `/no-access` を経由しない

import type { z } from "zod";

import { FormPreviewViewZ } from "@ubm-hyogo/shared";

import { FormPreviewSections } from "../../../src/components/public/FormPreviewSections";
import { fetchPublic } from "../../../src/lib/fetch/public";

type FormPreviewView = z.infer<typeof FormPreviewViewZ>;

// 01-api-schema.md の固定値。env override 時は preview.responderUrl を採用。
const FALLBACK_RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export default async function RegisterPage() {
  let preview: FormPreviewView | null = null;
  let responderUrl = FALLBACK_RESPONDER_URL;
  let previewError: string | null = null;

  try {
    preview = await fetchPublic<FormPreviewView>("/public/form-preview", {
      revalidate: 600,
    });
    responderUrl = preview.responderUrl ?? FALLBACK_RESPONDER_URL;
  } catch (_err) {
    // F-08: form-preview 取得失敗時も responderUrl 経由の登録導線は維持する
    previewError = "フォーム情報を取得できませんでした。登録は下のリンクから進めてください。";
  }

  return (
    <main data-page="register">
      <h1>UBM 兵庫支部会への登録</h1>
      <p>
        登録は以下の流れで進みます: Google Form 回答 → 自動同期 → ログイン → マイページ確認。
      </p>
      <a
        href={responderUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-role="responder-link"
        data-variant="primary"
      >
        Google Form で登録する
      </a>
      {previewError ? (
        <p role="alert" data-role="preview-error">
          {previewError}
        </p>
      ) : preview ? (
        <FormPreviewSections preview={preview} />
      ) : null}
      <p>
        ログイン済みの方はそのまま <a href="/login">/login</a> に進んでください。
      </p>
    </main>
  );
}
