import { getAuth } from "@/lib/auth";

import { resolveAuthView } from "./resolveAuthView";
import type { AuthView, SessionLike } from "./types";

export async function getAuthView(): Promise<AuthView> {
  try {
    const { auth } = await getAuth();
    const session = (await auth()) as SessionLike | null;
    return resolveAuthView(session);
  } catch {
    return { kind: "guest" };
  }
}
