// task-13 Phase 5: /login の非 input 状態（sent/unregistered/deleted/rules_declined/error）の本文。
// 不変条件 #6: ui-primitives Banner 経由で OKLch tokens のみ使用。

import { Banner } from "../../../src/components/ui/Banner";
import { FORM_RESPONDER_URL } from "../../../src/lib/constants/form";
import type { LoginGateState } from "../../../src/lib/url/login-query";

export interface LoginStatusProps {
  readonly state: Exclude<LoginGateState, "input">;
  readonly redirect: string;
  readonly error?: string;
}

export function LoginStatus({ state, redirect, error }: LoginStatusProps) {
  const inputHref = `/login?state=input&redirect=${encodeURIComponent(redirect)}`;

  switch (state) {
    case "sent":
      return (
        <div data-status="sent">
          <Banner tone="success" title="ログイン用メールを送信しました">
            メール内のリンクからログインしてください（60 秒後に再送可能）。
          </Banner>
          <p>
            <a href={inputHref}>別のメールアドレスで再送する</a>
          </p>
        </div>
      );
    case "unregistered":
      return (
        <div data-status="unregistered">
          <Banner tone="warning" title="登録された会員情報が見つかりません">
            まだ登録されていない場合は、登録ページからお進みください。
          </Banner>
          <p>
            <a href="/register">登録ページへ進む</a>
          </p>
          <p>登録済みのはずの場合は管理者にお問い合わせください。</p>
        </div>
      );
    case "deleted":
      return (
        <div data-status="deleted">
          <Banner tone="danger" title="アカウントが削除されています">
            このアカウントは削除されています。再登録または管理者へのお問い合わせが必要です。
          </Banner>
          <p>管理者にお問い合わせください。</p>
        </div>
      );
    case "rules_declined":
      return (
        <div data-status="rules_declined">
          <Banner tone="warning" title="利用規約への同意が確認できません">
            Google Form から再回答することで再度ログインできます。
          </Banner>
          <p>
            <a href={FORM_RESPONDER_URL} target="_blank" rel="noopener noreferrer">
              Google Form で再回答する
            </a>
          </p>
        </div>
      );
    case "error":
      return (
        <div data-status="error">
          <Banner tone="danger" title="ログイン処理でエラーが発生しました">
            {error ?? "時間をおいて再試行してください。"}
          </Banner>
          <p>
            <a href={inputHref}>ログイン画面に戻る</a>
          </p>
        </div>
      );
  }
  const exhaustive: never = state;
  return exhaustive;
}
