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

export type ShellBadgeTone = "warn" | "danger" | "info";

export type ShellNavItem = {
  id: ShellNavItemId;
  href: string;
  label: string;
  icon: ShellNavItemId;
  badge?: { tone: ShellBadgeTone; count: number };
};

export type ShellNavGroupId = "public" | "members" | "admin";

export type ShellNavGroup = {
  id: ShellNavGroupId;
  label: string;
  items: ShellNavItem[];
};

const PUBLIC_GROUP: ShellNavGroup = {
  id: "public",
  label: "Public",
  items: [
    { id: "home", href: "/", label: "ホーム", icon: "home" },
    { id: "directory", href: "/members", label: "会員ディレクトリ", icon: "directory" },
    { id: "register", href: "/register", label: "登録", icon: "register" },
  ],
};

const MEMBERS_GROUP: ShellNavGroup = {
  id: "members",
  label: "Members",
  items: [{ id: "profile", href: "/profile", label: "マイページ", icon: "profile" }],
};

function buildAdminGroup(ctx?: { schemaDiffCount?: number }): ShellNavGroup {
  const schemaDiff = ctx?.schemaDiffCount ?? 0;
  const items: ShellNavItem[] = [
    { id: "dashboard", href: "/admin", label: "ダッシュボード", icon: "dashboard" },
    {
      id: "attendance",
      href: "/admin/dashboard/attendance",
      label: "出席分析",
      icon: "attendance",
    },
    { id: "members", href: "/admin/members", label: "会員管理", icon: "members" },
    { id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" },
    {
      id: "schema",
      href: "/admin/schema",
      label: "スキーマ",
      icon: "schema",
      ...(schemaDiff > 0
        ? { badge: { tone: "warn" as const, count: schemaDiff } }
        : {}),
    },
    { id: "meeting", href: "/admin/meetings", label: "開催日", icon: "meeting" },
    { id: "requests", href: "/admin/requests", label: "依頼キュー", icon: "requests" },
    {
      id: "identity",
      href: "/admin/identity-conflicts",
      label: "Identity重複",
      icon: "identity",
    },
    { id: "audit", href: "/admin/audit", label: "監査ログ", icon: "audit" },
  ];
  return { id: "admin", label: "Admin", items };
}

export function buildNavForRole(
  role: ShellRole,
  ctx?: { schemaDiffCount?: number },
): ShellNavGroup[] {
  if (role === "viewer") return [PUBLIC_GROUP];
  if (role === "member") return [PUBLIC_GROUP, MEMBERS_GROUP];
  return [PUBLIC_GROUP, MEMBERS_GROUP, buildAdminGroup(ctx)];
}

export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/") return pathname === "/";
  if (itemHref === "/admin") return pathname === "/admin";
  return pathname === itemHref || pathname.startsWith(itemHref + "/");
}
