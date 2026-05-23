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
      data-testid="login-card"
      data-component="login-card"
      data-state={state}
    >
      <header>
        <svg
          aria-label="UBM 兵庫支部会"
          role="img"
          viewBox="0 0 64 64"
          width="48"
          height="48"
        >
          <title>UBM 兵庫支部会</title>
          <circle cx="32" cy="32" r="28" fill="var(--color-accent-soft)" />
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="var(--color-accent-ink)"
          >
            UBM
          </text>
        </svg>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <CardContent>{children}</CardContent>
      {footerSlot ? <CardFooter>{footerSlot}</CardFooter> : null}
    </Card>
  );
}
