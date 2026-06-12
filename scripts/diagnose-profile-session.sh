#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PROFILE_SESSION_BASE_URL:-https://ubm-hyogo-web-staging.daishimanju.workers.dev}"
COOKIE_FILE="${PROFILE_SESSION_COOKIE_FILE:-}"
COOKIE_HEADER="${PROFILE_SESSION_COOKIE:-}"
CF_ENV="${PROFILE_SESSION_CF_ENV:-staging}"

if [[ -n "${COOKIE_FILE}" && -n "${COOKIE_HEADER}" ]]; then
  cat >&2 <<'USAGE'
Specify only one of PROFILE_SESSION_COOKIE or PROFILE_SESSION_COOKIE_FILE.

Examples:
  bash scripts/diagnose-profile-session.sh
  PROFILE_SESSION_COOKIE='__Secure-authjs.session-token=REDACTED' bash scripts/diagnose-profile-session.sh
  PROFILE_SESSION_COOKIE_FILE=/tmp/profile-cookie.txt bash scripts/diagnose-profile-session.sh

This script is read-only. It prints HTTP status and configuration presence only;
it does not print cookie, secret, token, or member identifiers.
USAGE
  exit 2
fi

curl_args=(-sS --max-time 20 -o /dev/null -w "%{http_code}" "${BASE_URL%/}/me")

if [[ -n "${COOKIE_FILE}" ]]; then
  curl_args=(-sS --max-time 20 -o /dev/null -w "%{http_code}" -b "${COOKIE_FILE}" "${BASE_URL%/}/me")
elif [[ -n "${COOKIE_HEADER}" ]]; then
  curl_args=(-sS --max-time 20 -o /dev/null -w "%{http_code}" -H "Cookie: ${COOKIE_HEADER}" "${BASE_URL%/}/me")
fi

set +e
status="$(curl "${curl_args[@]}")"
curl_exit=$?
set -e

if [[ -z "${status}" || "${curl_exit}" -ne 0 ]]; then
  status="000"
fi

printf 'profile_session.me_status=%s\n' "${status}"
printf 'profile_session.base_url=%s\n' "${BASE_URL%/}"
printf 'profile_session.cookie_source=%s\n' "$(if [[ -n "${COOKIE_FILE}" ]]; then printf 'file'; elif [[ -n "${COOKIE_HEADER}" ]]; then printf 'env'; else printf 'none'; fi)"
printf 'profile_session.curl_exit=%s\n' "${curl_exit}"

if [[ -x scripts/cf.sh ]]; then
  printf 'profile_session.cf_wrapper=present\n'
  printf 'profile_session.cf_env=%s\n' "${CF_ENV}"
  printf 'profile_session.tail_hint=%s\n' "bash scripts/cf.sh tail web ${CF_ENV} | rg 'server_fetch_failed|transportKind|baseHost'"
else
  printf 'profile_session.cf_wrapper=missing\n'
fi

case "${status}" in
  401) printf 'profile_session.candidate=H2_unauthenticated\n' ;;
  404) printf 'profile_session.candidate=resolved_404_or_route_miss\n' ;;
  410) printf 'profile_session.candidate=H3_deleted_member_status\n' ;;
  5*) printf 'profile_session.candidate=H4_server_error\n' ;;
  000) printf 'profile_session.candidate=H5_transport_failure\n' ;;
  2*) printf 'profile_session.candidate=no_current_failure\n' ;;
  *) printf 'profile_session.candidate=unexpected_status\n' ;;
esac
