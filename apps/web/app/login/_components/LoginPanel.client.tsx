// 06b: AuthGateState の 5 状態 × UI 切替を司る Client Component。
// 不変条件 #8: state は props（URL query 由来）からのみ駆動、ブラウザ永続ストレージ 不採用。
// 不変条件 #9: `/no-access` への redirect なし。deleted は本コンポーネント内で error banner に集約。

"use client";

import type { LoginGateState } from "../../../src/lib/url/login-query";
import { MagicLinkForm } from "./MagicLinkForm.client";
import { GoogleOAuthButton } from "./GoogleOAuthButton.client";

const RESPONDER_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform";

export interface LoginPanelProps {
  readonly state: LoginGateState;
  readonly email?: string;
  readonly redirect: string;
  readonly error?: string;
  readonly gate?: string;
}

interface BannerProps {
  readonly tone: "success" | "warn" | "error" | "info";
  readonly children: React.ReactNode;
}

const Banner = ({ tone, children }: BannerProps) => (
  <div role={tone === "error" ? "alert" : "status"} data-tone={tone}>
    {children}
  </div>
);

export function LoginPanel({
  state,
  redirect,
  error,
  gate,
}: LoginPanelProps) {
  switch (state) {
    case "input":
      return (
        <section>
          <h1>UBM 兵庫支部会へログイン</h1>
          {gate === "admin_required" ? (
            <Banner tone="warn">
              管理者権限が必要なページです。管理者アカウントでログインしてください。
            </Banner>
          ) : null}
          {error ? <Banner tone="error">{error}</Banner> : null}
          <GoogleOAuthButton redirect={redirect} />
          <MagicLinkForm redirect={redirect} />
          <p>
            未登録の方は <a href="/register">こちら</a>
          </p>
        </section>
      );
    case "sent":
      return (
        <section>
          <Banner tone="success">
            ログイン用メールを送信しました
          </Banner>
          <p>メール内のリンクからログインしてください（60 秒後に再送可能）。</p>
          <p>
            <a href={`/login?state=input&redirect=${encodeURIComponent(redirect)}`}>
              別のメールアドレスで再送する
            </a>
          </p>
        </section>
      );
    case "unregistered":
      return (
        <section>
          <Banner tone="warn">登録された会員情報が見つかりません。</Banner>
          <p>
            <a href="/register">登録ページへ進む</a>
          </p>
          <p>
            既に登録済みのはずの場合は管理者にお問い合わせください。
          </p>
        </section>
      );
    case "rules_declined":
      return (
        <section>
          <Banner tone="warn">
            利用規約への同意が確認できませんでした。Google Form から再回答することで再度ログインできます。
          </Banner>
          <p>
            <a href={RESPONDER_URL} target="_blank" rel="noopener noreferrer">
              Google Form で再回答する
            </a>
          </p>
        </section>
      );
    case "deleted":
      return (
        <section>
          <Banner tone="error">
            このアカウントは削除されています。再登録または管理者へのお問い合わせが必要です。
          </Banner>
          <p>管理者にお問い合わせください。</p>
        </section>
      );
  }
  const exhaustive: never = state;
  return exhaustive;
}
