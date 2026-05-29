// unified-sidebar-shell-public-and-admin Task B: ロール別 user menu action 集合の SSOT（純関数）。
// 画面表記は「管理者」「会員」「ゲスト」のみ。コード識別子は 'admin' | 'member' | 'viewer'。
import type { ShellRole } from "./shell-config";

export type UserMenuAction =
  | { readonly kind: "link"; readonly id: string; readonly label: string; readonly href: string }
  | { readonly kind: "signout"; readonly id: "signout"; readonly label: "ログアウト" }
  | { readonly kind: "login"; readonly id: "login"; readonly label: "ログイン"; readonly href: "/login" };

export function buildUserMenuActions(role: ShellRole): UserMenuAction[] {
  if (role === "viewer") {
    return [{ kind: "login", id: "login", label: "ログイン", href: "/login" }];
  }
  const shared: UserMenuAction[] = [
    { kind: "link", id: "profile", label: "プロフィール", href: "/profile" },
    { kind: "link", id: "edit-request", label: "プロフィール編集申請", href: "/profile#edit-request" },
  ];
  if (role === "member") {
    return [...shared, { kind: "signout", id: "signout", label: "ログアウト" }];
  }
  return [
    ...shared,
    { kind: "link", id: "admin-dashboard", label: "管理者ダッシュボード", href: "/admin" },
    { kind: "signout", id: "signout", label: "ログアウト" },
  ];
}
