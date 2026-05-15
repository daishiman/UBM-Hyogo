/**
 * UT-17-Followup-004: diff
 *
 * canonical 化された expected / actual から drift を全件列挙する純関数。
 * Phase 7 §7-3 D1〜D8 を満たす。
 *
 * 戻り値が空配列なら drift なし。`cf.sh alerts diff` の exit code 判定に使う。
 */
import type { CanonicalPolicy, CanonicalWebhook } from "./types.ts";

export type Drift =
  | { kind: "missing"; name: string }
  | { kind: "extra"; name: string }
  | { kind: "changed"; name: string; path: string; expected: unknown; actual: unknown };

function isObject(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function joinPath(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}

function deepDiff(name: string, base: string, e: unknown, a: unknown): Drift[] {
  if (Array.isArray(e) && Array.isArray(a)) {
    const out: Drift[] = [];
    const max = Math.max(e.length, a.length);
    for (let i = 0; i < max; i++) {
      const sub = `${base}[${i}]`;
      if (i >= e.length) {
        out.push({ kind: "changed", name, path: sub, expected: undefined, actual: a[i] });
      } else if (i >= a.length) {
        out.push({ kind: "changed", name, path: sub, expected: e[i], actual: undefined });
      } else {
        out.push(...deepDiff(name, sub, e[i], a[i]));
      }
    }
    return out;
  }
  if (isObject(e) && isObject(a)) {
    const out: Drift[] = [];
    const keys = new Set([...Object.keys(e), ...Object.keys(a)]);
    for (const k of [...keys].sort()) {
      out.push(...deepDiff(name, joinPath(base, k), e[k], a[k]));
    }
    return out;
  }
  if (e === a) return [];
  // Number equality with NaN safety
  if (typeof e === "number" && typeof a === "number" && Number.isNaN(e) && Number.isNaN(a)) {
    return [];
  }
  return [{ kind: "changed", name, path: base, expected: e, actual: a }];
}

export function diffPolicy(
  expected: CanonicalPolicy[],
  actual: CanonicalPolicy[],
): Drift[] {
  const drifts: Drift[] = [];
  const byE = new Map(expected.map((p) => [p.name, p]));
  const byA = new Map(actual.map((p) => [p.name, p]));
  for (const [n, e] of byE) {
    const a = byA.get(n);
    if (!a) {
      drifts.push({ kind: "missing", name: n });
    } else {
      drifts.push(...deepDiff(n, "", e, a));
    }
  }
  for (const [n] of byA) {
    if (!byE.has(n)) drifts.push({ kind: "extra", name: n });
  }
  return drifts;
}

/**
 * webhook 比較用に、片側にしか存在しえないフィールドを除いた比較対象オブジェクトを作る。
 * - urlRef は repo 由来 (write-only)。actual 側には絶対に存在しない。
 * - url は actual 側に存在し、expected 側は op:// 解決後でないと値を持たない。
 * - secretHeader.valueRef も同様 write-only。
 *
 * 比較対象は name / type / url (両方ある場合のみ) / secretHeader.name (両方ある場合のみ) に絞る。
 */
function webhookCompareView(w: CanonicalWebhook, peer: CanonicalWebhook): Record<string, unknown> {
  const view: Record<string, unknown> = { name: w.name, type: w.type };
  if (w.url !== undefined && peer.url !== undefined) view.url = w.url;
  if (w.secretHeader && peer.secretHeader) {
    view.secretHeader = { name: w.secretHeader.name };
  }
  return view;
}

export function diffWebhook(
  expected: CanonicalWebhook[],
  actual: CanonicalWebhook[],
): Drift[] {
  const drifts: Drift[] = [];
  const byE = new Map(expected.map((w) => [w.name, w]));
  const byA = new Map(actual.map((w) => [w.name, w]));
  for (const [n, e] of byE) {
    const a = byA.get(n);
    if (!a) {
      drifts.push({ kind: "missing", name: n });
    } else {
      const ev = webhookCompareView(e, a);
      const av = webhookCompareView(a, e);
      drifts.push(...deepDiff(n, "", ev, av));
    }
  }
  for (const [n] of byA) {
    if (!byE.has(n)) drifts.push({ kind: "extra", name: n });
  }
  return drifts;
}
