// HomePage 末尾 "FOR MEMBERS" dark variant CTA section（prototype pages-public.jsx:136-149）
// 不変条件 #7: 外部 link 遷移（target="_blank" + rel="noopener noreferrer"）
import type { ReactElement } from "react";

import { Icon } from "../ui/Icon";

export interface CallToActionCTAProps {
  readonly responderUrl: string;
  readonly heading?: string;
  readonly body?: string;
  readonly ctaLabel?: string;
}

export function CallToActionCTA({
  responderUrl,
  heading = "メンバー情報の掲載をお願いします",
  body = "最新の Google フォームから回答するだけで、このページに自動で反映されます。表記の修正は管理者が編集できます。",
  ctaLabel = "回答フォームを開く",
}: CallToActionCTAProps): ReactElement {
  return (
    <section
      data-component="call-to-action-cta"
      data-variant="dark"
      className="call-to-action-cta"
    >
      <div className="call-to-action-cta__inner">
        <div className="call-to-action-cta__copy">
          <p className="call-to-action-cta__eyebrow">FOR MEMBERS</p>
          <h2 className="call-to-action-cta__heading">{heading}</h2>
          <p className="call-to-action-cta__body">{body}</p>
        </div>
        <a
          href={responderUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-role="call-to-action-cta-button"
          className="cta-button cta-button--accent"
        >
          <span>{ctaLabel}</span>
          <Icon name="external-link" size="sm" className="call-to-action-cta__button-icon" />
        </a>
      </div>
    </section>
  );
}
