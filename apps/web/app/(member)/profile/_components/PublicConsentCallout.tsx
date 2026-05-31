// issue-958 Track A: profile に publicConsent 状態カードを表示する。
// 不変条件: mutation を持たない（表示のみ）。Google Form 再回答 URL への外部リンクのみ。
// INV-4 (CLAUDE.md #7): publicConsent の更新経路は Google Form 再回答が正規経路。

import type { JSX } from "react";
import type { ConsentStatus } from "@ubm-hyogo/shared";
import { Banner } from "@/components/ui/Banner";
import { buttonVariants } from "@/components/ui/Button";

export interface PublicConsentCalloutProps {
  readonly publicConsent: ConsentStatus;
  /**
   * `/me/profile` レスポンスに含まれる editResponseUrl（個別 Form 再回答 URL）。
   * null のとき responderUrl にフォールバックする。
   */
  readonly editResponseUrl: string | null;
  /**
   * Google Form の汎用 responderUrl（CLAUDE.md fixed value）。
   * editResponseUrl が null のとき表示する fallback CTA target。
   */
  readonly responderUrl: string;
}

type View = {
  readonly tone: "success" | "warning";
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
};

function derive(
  publicConsent: ConsentStatus,
): View {
  switch (publicConsent) {
    case "consented":
      return {
        tone: "success",
        title: "公開メンバー一覧に掲載されています",
        description:
          "現在の同意状態: 公開許可済み。変更したい場合は Google Form の再回答で更新できます。",
        ctaLabel: "Google Form で確認",
      };
    case "declined":
      return {
        tone: "warning",
        title: "公開メンバー一覧に表示されていません",
        description:
          "現在の同意状態: 非公開。掲載に切り替えるには Google Form で再回答してください。",
        ctaLabel: "Google Form で再回答する",
      };
    default:
      return {
        tone: "warning",
        title: "公開設定が未確認です",
        description:
          "現在の同意状態: 未確認。Google Form で同意状態を確定してください。",
        ctaLabel: "Google Form で再回答する",
      };
  }
}

export function PublicConsentCallout(
  props: PublicConsentCalloutProps,
): JSX.Element {
  const view = derive(props.publicConsent);
  const href = props.editResponseUrl ?? props.responderUrl;

  return (
    <section
      aria-label={view.title}
      data-region="public-consent-callout"
      data-public-consent={props.publicConsent}
    >
      <Banner
        tone={view.tone}
        title={view.title}
        action={
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonVariants({ variant: "primary", size: "sm" })}
            data-testid="public-consent-cta"
          >
            {view.ctaLabel}
          </a>
        }
      >
        <p>{view.description}</p>
      </Banner>
    </section>
  );
}
