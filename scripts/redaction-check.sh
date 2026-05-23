#!/usr/bin/env bash
set -euo pipefail

LOG_FILE=""
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
TOKEN_VALUE="${CLOUDFLARE_API_TOKEN_VALUE_FOR_TEST:-}"
TOKEN_REGEX='[A-Za-z0-9_-]{40,}'
JWT_REGEX='eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'

usage() {
  echo "usage: $0 [--log <path>] [--account-id <id>] [--token-value-for-test <value>]" >&2
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --log)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      LOG_FILE="$2"
      shift 2
      ;;
    --account-id)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      ACCOUNT_ID="$2"
      shift 2
      ;;
    --token-value-for-test)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      TOKEN_VALUE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [ -n "$LOG_FILE" ] && [ ! -f "$LOG_FILE" ]; then
  echo "ERROR: log file not found: $LOG_FILE" >&2
  exit 1
fi

INPUT_SRC="${LOG_FILE:-/dev/stdin}"
TMP_FILE=""
if [ "$INPUT_SRC" = "/dev/stdin" ]; then
  TMP_FILE="$(mktemp)"
  cat > "$TMP_FILE"
  INPUT_SRC="$TMP_FILE"
fi

LEAK_FOUND=0
MATCH_FILE=""

# shellcheck disable=SC2317,SC2329 # invoked by EXIT trap
cleanup() {
  rm -f ${TMP_FILE:+"$TMP_FILE"} ${MATCH_FILE:+"$MATCH_FILE"}
}
trap 'cleanup' EXIT

mask_line() {
  sed -E 's/[A-Za-z0-9_-]{4,}/****/g'
}

MATCH_FILE="$(mktemp)"

if [ -n "$ACCOUNT_ID" ] && grep -F -n "$ACCOUNT_ID" "$INPUT_SRC" >"$MATCH_FILE" 2>/dev/null; then
  echo "::error::Cloudflare Account ID leaked in log"
  mask_line < "$MATCH_FILE"
  LEAK_FOUND=1
fi

if [ -n "$TOKEN_VALUE" ] && grep -F -n "$TOKEN_VALUE" "$INPUT_SRC" >"$MATCH_FILE" 2>/dev/null; then
  echo "::error::Cloudflare API token leaked in log"
  mask_line < "$MATCH_FILE"
  LEAK_FOUND=1
fi

TOKEN_MATCHES="$(grep -E -n "$TOKEN_REGEX" "$INPUT_SRC" 2>/dev/null | grep -v -E '(sha256|sha1|sha512|commit|hash|node_modules|integrity|pnpm-lock|package-lock)' || true)"
if [ -n "$TOKEN_MATCHES" ]; then
  echo "::error::token-like long string detected in log"
  printf '%s\n' "$TOKEN_MATCHES" | mask_line
  LEAK_FOUND=1
fi

JWT_MATCHES="$(grep -E -n "$JWT_REGEX" "$INPUT_SRC" 2>/dev/null || true)"
if [ -n "$JWT_MATCHES" ]; then
  echo "::error::JWT-like token detected in log"
  printf '%s\n' "$JWT_MATCHES" | mask_line
  LEAK_FOUND=1
fi

CF_AUD_MATCHES="$(grep -F -n "cloudflare-aud" "$INPUT_SRC" 2>/dev/null || true)"
if [ -n "$CF_AUD_MATCHES" ]; then
  echo "::error::cloudflare-aud claim detected in log"
  printf '%s\n' "$CF_AUD_MATCHES" | mask_line
  LEAK_FOUND=1
fi

exit "$LEAK_FOUND"
