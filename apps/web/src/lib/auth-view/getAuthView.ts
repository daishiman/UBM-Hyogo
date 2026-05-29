import { getSession } from "../session";
import { resolveAuthView } from "./resolveAuthView";
import type { AuthView } from "./types";

export async function getAuthView(): Promise<AuthView> {
  try {
    return resolveAuthView({ user: await getSession() });
  } catch {
    return { kind: "guest" };
  }
}

