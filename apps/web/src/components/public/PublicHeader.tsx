// task-11: 公開層共通ヘッダ。Server Component。

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/members", label: "メンバー" },
  { href: "/register", label: "登録" },
];

export function PublicHeader() {
  return (
    <header data-component="public-header">
      <a href="/" data-role="brand">
        UBM 兵庫支部会
      </a>
      <nav aria-label="メインナビゲーション">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <a href="/login" data-role="auth-cta">
        ログイン
      </a>
    </header>
  );
}
