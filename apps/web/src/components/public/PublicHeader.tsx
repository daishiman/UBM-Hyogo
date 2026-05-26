// task-11: 公開層共通ヘッダ。sync presentational component。
// プロトタイプ整合: ログイン中ユーザーには右上CTAで「マイページ」動線を表示し、未ログインは「ログイン」CTAを表示する。
// セッション判定は caller (layout / page) 側で行い、props で渡す（async 化を避けて既存テスト互換を維持）。

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/members", label: "メンバー" },
  { href: "/register", label: "登録" },
];

export interface PublicHeaderCurrentUser {
  readonly memberId: string;
  readonly name?: string;
}

export interface PublicHeaderProps {
  currentPath?: string;
  currentUser?: PublicHeaderCurrentUser | null;
}

export function PublicHeader({
  currentPath,
  currentUser,
}: PublicHeaderProps = {}) {
  const isAuthenticated = Boolean(currentUser);
  return (
    <header data-component="public-header">
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
      {isAuthenticated ? (
        <a
          href="/profile"
          data-role="auth-cta"
          data-state="authenticated"
          aria-current={currentPath === "/profile" ? "page" : undefined}
        >
          マイページ
        </a>
      ) : (
        <a href="/login" data-role="auth-cta" data-state="anonymous">
          ログイン
        </a>
      )}
    </header>
  );
}
