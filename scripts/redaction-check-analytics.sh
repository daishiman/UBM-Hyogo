#!/usr/bin/env bash
# Cloudflare Analytics export JSON の PII / secret 混入を検出する CI gate。
# 1 つでも検出したら exit 1 で fail させ、commit / push をブロックする。
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "usage: $0 <json-file> [<json-file>...]" >&2
  exit 2
fi

PATTERNS=(
  '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
  '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b'
  '("?(bearer|token|api[_-]?token|secret)"?[[:space:]:=]+\"?[A-Za-z0-9_-]{20,}|bearer[[:space:]]+[A-Za-z0-9_-]{20,})'
  '\?[A-Za-z0-9_]+='
  '"?(member|memberId|member_id)"?[[:space:]:=]+\"?[A-Za-z0-9_-]+'
  '"?(session|sid|cookie)"?[[:space:]:=]+'
)

PATTERN_NAMES=(
  "email"
  "ipv4"
  "bearer-or-token"
  "url-query"
  "member-id"
  "session-or-cookie"
)

fail=0
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "redaction-check: file not found: $f" >&2
    fail=1
    continue
  fi
  for i in "${!PATTERNS[@]}"; do
    pattern="${PATTERNS[$i]}"
    name="${PATTERN_NAMES[$i]}"
    if grep -E -i "$pattern" "$f" >/dev/null; then
      echo "REDACTION VIOLATION in $f: pattern=$name" >&2
      fail=1
    fi
  done
done

exit "$fail"
