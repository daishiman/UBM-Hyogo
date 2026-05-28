import { getAuth } from "../auth";
import { resolveAuthView } from "./resolveAuthView";
import type { AuthView } from "./types";

export async function getAuthView(): Promise<AuthView> {
  try {
    const runtime = await getAuth();
    const session = await runtime.auth();
    return resolveAuthView(session as Parameters<typeof resolveAuthView>[0]);
  } catch {
    return { kind: "guest" };
  }
}
