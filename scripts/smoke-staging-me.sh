#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-}"
OUT_DIR=""
CI_SUMMARY=0

usage() {
  cat <<'USAGE'
usage: bash scripts/smoke-staging-me.sh staging [--out-dir <path>] [--ci-summary]

Requires one authentication source:
  STAGING_ME_BEARER, STAGING_SESSION_COOKIE, STAGING_AUTH_HEADER, STAGING_COOKIE_HEADER,
  or STAGING_STORAGE_STATE (Playwright storage-state JSON).

No bearer, cookie, or Set-Cookie values are written to output.
USAGE
}

if [[ "$ENVIRONMENT" == "-h" || "$ENVIRONMENT" == "--help" ]]; then
  usage
  exit 0
fi
if [[ "$ENVIRONMENT" != "staging" ]]; then
  usage >&2
  exit 2
fi
shift

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out-dir) OUT_DIR="${2:?--out-dir requires a path}"; shift 2 ;;
    --ci-summary) CI_SUMMARY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "smoke-staging-me: unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

WEB_BASE="${STAGING_WEB_BASE:-https://ubm-hyogo-web-staging.daishimanju.workers.dev}"
API_BASE="${STAGING_API_BASE:-$WEB_BASE/api}"
AUTH_HEADER="${STAGING_AUTH_HEADER:-}"
COOKIE_HEADER="${STAGING_COOKIE_HEADER:-}"

if [[ -z "$AUTH_HEADER" && -n "${STAGING_ME_BEARER:-}" ]]; then
  AUTH_HEADER="Bearer ${STAGING_ME_BEARER}"
fi
if [[ -z "$COOKIE_HEADER" && -n "${STAGING_SESSION_COOKIE:-}" ]]; then
  COOKIE_HEADER="${STAGING_SESSION_COOKIE}"
fi
if [[ -z "$COOKIE_HEADER" && -n "${STAGING_STORAGE_STATE:-}" ]]; then
  if [[ ! -f "$STAGING_STORAGE_STATE" ]]; then
    echo "smoke-staging-me: STAGING_STORAGE_STATE file not found" >&2
    exit 2
  fi
  COOKIE_HEADER="$(
    node - "$STAGING_STORAGE_STATE" "$WEB_BASE" <<'NODE'
const fs = require("node:fs");
const [file, webBase] = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(file, "utf8"));
const host = new URL(webBase).hostname;
const cookies = Array.isArray(state.cookies) ? state.cookies : [];
const header = cookies
  .filter((cookie) => {
    if (typeof cookie.name !== "string" || typeof cookie.value !== "string") return false;
    const domain = String(cookie.domain ?? "");
    return domain === host || domain === `.${host}` || host.endsWith(domain.replace(/^\./, "."));
  })
  .map((cookie) => `${cookie.name}=${cookie.value}`)
  .join("; ");
process.stdout.write(header);
NODE
  )"
fi

if [[ -z "$AUTH_HEADER" && -z "$COOKIE_HEADER" ]]; then
  echo "smoke-staging-me: STAGING_ME_BEARER, STAGING_SESSION_COOKIE, STAGING_AUTH_HEADER, STAGING_COOKIE_HEADER, or STAGING_STORAGE_STATE is required" >&2
  exit 2
fi

args=(-sS -H "accept: application/json")
if [[ -n "$AUTH_HEADER" ]]; then args+=(-H "authorization: $AUTH_HEADER"); fi
if [[ -n "$COOKIE_HEADER" ]]; then args+=(-H "cookie: $COOKIE_HEADER"); fi

api_url="${API_BASE%/}/me"
profile_url="${WEB_BASE%/}/profile"
status_file="$(mktemp)"
body="$(curl -sS -o - -w '%{http_code}' "${args[@]}" "$api_url")"
status="${body: -3}"
body="${body%???}"
printf '%s' "$status" > "$status_file"
if [[ "$status" != "200" ]]; then
  echo "smoke-staging-me: /me returned HTTP $status" >&2
  rm -f "$status_file"
  exit 1
fi
if ! printf '%s' "$body" | grep -Eq '"memberId"[[:space:]]*:'; then
  echo "smoke-staging-me: /api/me did not include memberId" >&2
  rm -f "$status_file"
  exit 1
fi

profile_args=(-fsS)
if [[ -n "$COOKIE_HEADER" ]]; then profile_args+=(-H "cookie: $COOKIE_HEADER"); fi
if [[ -n "$AUTH_HEADER" ]]; then profile_args+=(-H "authorization: $AUTH_HEADER"); fi
profile="$(curl "${profile_args[@]}" "$profile_url")"
if ! printf '%s' "$profile" | grep -Fq 'data-testid="profile-authenticated-root"'; then
  echo "smoke-staging-me: /profile did not render authenticated root" >&2
  rm -f "$status_file"
  exit 1
fi
if printf '%s' "$profile" | grep -Fq 'data-testid="profile-relogin-card"' ||
  printf '%s' "$profile" | grep -Fq "セッション情報を取得できませんでした"; then
  echo "smoke-staging-me: /profile still renders session failure" >&2
  rm -f "$status_file"
  exit 1
fi

if [[ -n "$OUT_DIR" ]]; then
  mkdir -p "$OUT_DIR"
  {
    printf 'environment=staging\n'
    printf 'api_me_status=%s\n' "$status"
    printf 'profile_authenticated_root=present\n'
    printf 'profile_relogin_card=absent\n'
  } > "$OUT_DIR/smoke-staging-me.txt"
fi

if [[ "$CI_SUMMARY" -eq 1 ]]; then
  if [[ -n "$OUT_DIR" ]]; then
    printf '{"environment":"staging","apiMeStatus":%s,"profileAuthenticatedRoot":true,"profileReloginCard":false}\n' "$status" > "$OUT_DIR/summary.json"
  else
    printf '{"environment":"staging","apiMeStatus":%s,"profileAuthenticatedRoot":true,"profileReloginCard":false}\n' "$status"
  fi
fi

rm -f "$status_file"
echo "smoke-staging-me: PASS"
