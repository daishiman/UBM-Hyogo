import type { CanonicalSentryPolicy } from "./types.ts";

export type Drift =
  | { kind: "missing"; name: string }
  | { kind: "extra"; name: string }
  | { kind: "changed"; name: string; path: string; expected: unknown; actual: unknown };

function isObject(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

function joinPath(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}

function deepDiff(name: string, base: string, expected: unknown, actual: unknown): Drift[] {
  if (Array.isArray(expected) && Array.isArray(actual)) {
    const out: Drift[] = [];
    const max = Math.max(expected.length, actual.length);
    for (let i = 0; i < max; i += 1) {
      out.push(...deepDiff(name, `${base}[${i}]`, expected[i], actual[i]));
    }
    return out;
  }
  if (isObject(expected) && isObject(actual)) {
    const out: Drift[] = [];
    for (const key of [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort()) {
      out.push(...deepDiff(name, joinPath(base, key), expected[key], actual[key]));
    }
    return out;
  }
  return expected === actual ? [] : [{ kind: "changed", name, path: base, expected, actual }];
}

export function diffPolicy(
  expected: CanonicalSentryPolicy[],
  actual: CanonicalSentryPolicy[],
): Drift[] {
  const drifts: Drift[] = [];
  const byExpected = new Map(expected.map((policy) => [policy.name, policy]));
  const byActual = new Map(actual.map((policy) => [policy.name, policy]));
  for (const [name, expectedPolicy] of byExpected) {
    const actualPolicy = byActual.get(name);
    if (!actualPolicy) drifts.push({ kind: "missing", name });
    else drifts.push(...deepDiff(name, "", expectedPolicy, actualPolicy));
  }
  for (const [name] of byActual) {
    if (!byExpected.has(name)) drifts.push({ kind: "extra", name });
  }
  return drifts;
}
