// 06b: /login の URL を client side で書き換える helper。
// magic link 送信後に email を URL から落とすために使う（privacy + 不変条件 #8）。

import type { LoginGateState } from "./login-query";
import { normalizeRedirectPath } from "./safe-redirect";

export interface ReplaceLoginStateOptions {
  readonly error?: string;
  readonly gate?: string;
  /** test 用に history を差し替えられる */
  readonly historyImpl?: Pick<History, "replaceState">;
}

const buildLoginUrl = (
  state: LoginGateState,
  redirect: string,
  opts: ReplaceLoginStateOptions | undefined,
): string => {
  const params = new URLSearchParams();
  params.set("state", state);
  params.set("redirect", normalizeRedirectPath(redirect));
  if (opts?.error) params.set("error", opts.error);
  if (opts?.gate) params.set("gate", opts.gate);
  return `/login?${params.toString()}`;
};

/**
 * `history.replaceState` で URL を `/login?state=...&redirect=...` に書き換える。
 * email は URL から消す。SSR / ノード環境では no-op。
 */
export const replaceLoginState = (
  state: LoginGateState,
  redirect: string,
  opts?: ReplaceLoginStateOptions,
): void => {
  const url = buildLoginUrl(state, redirect, opts);
  const historyImpl =
    opts?.historyImpl ??
    (typeof window !== "undefined" ? window.history : undefined);
  if (!historyImpl) return;
  historyImpl.replaceState(null, "", url);
};
