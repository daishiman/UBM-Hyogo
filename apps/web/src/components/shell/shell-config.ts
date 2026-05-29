// unified-sidebar-shell Task A: nav 構成の純関数 source。
// role → nav group ツリーの解決と active 判定をここに閉じる（副作用なし）。

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
  label: "公開",
  items: [
    { id: "home", href: "/", label: "ホーム", icon: "home" },
    { id: "directory", href: "/members", label: "会員ディレクトリ", icon: "directory" },
    { id: "register", href: "/register", label: "登録", icon: "register" },
  ],
};

const MEMBERS_GROUP: ShellNavGroup = {
  id: "members",
  label: "会員",
  items: [{ id: "profile", href: "/profile", label: "マイページ", icon: "profile" }],
};

function buildAdminGroup(schemaDiffCount: number): ShellNavGroup {
  return {
    id: "admin",
    label: "管理",
    items: [
      { id: "dashboard", href: "/admin", label: "ダッシュボード", icon: "dashboard" },
      { id: "attendance", href: "/admin/dashboard/attendance", label: "出席分析", icon: "attendance" },
      { id: "members", href: "/admin/members", label: "会員管理", icon: "members" },
      { id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" },
      {
        id: "schema",
        href: "/admin/schema",
        label: "スキーマ",
        icon: "schema",
        badge: { tone: "warn", count: schemaDiffCount },
      },
      { id: "meeting", href: "/admin/meetings", label: "開催日", icon: "meeting" },
      { id: "requests", href: "/admin/requests", label: "依頼キュー", icon: "requests" },
      { id: "identity", href: "/admin/identity-conflicts", label: "Identity重複", icon: "identity" },
      { id: "audit", href: "/admin/audit", label: "監査ログ", icon: "audit" },
    ],
  };
}

/**
 * role に応じた nav group ツリーを返す。
 *
 * - viewer: 公開のみ（3 item）
 * - member: 公開 + 会員（4 item）
 * - admin : 公開 + 会員 + 管理（13 item / schemaDiffCount badge 付き）
 *
 * badge.count=0 のときの badge 非表示判定は描画側（SidebarNavItem）が担う。
 */
export function buildNavForRole(
  role: ShellRole,
  ctx?: { schemaDiffCount?: number },
): ShellNavGroup[] {
  if (role === "admin") {
    return [PUBLIC_GROUP, MEMBERS_GROUP, buildAdminGroup(ctx?.schemaDiffCount ?? 0)];
  }
  if (role === "member") {
    return [PUBLIC_GROUP, MEMBERS_GROUP];
  }
  return [PUBLIC_GROUP];
}

/**
 * nav item の active 判定。既存 `layout/isActive.ts` と同一規約:
 * ルート/ダッシュボードは完全一致、その他は prefix 一致を許容する。
 */
export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/") return pathname === "/";
  if (itemHref === "/admin") return pathname === "/admin";
  return pathname === itemHref || pathname.startsWith(itemHref + "/");
}
