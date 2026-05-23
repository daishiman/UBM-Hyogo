// admin-ui-prototype-alignment: safeServerFetch
// fetchAdmin の throw を SafeResult に正規化する server component 向けラッパー。
// page.tsx で Promise.all([safeServerFetch(...), ...]) のように使い、
// section 単位で AdminSectionError に degrade できるようにする。

import { fetchAdmin, type AdminFetchOptions } from "./server-fetch";
import type { SafeResult, SafeResultError } from "../result";

const FETCH_FAIL_REGEX = /admin api (\S+) failed: (\d+)/;

function normalizeError(path: string, err: unknown): SafeResultError {
  if (err instanceof Error) {
    const match = err.message.match(FETCH_FAIL_REGEX);
    if (match) {
      return {
        code: `ADMIN_FETCH_${match[2]}`,
        message: err.message,
      };
    }
    return {
      code: "ADMIN_FETCH_FAILED",
      message: err.message,
    };
  }
  return {
    code: "ADMIN_FETCH_UNKNOWN",
    message: `unknown error while fetching ${path}`,
  };
}

export async function safeServerFetch<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<SafeResult<T>> {
  try {
    const data = await fetchAdmin<T>(path, opts);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: normalizeError(path, err) };
  }
}
