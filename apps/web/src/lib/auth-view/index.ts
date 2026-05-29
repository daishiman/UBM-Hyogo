import { getSession, type SessionUser } from "../session";

export type AuthView =
  | { readonly kind: "guest"; readonly profileHref?: never; readonly adminHref?: never }
  | { readonly kind: "member"; readonly profileHref: string; readonly adminHref?: never }
  | { readonly kind: "admin"; readonly profileHref: string; readonly adminHref: string };

export function resolveAuthView(session: SessionUser | null): AuthView {
  if (!session) return { kind: "guest" };
  if (session.isAdmin) {
    return { kind: "admin", profileHref: "/profile", adminHref: "/admin" };
  }
  return { kind: "member", profileHref: "/profile" };
}

export async function getAuthView(): Promise<AuthView> {
  try {
    return resolveAuthView(await getSession());
  } catch {
    return { kind: "guest" };
  }
}
