// task-11: 公開層共通フッタ。Server Component。

const FOOTER_LINKS = [
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/terms", label: "利用規約" },
];

export function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer data-component="public-footer">
      <ul>
        {FOOTER_LINKS.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
      <p data-role="copyright">© {year} UBM 兵庫支部会</p>
    </footer>
  );
}
