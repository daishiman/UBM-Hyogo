// `/register` 登録案内 (Server Component)
// task-12 で RegisterCallout primitive 接続。
// 不変条件 #2: consent キーは publicConsent / rulesConsent
// 不変条件 #7: 外部 link 遷移（target="_blank"）。iframe 不採用

import type { z } from "zod";

import { FormPreviewViewZ } from "@ubm-hyogo/shared";

import { FormPreviewSections } from "../../../src/components/public/FormPreviewSections";
import { RegisterCallout } from "../../../src/components/public/RegisterCallout";
import { FORM_RESPONDER_URL } from "../../../src/lib/constants/form";
import { fetchPublic } from "../../../src/lib/fetch/public";

type FormPreviewView = z.infer<typeof FormPreviewViewZ>;

export const dynamic = "force-dynamic";
export const revalidate = 600;

export default async function RegisterPage() {
  let preview: FormPreviewView | null = null;
  let responderUrl: string = FORM_RESPONDER_URL;
  let previewError: string | null = null;

  try {
    preview = await fetchPublic<FormPreviewView>("/public/form-preview", {
      revalidate: 600,
    });
    responderUrl = preview.responderUrl ?? FORM_RESPONDER_URL;
  } catch (_err) {
    previewError =
      "フォーム情報を取得できませんでした。登録は下のリンクから進めてください。";
  }

  return (
    <main data-page="register" className="stack-lg">
      <header className="page-head">
        <p className="eyebrow">REGISTER</p>
        <h1>UBM 兵庫支部会への登録</h1>
        <p className="muted">
          登録は次の流れで進みます: Google Form 回答 → 自動同期 → ログイン → マイページ確認。
        </p>
      </header>
      <RegisterCallout responderUrl={responderUrl} />
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
