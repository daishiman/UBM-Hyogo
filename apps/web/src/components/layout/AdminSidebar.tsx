// 06c/07c: admin 画面ナビ
import Link from "next/link";
import { SignOutButton } from "../auth/SignOutButton";

const items = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/dashboard/attendance", label: "出席分析" },
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
      <Link
        href="/"
        aria-label="ホームに戻る"
        className="mb-4 inline-flex items-center rounded-sm border border-[var(--ubm-color-border-default)] px-3 py-2 text-sm font-semibold text-[var(--ubm-color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
      >
        UBM兵庫
      </Link>
      <ul>
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href}>{it.label}</Link>
          </li>
        ))}
      </ul>
      <div className="admin-sidebar-footer">
        <SignOutButton />
      </div>
    </nav>
  );
}
