import { browserDocument } from "@/lib/is-browser";

export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";
export const SHELL_COLLAPSE_COOKIE = SHELL_COLLAPSE_COOKIE_NAME;
const SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function parseShellCollapsedCookie(value: string | undefined | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function serializeShellCollapsedCookie(collapsed: boolean): string {
  const value = collapsed ? "true" : "false";
  return `${SHELL_COLLAPSE_COOKIE_NAME}=${value}; Path=/; Max-Age=${SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function writeShellCollapsedCookie(collapsed: boolean): void {
  const doc = browserDocument();
  if (!doc) return;
  doc.cookie = serializeShellCollapsedCookie(collapsed);
}

export function readCollapsedFromDocument(): boolean | null {
  const rawCookie = browserDocument()?.cookie ?? "";
  const match = rawCookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SHELL_COLLAPSE_COOKIE_NAME}=`));
  if (!match) return null;
  return parseShellCollapsedCookie(match.slice(SHELL_COLLAPSE_COOKIE_NAME.length + 1));
}

export const readCollapsedFromCookieString = parseShellCollapsedCookie;
export const writeCollapsedCookie = writeShellCollapsedCookie;
