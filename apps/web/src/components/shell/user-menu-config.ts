import type { ShellRole } from "./shell-config";

export type UserMenuAction =
  | { kind: "link"; id: string; label: string; href: string }
  | { kind: "signout"; id: "signout"; label: "ログアウト" }
  | { kind: "login"; id: "login"; label: "ログイン"; href: "/login" };

export function buildUserMenuActions(role: ShellRole): UserMenuAction[] {
  switch (role) {
    case "viewer":
      return [{ kind: "login", id: "login", label: "ログイン", href: "/login" }];
    case "member":
      return [
        { kind: "link", id: "profile", label: "プロフィール", href: "/profile" },
        { kind: "link", id: "edit-request", label: "プロフィール編集申請", href: "/profile#edit-request" },
        { kind: "signout", id: "signout", label: "ログアウト" },
      ];
    case "admin":
      return [
        { kind: "link", id: "profile", label: "プロフィール", href: "/profile" },
        { kind: "link", id: "edit-request", label: "プロフィール編集申請", href: "/profile#edit-request" },
        { kind: "link", id: "admin-dashboard", label: "管理者ダッシュボード", href: "/admin" },
        { kind: "signout", id: "signout", label: "ログアウト" },
      ];
  }
}
