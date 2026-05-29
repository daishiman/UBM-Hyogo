// task-11: 公開層共通ヘッダ。Server Component。

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

function AuthSlot({ authView }: { readonly authView: AuthView }) {
  if (authView.kind === "guest") {
    return (
      <a href="/login" data-role="auth-cta" aria-label="ログイン">
        ログイン
      </a>
    );
  }
  return (
    <div data-role="member-actions">
      <a href={authView.profileHref} data-role="member-cta" aria-label="マイページへ移動">
        マイページ
      </a>
      {authView.kind === "admin" ? (
        <a href={authView.adminHref} data-role="admin-cta" aria-label="管理ダッシュボードへ移動">
          管理
        </a>
      ) : null}
      <SignOutButton redirectTo="/" />
    </div>
  );
}

export async function PublicHeader({ currentPath, authView }: PublicHeaderProps = {}) {
  const resolvedAuthView = authView ?? (await getAuthView());
  return (
    <header data-component="public-header" data-auth-state={resolvedAuthView.kind}>
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
