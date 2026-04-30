// 06b: 認証要求時に飛ばす /login URL を一元生成。
// encodeURIComponent 漏れを防ぎ、redirect は path のみ受け付ける（open redirect 防止）。

import { normalizeRedirectPath } from "./safe-redirect";

/**
 * 現在の path を `?redirect=...` として埋め込んだ /login URL を返す。
 *
 * @example toLoginRedirect("/profile") -> "/login?redirect=%2Fprofile"
 */
export const toLoginRedirect = (currentPath: string): string => {
  const safe = normalizeRedirectPath(currentPath);
  return `/login?redirect=${encodeURIComponent(safe)}`;
};
