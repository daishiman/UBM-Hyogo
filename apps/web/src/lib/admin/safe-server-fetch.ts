import { fetchAdmin, type AdminFetchOptions } from "./server-fetch";
import { logger } from "../logger";
import type { SafeResult } from "../result";
import { safeServerFetch as commonSafeServerFetch } from "../server-fetch/safe-fetch";

export async function safeServerFetch<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<SafeResult<T>> {
  const result = await commonSafeServerFetch(() => fetchAdmin<T>(path, opts), {
    codePrefix: "ADMIN_FETCH",
    unknownMessage: `unknown error while fetching ${path}`,
  });

  if (!result.ok && result.error.code === "ADMIN_FETCH_404") {
    logger.warn({
      event: "admin_fetch_404",
      scope: "admin",
      path,
      method: opts.method ?? "GET",
      code: result.error.code,
    });
  }

  return result;
}
