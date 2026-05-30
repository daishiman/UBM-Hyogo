// unified-sidebar-shell / Task B: ロール → user menu action 集合（純関数）。
import type { ShellRole } from "./shell-config";

export type UserMenuAction =
  | { kind: "link"; id: string; label: string; href: string }
  | { kind: "signout"; id: "signout"; label: "ログアウト" }
  | { kind: "login"; id: "login"; label: "ログイン"; href: "/login" };

const PROFILE_LINK: UserMenuAction = {
  kind: "link",
  id: "profile",
  label: "プロフィール",
  href: "/profile",
};
const EDIT_REQUEST_LINK: UserMenuAction = {
  kind: "link",
  id: "edit-request",
  label: "プロフィール編集申請",
  href: "/profile#edit-request",
};
const ADMIN_DASHBOARD_LINK: UserMenuAction = {
  kind: "link",
  id: "admin-dashboard",
  label: "管理者ダッシュボード",
  href: "/admin",
};
const SIGNOUT: UserMenuAction = { kind: "signout", id: "signout", label: "ログアウト" };
const LOGIN: UserMenuAction = { kind: "login", id: "login", label: "ログイン", href: "/login" };

/**
 * ロール別 user menu action（順序込み）。
 * - viewer: [ログイン]
 * - member: [プロフィール, 編集申請, ログアウト]
 * - admin : [プロフィール, 編集申請, 管理者ダッシュボード, ログアウト]
 */
export function buildUserMenuActions(role: ShellRole): UserMenuAction[] {
  if (role === "viewer") return [LOGIN];
  if (role === "member") return [PROFILE_LINK, EDIT_REQUEST_LINK, SIGNOUT];
  return [PROFILE_LINK, EDIT_REQUEST_LINK, ADMIN_DASHBOARD_LINK, SIGNOUT];
}

export function roleDisplayLabel(role: ShellRole): string | null {
  if (role === "admin") return "管理者";
  if (role === "member") return "会員";
  return null;
}
