// task-11 / task-a: 公開層共通ヘッダ。async Server Component。
// session 状態に応じて auth CTA を切替（guest / member / admin）。

import type { JSX } from "react";

import { SignOutButton } from "../auth/SignOutButton";
import { getAuthView, type AuthView } from "../../lib/auth-view";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/members", label: "メンバー" },
  { href: "/register", label: "登録" },
];

export interface PublicHeaderProps {
  readonly currentPath?: string;
  readonly authView?: AuthView;
}

export async function PublicHeader(
  props: PublicHeaderProps = {},
): Promise<JSX.Element> {
  const { currentPath, authView: authViewProp } = props;
  const authView = authViewProp ?? (await getAuthView());

  return (
    <header
      data-auth-state={authView.kind}
      data-component="public-header"
      data-testid="public-header"
    >
      <a href="/" data-role="brand">
        UBM 兵庫支部会
      </a>
      <nav aria-label="メインナビゲーション">
        <ul>
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.href !== "/" && currentPath?.startsWith(item.href));
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <AuthSlot authView={authView} />
    </header>
  );
}

function AuthSlot({ authView }: { readonly authView: AuthView }): JSX.Element {
  if (authView.kind === "guest") {
    return (
      <a href="/login" data-role="auth-cta" aria-label="ログイン">
        ログイン
      </a>
    );
  }
  if (authView.kind === "member") {
    return (
      <div data-role="member-actions">
        <a
          href={authView.profileHref}
          data-role="member-cta"
          aria-label="マイページへ移動"
        >
          マイページ
        </a>
        <SignOutButton redirectTo="/" label="ログアウト" />
      </div>
    );
  }
  return (
    <div data-role="member-actions">
      <a
        href={authView.profileHref}
        data-role="member-cta"
        aria-label="マイページへ移動"
      >
        マイページ
      </a>
      <a
        href={authView.adminHref}
        data-role="admin-cta"
        aria-label="管理ダッシュボードへ移動"
      >
        管理
      </a>
      <SignOutButton redirectTo="/" label="ログアウト" />
    </div>
  );
}
