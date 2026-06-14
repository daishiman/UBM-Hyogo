// task-13 Phase 5: /login のカード型ラッパー（Server Component）。
// Lane C: SectionCard(auth) へ移行（AC-4）。
// I-7: data-testid="login-card" / data-component="login-card" / data-state を SectionCard spread で保持。
// h1 は SectionCard の title prop を使わず明示的に配置（level:1 を 1 個だけ維持 / spec 保全）。
// 不変条件 #6: HEX 直書き禁止（OKLch tokens 経由の ui-primitives のみ）。
// 不変条件 #8: state は URL query 由来。Card root に data-state を反映する。

import type { ReactNode } from "react";
import { SectionCard } from "../../../../src/components/ui/layout";
import type { LoginGateState } from "../../../../src/lib/url/login-query";

export interface LoginCardProps {
  readonly state: LoginGateState;
  readonly title: string;
  readonly subtitle?: string;
  readonly footerSlot?: ReactNode;
  readonly children: ReactNode;
}

export function LoginCard({
  state,
  title,
  subtitle,
  footerSlot,
  children,
}: LoginCardProps) {
  return (
    <SectionCard
      as="div"
      className="auth-card"
      data-testid="login-card"
      data-component="login-card"
      data-state={state}
    >
      <header className="auth-card__header">
        <div className="brand" aria-label="UBM 兵庫支部会">
          <div className="brand-mark" aria-hidden="true">
            兵
          </div>
          <div className="brand-title">
            <span className="jp">UBM兵庫支部会</span>
            <span className="en">Member Portal</span>
          </div>
        </div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <div className="auth-card__content">{children}</div>
      {footerSlot ? <footer className="auth-card__footer">{footerSlot}</footer> : null}
    </SectionCard>
  );
}
