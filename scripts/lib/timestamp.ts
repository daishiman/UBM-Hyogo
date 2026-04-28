// timestamp utilities for skill ledger fragments.

export function nowUtcCompact(now: Date = new Date()): string {
  const y = now.getUTCFullYear().toString().padStart(4, "0");
  const m = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = now.getUTCDate().toString().padStart(2, "0");
  const hh = now.getUTCHours().toString().padStart(2, "0");
  const mm = now.getUTCMinutes().toString().padStart(2, "0");
  const ss = now.getUTCSeconds().toString().padStart(2, "0");
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

export function nowUtcIso(now: Date = new Date()): string {
  return now.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function compactToIso(compact: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(compact);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}
