// unified-sidebar-shell-public-and-admin Task A: shell の nav 構成と active 判定の SSOT。
// ロール別 nav グループ（public / members / admin）を純関数で組み立てる。
// 不変条件: ロール判定は呼出側（SidebarShellServer）が getSession 経由で行い、ここでは role を受け取るのみ。

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

export type ShellNavBadgeTone = "warn" | "danger" | "info";

export type ShellNavItem = {
  readonly id: ShellNavItemId;
  readonly href: string;
  readonly label: string;
  readonly icon: ShellNavItemId;
  readonly badge?: { readonly tone: ShellNavBadgeTone; readonly count: number };
};

export type ShellNavGroupId = "public" | "members" | "admin";

export type ShellNavGroup = {
  readonly id: ShellNavGroupId;
  readonly label: string;
  readonly items: ReadonlyArray<ShellNavItem>;
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

function buildAdminGroup(schemaDiffCount: number): ShellNavGroup {
  const schemaItem: ShellNavItem = {
    id: "schema",
    href: "/admin/schema",
    label: "スキーマ",
    icon: "schema",
    ...(schemaDiffCount > 0 ? { badge: { tone: "warn" as const, count: schemaDiffCount } } : {}),
  };
  return {
    id: "admin",
    label: "Admin",
    items: [
      { id: "dashboard", href: "/admin", label: "ダッシュボード", icon: "dashboard" },
      { id: "attendance", href: "/admin/dashboard/attendance", label: "出席分析", icon: "attendance" },
      { id: "members", href: "/admin/members", label: "会員管理", icon: "members" },
      { id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" },
      schemaItem,
      { id: "meeting", href: "/admin/meetings", label: "開催日", icon: "meeting" },
      { id: "requests", href: "/admin/requests", label: "依頼キュー", icon: "requests" },
      { id: "identity", href: "/admin/identity-conflicts", label: "Identity重複", icon: "identity" },
      { id: "audit", href: "/admin/audit", label: "監査ログ", icon: "audit" },
    ],
  };
}

export function buildNavForRole(
  role: ShellRole,
  ctx?: { schemaDiffCount?: number },
): ShellNavGroup[] {
  if (role === "viewer") return [PUBLIC_GROUP];
  if (role === "member") return [PUBLIC_GROUP, MEMBERS_GROUP];
  return [PUBLIC_GROUP, MEMBERS_GROUP, buildAdminGroup(ctx?.schemaDiffCount ?? 0)];
}

// 旧 components/layout/isActive.ts と同方式（exact match for "/" and "/admin", prefix otherwise）。
export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/") return pathname === "/";
  if (itemHref === "/admin") return pathname === "/admin";
  return pathname === itemHref || pathname.startsWith(itemHref + "/");
}
