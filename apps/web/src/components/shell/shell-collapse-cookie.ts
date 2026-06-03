import { browserDocument } from "@/lib/is-browser";

export const SHELL_COLLAPSE_COOKIE_NAME = "ubm_shell_collapsed";
export const SHELL_COLLAPSE_COOKIE = SHELL_COLLAPSE_COOKIE_NAME;
const SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * 現在の client runtime が HTTPS で配信されているかを判定する（private）。
 * - https:  → true（`Secure` cookie を送信可能な文脈）
 * - それ以外（http: / file: / SSR・Workers で document 不在） → false
 * Node 環境変数 (env) を参照せず client runtime のみで完結する（CLAUDE.md env 不変条件）。
 */
function isSecureRuntimeContext(): boolean {
  return browserDocument()?.location.protocol === "https:";
}

export function parseShellCollapsedCookie(value: string | undefined | null): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/**
 * collapse 状態の cookie 文字列を生成する。
 * @param collapsed sidebar が collapsed か
 * @param secure `Secure` 属性を付与するか。省略時は client runtime（HTTPS かどうか）で判定する。
 *               テストは両分岐を決定論的に検証するため明示注入できる。
 */
export function serializeShellCollapsedCookie(
  collapsed: boolean,
  secure: boolean = isSecureRuntimeContext(),
): string {
  const value = collapsed ? "true" : "false";
  const base = `${SHELL_COLLAPSE_COOKIE_NAME}=${value}; Path=/; Max-Age=${SHELL_COLLAPSE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  return secure ? `${base}; Secure` : base;
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
