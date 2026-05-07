import {
  type RedactionViolation,
  type RedactionViolationPattern,
  RedactionViolationError,
} from "./types.ts";

const PATTERNS: Array<{ name: RedactionViolationPattern; regex: RegExp }> = [
  {
    name: "api-token",
    regex: /\b(?:Bearer\s+)?cf_(?:pat|api)_[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: "ipv4-full",
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
  {
    name: "ipv6-full",
    regex: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
  },
  {
    name: "user-agent-plain",
    regex: /Mozilla\/[0-9.]+\s*\([^)]*\)\s*[A-Za-z]+\/[0-9.]+/g,
  },
  {
    name: "email-plain",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
];

const TRUNCATED_HINTS = ["/24", "/48", "/56", "/64"];

function sample(s: string): string {
  return s.length > 32 ? `${s.slice(0, 32)}...redacted` : `${s}...redacted`;
}

function isTruncatedNetworkMatch(line: string, match: string): boolean {
  // truncated IP marker (e.g. "203.0.113.0/24" or "2001:db8::/48") を含む行は許容。
  if (!TRUNCATED_HINTS.some((h) => line.includes(h))) return false;
  // match 自体が末尾オクテットだけ 0 で truncated mark の直前にあれば許容
  return line.includes(`${match}/24`) || line.includes(`${match}/48`) ||
    line.includes(`${match}/56`) || line.includes(`${match}/64`);
}

/**
 * JSONL 全文に対し 5 pattern grep を行い、ヒット 0 件で return、
 * 1 件以上で RedactionViolationError を throw する fail-closed gate。
 *
 * truncated IP（/24, /48 等の CIDR 表記を含む行）は IP regex のヒットを
 * violation から除外する。fetcher 段階で redact 済みの正常パターン。
 */
export function guardJsonlOrThrow(jsonl: string): void {
  const violations: RedactionViolation[] = [];
  const lines = jsonl.split("\n");

  for (const { name, regex } of PATTERNS) {
    for (const line of lines) {
      if (!line) continue;
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(line)) !== null) {
        const matched = m[0];
        if (
          (name === "ipv4-full" || name === "ipv6-full") &&
          isTruncatedNetworkMatch(line, matched)
        ) {
          continue;
        }
        violations.push({ pattern: name, sample: sample(matched) });
        // 同 pattern × 同 line で複数 hit しても先頭 1 件で十分（fail-closed のため詳細不要）
        break;
      }
    }
  }

  if (violations.length > 0) {
    throw new RedactionViolationError(violations);
  }
}
