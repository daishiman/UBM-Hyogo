import { fetchAdmin, type AdminFetchOptions } from "./server-fetch";
import type { SafeResult } from "../result";
import { safeServerFetch as commonSafeServerFetch } from "../server-fetch/safe-fetch";

export async function safeServerFetch<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<SafeResult<T>> {
  return commonSafeServerFetch(() => fetchAdmin<T>(path, opts), {
    codePrefix: "ADMIN_FETCH",
    unknownMessage: `unknown error while fetching ${path}`,
  });
}
