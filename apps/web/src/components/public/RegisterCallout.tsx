// task-12: 入会登録 Google Form responderUrl への外部 CTA
// 不変条件 #2: consent キーは publicConsent / rulesConsent の 2 種のみ
// 不変条件 #7: 外部 link 遷移（target="_blank" + rel="noopener noreferrer"）。iframe 不採用
// Lane B: SectionCard でラップ（旧 Card ラッパを SectionCard に統一）。

import { ButtonLink } from "@/components/ui";

import { SectionCard } from "../ui/layout/SectionCard";

export interface RegisterCalloutProps {
  responderUrl: string;
}

export function RegisterCallout({ responderUrl }: RegisterCalloutProps) {
  return (
    <SectionCard
      as="section"
      data-component="register-callout"
      className="register-callout"
      title="Google フォームから登録"
      description={
        <>
          登録フォーム内で次の 2 つの同意項目（<code>publicConsent</code> と
          <code>rulesConsent</code>）にチェックして送信してください。回答内容は自動同期されます。
        </>
      }
      actions={
        <ButtonLink
          href={responderUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          data-role="register-cta"
        >
          Google フォームを開く
        </ButtonLink>
      }
    >
      <ul className="consent-list">
        <li>
          <strong>publicConsent</strong>: 一般会員ディレクトリへの公開掲載に同意
        </li>
        <li>
          <strong>rulesConsent</strong>: 利用規約への同意
        </li>
      </ul>
    </SectionCard>
  );
}
