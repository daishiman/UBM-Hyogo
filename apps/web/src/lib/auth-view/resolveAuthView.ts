import type { AuthView, SessionLike } from "./types";

export function resolveAuthView(
  session: SessionLike | null | undefined,
): AuthView {
  const memberId = session?.user?.memberId?.trim();
  if (!memberId) return { kind: "guest" };
  if (session?.user?.isAdmin === true) {
    return { kind: "admin", profileHref: "/profile", adminHref: "/admin" };
  }
  return { kind: "member", profileHref: "/profile" };
}
