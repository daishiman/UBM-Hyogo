// serial-05: /(public)/register — blueprint 09e:473-560
// `/register` 登録案内 (Server Component)
// task-12 で RegisterHeroCallout primitive 接続。
// 不変条件 #2: consent キーは publicConsent / rulesConsent
// 不変条件 #7: 外部 link 遷移（target="_blank"）。iframe 不採用

import type { Metadata } from "next";
import type { z } from "zod";

import { FormPreviewViewZ } from "@ubm-hyogo/shared";

import { buildPageMetadata } from "@/lib/seo/site-metadata";

import { RegisterBottomCTA } from "../../../src/components/public/RegisterBottomCTA";
import { RegisterFaq } from "../../../src/components/public/RegisterFaq";
import { RegisterHeroCallout } from "../../../src/components/public/RegisterHeroCallout";
import { RegisterStepGrid } from "../../../src/components/public/RegisterStepGrid";
import { FormPreviewSections } from "../../../src/components/public/FormPreviewSections";
import { FORM_RESPONDER_URL } from "../../../src/lib/constants/form";
import { fetchPublic } from "../../../src/lib/fetch/public";

type FormPreviewView = z.infer<typeof FormPreviewViewZ>;

export const dynamic = "force-dynamic";
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "入会案内",
    description:
      "UBM 兵庫支部会への入会フォーム案内。Google Form に遷移します",
    path: "/register",
  });
}

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
    <main data-page="register" className="stack-lg" data-route="public" data-section-rhythm="comfortable">
      <header className="page-head">
        <div>
          <p className="eyebrow">MEMBER REGISTRATION</p>
          <h1>メンバー登録</h1>
          <p className="muted" data-role="lead">
            回答は Google フォームから行います。数分で完了します。
          </p>
        </div>
      </header>
      <RegisterHeroCallout
        responderUrl={responderUrl}
        sectionCount={preview?.sectionCount ?? 0}
        fieldCount={preview?.fieldCount ?? 0}
      />
      <RegisterStepGrid />
      {previewError ? (
        <p role="alert" data-role="preview-error">
          {previewError}
        </p>
      ) : preview ? (
        <FormPreviewSections preview={preview} />
      ) : null}
      <RegisterFaq />
      <p className="muted" data-role="privacy-note">
        登録前に <a href="/privacy">プライバシーポリシー</a> と{" "}
        <a href="/terms">利用規約</a> を確認できます。ログイン済みの方は{" "}
        <a href="/login">ログインページ</a> に進んでください。
      </p>
      <RegisterBottomCTA responderUrl={responderUrl} />
    </main>
  );
}
