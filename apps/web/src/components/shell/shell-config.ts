// unified-sidebar-shell / Task A: nav 構成の正本（純関数）。
// 3 ロール（viewer / member / admin）に対応する nav グループ + active 判定を提供する。
// 副作用なし・client/server 双方から import 可能。

export type ShellRole = "viewer" | "member" | "admin";

export type ShellNavItemId =
  | "home"
  | "directory"
  | "register"
  | "profile"
  | "dashboard"
  | "attendance"
  | "members"
  | "tag-queue"
  | "schema"
  | "meeting"
  | "requests"
  | "identity"
  | "audit";

export type ShellNavBadge = {
  tone: "warn" | "danger" | "info";
  count: number;
};

export type ShellNavItem = {
  id: ShellNavItemId;
  href: string;
  label: string;
  icon: ShellNavItemId;
  badge?: ShellNavBadge;
};

export type ShellNavGroupId = "public" | "members" | "admin";

export type ShellNavGroup = {
  id: ShellNavGroupId;
  label: string;
  items: ShellNavItem[];
};

const PUBLIC_ITEMS: ShellNavItem[] = [
  { id: "home", href: "/", label: "ホーム", icon: "home" },
  { id: "directory", href: "/members", label: "会員ディレクトリ", icon: "directory" },
  { id: "register", href: "/register", label: "登録", icon: "register" },
];

const MEMBER_ITEMS: ShellNavItem[] = [
  { id: "profile", href: "/profile", label: "マイページ", icon: "profile" },
];

function adminItems(schemaDiffCount: number): ShellNavItem[] {
  return [
    { id: "dashboard", href: "/admin", label: "ダッシュボード", icon: "dashboard" },
    { id: "attendance", href: "/admin/dashboard/attendance", label: "出席分析", icon: "attendance" },
    { id: "members", href: "/admin/members", label: "会員管理", icon: "members" },
    { id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" },
    {
      id: "schema",
      href: "/admin/schema",
      label: "スキーマ",
      icon: "schema",
      ...(schemaDiffCount > 0
        ? { badge: { tone: "warn" as const, count: schemaDiffCount } }
        : {}),
    },
    { id: "meeting", href: "/admin/meetings", label: "開催日", icon: "meeting" },
    { id: "requests", href: "/admin/requests", label: "依頼キュー", icon: "requests" },
    { id: "identity", href: "/admin/identity-conflicts", label: "Identity重複", icon: "identity" },
    { id: "audit", href: "/admin/audit", label: "監査ログ", icon: "audit" },
  ];
}

/**
 * ロール別 nav グループを組み立てる。
 * - viewer: PUBLIC（3 item）
 * - member: PUBLIC + MEMBERS（4 item）
 * - admin : PUBLIC + MEMBERS + ADMIN（13 item / schemaDiffCount で warn badge）
 */
export function buildNavForRole(
  role: ShellRole,
  ctx?: { schemaDiffCount?: number },
): ShellNavGroup[] {
  const groups: ShellNavGroup[] = [
    { id: "public", label: "PUBLIC", items: PUBLIC_ITEMS },
  ];
  if (role === "member" || role === "admin") {
    groups.push({ id: "members", label: "MEMBERS", items: MEMBER_ITEMS });
  }
  if (role === "admin") {
    groups.push({
      id: "admin",
      label: "ADMIN",
      items: adminItems(ctx?.schemaDiffCount ?? 0),
    });
  }
  return groups;
}

// active 判定: '/' と '/admin'（dashboard）は完全一致、その他は前方一致（子 path も active）。
const EXACT_MATCH_HREFS = new Set(["/", "/admin"]);

export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (EXACT_MATCH_HREFS.has(itemHref)) {
    return pathname === itemHref;
  }
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}
