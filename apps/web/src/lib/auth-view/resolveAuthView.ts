import type { AuthView } from "./types";

export interface SessionLike {
  readonly user?:
    | {
        readonly memberId?: string | null;
        readonly isAdmin?: boolean | null;
      }
    | null;
}

export function resolveAuthView(
  session: SessionLike | null | undefined,
): AuthView {
  const memberId = session?.user?.memberId;
  if (typeof memberId !== "string" || memberId.length === 0) {
    return { kind: "guest" };
  }

  if (session?.user?.isAdmin === true) {
    return { kind: "admin", profileHref: "/profile", adminHref: "/admin" };
  }

  return { kind: "member", profileHref: "/profile" };
}

