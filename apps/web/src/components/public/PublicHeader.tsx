// task-11: 公開層共通ヘッダ。Server Component。

import { SignOutButton } from "../auth/SignOutButton";
import { getAuthView, type AuthView } from "../../lib/auth-view";

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/members", label: "メンバー" },
  { href: "/register", label: "登録" },
];

export interface PublicHeaderProps {
  currentPath?: string;
  authView?: AuthView;
}

function renderAuthSlot(authView: AuthView) {
  if (authView.kind === "guest") {
    return (
      <a href="/login" data-role="auth-cta">
        ログイン
      </a>
    );
  }
  if (authView.kind === "admin") {
    return (
      <div data-role="auth-cta">
        <a href={authView.profileHref} data-role="member-cta">
          マイページ
        </a>
        <a href={authView.adminHref} data-role="admin-cta">
          管理画面
        </a>
        <SignOutButton />
      </div>
    );
  }
  return (
    <div data-role="auth-cta">
      <a href={authView.profileHref} data-role="member-cta">
        マイページ
      </a>
      <SignOutButton />
    </div>
  );
}

export async function PublicHeader({
  currentPath,
  authView: explicitAuthView,
}: PublicHeaderProps = {}) {
  const authView = explicitAuthView ?? (await getAuthView());
  return (
    <header data-component="public-header" data-auth-state={authView.kind}>
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
      {renderAuthSlot(authView)}
    </header>
  );
}
