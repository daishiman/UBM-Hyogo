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

function AuthSlot({ authView }: { readonly authView: AuthView }) {
  if (authView.kind === "guest") {
    return (
      <a href="/login" data-role="auth-cta">
        ログイン
      </a>
    );
  }

  return (
    <div data-role="auth-actions">
      <a href={authView.profileHref} data-role="member-cta">
        マイページ
      </a>
      {authView.kind === "admin" ? (
        <a href={authView.adminHref} data-role="admin-cta">
          管理
        </a>
      ) : null}
      <SignOutButton />
    </div>
  );
}

export async function PublicHeader({
  currentPath,
  authView,
}: PublicHeaderProps = {}) {
  const resolvedAuthView = authView ?? (await getAuthView());

  return (
    <header
      data-auth-state={resolvedAuthView.kind}
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
      <AuthSlot authView={resolvedAuthView} />
    </header>
  );
}
