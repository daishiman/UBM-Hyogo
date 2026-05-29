/**
 * Server Components / Edge runtime / Workers ランタイム互換のブラウザ判定。
 *
 * - SSR / Workers: false
 * - Browser (jsdom 含む): true
 *
 * 直接 `typeof window !== 'undefined'` を書くと ESLint で弾かれる（task-04 で導入）。
 */
export const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * `requestIdleCallback` 等のブラウザ専用 API を安全に呼ぶ。
 * SSR / Workers では noop。
 */
export function whenBrowser(fn: () => void): void {
  if (isBrowser()) fn();
}

/**
 * ブラウザ環境の `window.history` を返す。SSR / Workers では undefined。
 * `lib/is-browser.ts` を `window` への唯一の正規参照点とするための薄い getter。
 */
export const browserHistory = (): History | undefined =>
  isBrowser() ? window.history : undefined;

/**
 * ブラウザ環境の `document` を返す。SSR / Workers では undefined。
 * DOM focus trap 等の Client Component から使う。
 */
export const browserDocument = (): Document | undefined =>
  isBrowser() ? document : undefined;

/**
 * ブラウザ環境の Web Storage（`localStorage`）を返す。
 * SSR / Workers / private mode 等で参照不可な場合は undefined。
 *
 * Web Storage への唯一の正規参照点とし、Client Component からはこの getter 経由で
 * のみアクセスする（`scripts/lint-boundaries.mjs` の token allowlist 対象）。
 */
export const browserLocalStorage = (): Storage | undefined => {
  if (!isBrowser()) return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};
