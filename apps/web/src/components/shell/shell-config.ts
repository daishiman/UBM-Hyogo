// Task A — SidebarShell primitive: nav config (pure functions).
// 3 層（公開 / 会員 / 管理）で再利用する nav 構成をロール別に組み立てる純関数群。
// 不変条件: ここでは role 判定・session 取得は行わない（呼出側 server が解決する）。

import { FORM_RESPONSES_EDIT_URL } from "../../lib/constants/form";

export type ShellRole = "viewer" | "member" | "admin";

export type ShellNavItemId =
  | "home"
  | "directory"
  | "register"
  | "profile"
  | "dashboard"
  | "attendance"
  | "members"
  | "tag-master"
  | "tag-queue"
  | "schema"
  | "meeting"
  | "requests"
  | "identity"
  | "audit"
  | "form-responses";

export type ShellNavBadgeTone = "warn" | "danger" | "info";

export interface ShellNavItem {
  readonly id: ShellNavItemId;
  readonly href: string;
  readonly label: string;
  readonly icon: ShellNavItemId;
  readonly badge?: { readonly tone: ShellNavBadgeTone; readonly count: number };
  readonly external?: boolean;
}

export type ShellNavGroupId = "public" | "members" | "admin";

export interface ShellNavGroup {
  readonly id: ShellNavGroupId;
  readonly label: string;
  readonly items: ReadonlyArray<ShellNavItem>;
}

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
  const schemaItem: ShellNavItem = {
    id: "schema",
    href: "/admin/schema",
    label: "スキーマ",
    icon: "schema",
    ...(schemaDiffCount > 0
      ? { badge: { tone: "warn" as const, count: schemaDiffCount } }
      : {}),
  };
  return {
    id: "admin",
    label: "管理",
    items: [
      { id: "dashboard", href: "/admin", label: "ダッシュボード", icon: "dashboard" },
      {
        id: "attendance",
        href: "/admin/dashboard/attendance",
        label: "出席分析",
        icon: "attendance",
      },
      { id: "members", href: "/admin/members", label: "会員管理", icon: "members" },
      { id: "tag-master", href: "/admin/tag-master", label: "タグ定義", icon: "tag-master" },
      { id: "tag-queue", href: "/admin/tags", label: "タグキュー", icon: "tag-queue" },
      schemaItem,
      { id: "meeting", href: "/admin/meetings", label: "開催日", icon: "meeting" },
      { id: "requests", href: "/admin/requests", label: "依頼キュー", icon: "requests" },
      {
        id: "identity",
        href: "/admin/identity-conflicts",
        label: "Identity重複",
        icon: "identity",
      },
      { id: "audit", href: "/admin/audit", label: "監査ログ", icon: "audit" },
      {
        id: "form-responses",
        href: FORM_RESPONSES_EDIT_URL,
        label: "Form回答",
        icon: "form-responses",
        external: true,
      },
    ],
  };
}

/**
 * ロール別に nav グループ集合を組み立てる。
 * - viewer: public のみ
 * - member: public + members
 * - admin : public + members + admin（admin グループの schema は schemaDiffCount badge を持つ）
 */
export function buildNavForRole(
  role: ShellRole,
  ctx?: { readonly schemaDiffCount?: number },
): ShellNavGroup[] {
  if (role === "viewer") return [PUBLIC_GROUP];
  if (role === "member") return [PUBLIC_GROUP, MEMBERS_GROUP];
  return [PUBLIC_GROUP, MEMBERS_GROUP, buildAdminGroup(ctx?.schemaDiffCount ?? 0)];
}

/**
 * nav item が現在の pathname に対して active かを判定する純関数。
 * - "/" は完全一致のみ active（前方一致で全 route が active になるのを防ぐ）
 * - "/admin" は完全一致のみ（配下 route で dashboard が常時 active になるのを防ぐ）
 * - それ以外は完全一致 or `href + "/"` の前方一致
 */
export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/") return pathname === "/";
  if (itemHref === "/admin") return pathname === "/admin";
  if (itemHref === "/admin/tags") return pathname === "/admin/tags";
  return pathname === itemHref || pathname.startsWith(itemHref + "/");
}
