// task-13 Phase 5: AuthGateState の 6 状態 × UI 切替を司る Client Component（rebuild）。
// 不変条件 #8: state は props（URL query 由来）からのみ駆動。session/local storage 不採用。
// 不変条件 #9: `/no-access` への redirect なし。状態遷移はすべて /login の query で表現。

"use client";

import type { LoginGateState } from "../../../src/lib/url/login-query";
import { Banner } from "../../../src/components/ui/Banner";
import { GoogleOAuthButton } from "./GoogleOAuthButton.client";
import { LoginStatus } from "./LoginStatus";
import { MagicLinkForm } from "./MagicLinkForm.client";

export interface LoginPanelProps {
  readonly state: LoginGateState;
  readonly email?: string;
  readonly redirect: string;
  readonly error?: string;
  readonly gate?: string;
}

export function LoginPanel({ state, redirect, error, gate }: LoginPanelProps) {
  if (state === "input") {
    return (
      <section data-panel="input">
        {gate === "admin_required" ? (
          <Banner tone="warning" title="管理者権限が必要です">
            管理者アカウントでログインしてください。
          </Banner>
        ) : null}
        {error ? (
          <Banner tone="danger" title="ログインエラー">
            {error}
          </Banner>
        ) : null}
        <GoogleOAuthButton redirect={redirect} />
        <MagicLinkForm redirect={redirect} />
        <p>
          未登録の方は <a href="/register">こちら</a>
        </p>
      </section>
    );
  }
  return (
    <LoginStatus
      state={state}
      redirect={redirect}
      {...(error !== undefined ? { error } : {})}
    />
  );
}
