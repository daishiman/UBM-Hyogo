import { getSession } from "../session";
import type { AuthView } from "./types";

export async function getAuthView(): Promise<AuthView> {
  try {
    const session = await getSession();
    if (!session) return { kind: "guest" };
    if (session.isAdmin) return { kind: "admin", profileHref: "/profile", adminHref: "/admin" };
    return { kind: "member", profileHref: "/profile" };
  } catch {
    return { kind: "guest" };
  }
}
