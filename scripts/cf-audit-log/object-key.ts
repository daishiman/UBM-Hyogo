import type { R2ObjectKey } from "./types.ts";

const POLICY_VERSION = "v1" as const;

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * UTC 固定で R2 object key を生成する。JST 混在は restore drill での
 * range 指定を破綻させるため UTC 固定を契約とする。
 */
export function buildObjectKey(date: Date): R2ObjectKey {
  const yyyy = date.getUTCFullYear();
  const mm = date.getUTCMonth() + 1;
  const dd = date.getUTCDate();
  const yyyyStr = yyyy.toString();
  const mmStr = pad2(mm);
  const ddStr = pad2(dd);
  const keyStr = `audit/${POLICY_VERSION}/yyyy=${yyyyStr}/mm=${mmStr}/dd=${ddStr}/cf-audit-log-${yyyyStr}${mmStr}${ddStr}.jsonl.gz`;

  return {
    policyVersion: POLICY_VERSION,
    yyyy,
    mm,
    dd,
    toString(): string {
      return keyStr;
    },
  };
}

/** UTC 0:00 切り捨ての半開区間に正規化 */
export function normalizeUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** UTC 半開区間 [from, to) を 1 日単位の partition に分割 */
export function enumerateDayPartitions(
  fromUtc: Date,
  toUtc: Date,
): Array<{ yyyy: number; mm: number; dd: number; startUtc: Date; endUtc: Date }> {
  const out: Array<{ yyyy: number; mm: number; dd: number; startUtc: Date; endUtc: Date }> = [];
  let cursor = normalizeUtcDay(fromUtc);
  const end = normalizeUtcDay(toUtc);
  while (cursor.getTime() < end.getTime()) {
    const next = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    out.push({
      yyyy: cursor.getUTCFullYear(),
      mm: cursor.getUTCMonth() + 1,
      dd: cursor.getUTCDate(),
      startUtc: cursor,
      endUtc: next,
    });
    cursor = next;
  }
  return out;
}
