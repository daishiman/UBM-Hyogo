// task-13 Phase 5: /login のカード型ラッパー（Server Component）。
// 不変条件 #6: HEX 直書き禁止（OKLch tokens 経由の ui-primitives のみ）。
// 不変条件 #8: state は URL query 由来。Card root に data-state を反映する。

import type { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "../../../src/components/ui/Card";
import type { LoginGateState } from "../../../src/lib/url/login-query";

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
    <Card
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
      <CardContent>{children}</CardContent>
      {footerSlot ? <CardFooter>{footerSlot}</CardFooter> : null}
    </Card>
  );
}
