// branch escape: convert any git branch name to fragment-path-safe form.
// rule: lowercase / [a-z0-9_-] only / "/" -> "-" / max 64 chars (trailing trim).

const MAX_LEN = 64;

export function escapeBranch(branch: string): string {
  const lower = branch.toLowerCase();
  const replaced = lower.replace(/\//g, "-").replace(/[^a-z0-9_-]/g, "-");
  const collapsed = replaced.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  const fallback = collapsed.length === 0 ? "unnamed" : collapsed;
  return fallback.length > MAX_LEN ? fallback.slice(0, MAX_LEN) : fallback;
}
