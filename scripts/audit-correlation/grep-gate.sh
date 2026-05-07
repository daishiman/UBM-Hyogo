#!/usr/bin/env bash
# audit-correlation grep gate: verify output JSON contains no PII / secrets.
# Usage: scripts/audit-correlation/grep-gate.sh <output.json>
# exit 0 = clean, 1 = PII detected, 2 = bad args
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: grep-gate.sh <output.json>" >&2
  exit 2
fi

TARGET="$1"
if [[ ! -f "$TARGET" ]]; then
  echo "file not found: $TARGET" >&2
  exit 2
fi

# 禁止パターン:
#  1) 完全 IPv4 (e.g. 203.0.113.45) — ipPrefix の "/24" 形式 (203.0.113.0/24) は許可するため、
#     "<digit><dot><digit><dot><digit><dot><digit><non-/0>" を厳格に検出するために、
#     ".0/24" を除外する後置きフィルタを使う。
#  2) 完全 User-Agent 文字列 (User-Agent: ...)
#  3) GitHub PAT 形式 (ghp_*, github_pat_*)
#  4) 完全 IPv6 (ipPrefix の "::/48" 形式は許可)
#  5) 完全 email
#  6) salt literal
DETECTED=0

if grep -E -o '\b[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\b' "$TARGET" \
  | grep -v -E '\.0/24$' \
  | grep -v -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.0$' \
  | grep -q .; then
  echo "DETECTED: full IPv4 address in output" >&2
  DETECTED=1
fi

if grep -E -q 'User-Agent:[[:space:]]+\S' "$TARGET"; then
  echo "DETECTED: User-Agent header string in output" >&2
  DETECTED=1
fi

if grep -E -q '(ghp_|github_pat_)[A-Za-z0-9_]+' "$TARGET"; then
  echo "DETECTED: GitHub PAT-like token in output" >&2
  DETECTED=1
fi

if sed -E 's/[0-9A-Fa-f:]+::\/48//g' "$TARGET" \
  | grep -E -q '\b([0-9A-Fa-f]{1,4}:){2,}[0-9A-Fa-f:]*[0-9A-Fa-f]{1,4}(/[0-9]{1,3})?\b'; then
  echo "DETECTED: full IPv6 address in output" >&2
  DETECTED=1
fi

if grep -E -q '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' "$TARGET"; then
  echo "DETECTED: full email address in output" >&2
  DETECTED=1
fi

if grep -E -q '"?(AUDIT_CORRELATION_SALT|auditCorrelationSalt|salt)"?[[:space:]]*[:=][[:space:]]*"?[^",}]+' "$TARGET"; then
  echo "DETECTED: salt literal in output" >&2
  DETECTED=1
fi

if [[ "$DETECTED" -eq 1 ]]; then
  exit 1
fi

echo "grep-gate clean: no PII / secret detected in $TARGET"
exit 0
