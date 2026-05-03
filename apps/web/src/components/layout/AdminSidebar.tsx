// 06c/07c: admin 画面ナビ
import Link from "next/link";

const items = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/members", label: "会員管理" },
  { href: "/admin/tags", label: "タグキュー" },
  { href: "/admin/schema", label: "schema" },
  { href: "/admin/meetings", label: "開催日" },
  { href: "/admin/requests", label: "依頼キュー" },
  { href: "/admin/identity-conflicts", label: "Identity重複" },
  { href: "/admin/audit", label: "監査ログ" },
] as const;

export function AdminSidebar() {
  return (
    <nav aria-label="管理メニュー" className="admin-sidebar">
      <ul>
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href}>{it.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
