// Cloudflare Workers SSR 境界の外（packages/）に隔離した、guard 済みブラウザ永続化アクセサ。
//
// apps/web は `scripts/lint-boundaries.mjs` が `localStorage` / `sessionStorage` literal を
// 全面禁止する（SSR コンテキストでの直接参照を防ぐため）。client UI 状態の永続化が必要な場合は
// apps/web から直接グローバルを触らず、このモジュール経由に集約する。
//
// 全関数は `typeof window` で browser guard し、private mode 等で storage が使えない場合も throw しない。

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * JSON boolean として永続化された値を読む。未設定・非 browser・parse 失敗時は null を返す。
 */
export function readPersistedBoolean(key: string): boolean | null {
  if (!hasBrowserStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) === true;
  } catch {
    return null;
  }
}

/**
 * boolean を JSON で永続化する。非 browser・storage 不可環境では黙って no-op。
 */
export function writePersistedBoolean(key: string, value: boolean): void {
  if (!hasBrowserStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 永続化不可環境（private mode 等）では諦める。
  }
}
