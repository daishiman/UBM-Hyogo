#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${PROFILE_SESSION_BASE_URL:-https://ubm-hyogo-web-staging.daishimanju.workers.dev}"
API_BASE_URL="${PROFILE_SESSION_API_BASE_URL:-https://ubm-hyogo-api-staging.daishimanju.workers.dev}"
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

cookie_args=()

if [[ -n "${COOKIE_FILE}" ]]; then
  cookie_args=(-b "${COOKIE_FILE}")
elif [[ -n "${COOKIE_HEADER}" ]]; then
  cookie_args=(-H "Cookie: ${COOKIE_HEADER}")
fi

curl_status() {
  local url="$1"
  local status
  set +e
  if [[ "${#cookie_args[@]}" -gt 0 ]]; then
    status="$(curl -sS --max-time 20 -o /dev/null -w "%{http_code}" "${cookie_args[@]}" "${url}")"
  else
    status="$(curl -sS --max-time 20 -o /dev/null -w "%{http_code}" "${url}")"
  fi
  local exit_code=$?
  set -e
  if [[ -z "${status}" || "${exit_code}" -ne 0 ]]; then
    status="000"
  fi
  printf '%s %s\n' "${status}" "${exit_code}"
}

read -r web_api_me_status web_api_me_curl_exit < <(curl_status "${BASE_URL%/}/api/me/profile")
read -r api_me_status api_me_curl_exit < <(curl_status "${API_BASE_URL%/}/me")
read -r api_me_healthz_status api_me_healthz_curl_exit < <(curl_status "${API_BASE_URL%/}/me/healthz")
read -r api_root_status api_root_curl_exit < <(curl_status "${API_BASE_URL%/}/")

profile_data_cause="skipped"
if [[ -n "${COOKIE_FILE}" || -n "${COOKIE_HEADER}" ]]; then
  set +e
  profile_html="$(curl -sS --max-time 20 "${cookie_args[@]}" "${BASE_URL%/}/profile")"
  profile_exit=$?
  set -e
  if [[ "${profile_exit}" -eq 0 ]]; then
    profile_data_cause="$(
      printf '%s' "${profile_html}" |
        sed -n 's/.*data-cause="\([^"]*\)".*/\1/p' |
        head -n 1
    )"
    if [[ -z "${profile_data_cause}" ]]; then
      profile_data_cause="none"
    fi
  else
    profile_data_cause="profile_fetch_failed"
  fi
fi

printf 'profile_session.web_api_me_status=%s\n' "${web_api_me_status}"
printf 'profile_session.api_me_status=%s\n' "${api_me_status}"
printf 'profile_session.api_me_healthz_status=%s\n' "${api_me_healthz_status}"
printf 'profile_session.api_root_status=%s\n' "${api_root_status}"
printf 'profile_session.base_url=%s\n' "${BASE_URL%/}"
printf 'profile_session.api_base_url=%s\n' "${API_BASE_URL%/}"
printf 'profile_session.cookie_source=%s\n' "$(if [[ -n "${COOKIE_FILE}" ]]; then printf 'file'; elif [[ -n "${COOKIE_HEADER}" ]]; then printf 'env'; else printf 'none'; fi)"
printf 'profile_session.web_api_me_curl_exit=%s\n' "${web_api_me_curl_exit}"
printf 'profile_session.api_me_curl_exit=%s\n' "${api_me_curl_exit}"
printf 'profile_session.api_me_healthz_curl_exit=%s\n' "${api_me_healthz_curl_exit}"
printf 'profile_session.api_root_curl_exit=%s\n' "${api_root_curl_exit}"
printf 'profile_session.profile_data_cause=%s\n' "${profile_data_cause}"

# route 差分判定（healthz=200 かつ /me=404 → route 設定異常の sign / S1 強シグナル）
case "${api_me_healthz_status}:${api_me_status}" in
  200:404) api_route_diff="healthz_alive_me_miss" ;;   # S1 強シグナル
  200:401) api_route_diff="both_alive" ;;              # route 健全・認証層到達
  200:2*)  api_route_diff="both_alive" ;;
  200:410) api_route_diff="both_alive" ;;
  404:*|000:*) api_route_diff="healthz_miss" ;;        # api worker 自体が未到達/未デプロイ
  *)       api_route_diff="indeterminate" ;;
esac
printf 'profile_session.api_route_diff=%s\n' "${api_route_diff}"

if [[ -x scripts/cf.sh ]]; then
  printf 'profile_session.cf_wrapper=present\n'
  printf 'profile_session.cf_env=%s\n' "${CF_ENV}"
  printf 'profile_session.tail_hint=%s\n' "bash scripts/cf.sh tail web ${CF_ENV} | rg 'server_fetch_failed|transportKind|baseHost'"
else
  printf 'profile_session.cf_wrapper=missing\n'
fi

case "${web_api_me_status}:${api_me_status}" in
  2*:2*) printf 'profile_session.candidate=no_current_failure\n' ;;
  401:401) printf 'profile_session.candidate=unauthenticated_control\n' ;;
  000:2*|000:401|000:410|000:4*) printf 'profile_session.candidate=web_transport_failure\n' ;;
  5*:2*|5*:401|5*:410|5*:4*) printf 'profile_session.candidate=web_proxy_failure\n' ;;
  2*:000|401:000|410:000|4*:000) printf 'profile_session.candidate=api_direct_transport_failure\n' ;;
  *:5*) printf 'profile_session.candidate=api_worker_server_error\n' ;;
  404:*) printf 'profile_session.candidate=web_proxy_route_miss\n' ;;
  *:410) printf 'profile_session.candidate=deleted_member_status\n' ;;
  000:000) printf 'profile_session.candidate=dual_transport_failure\n' ;;
  *) printf 'profile_session.candidate=unexpected_status_combination\n' ;;
esac

printf 'profile_session.deployments_hint=compare latest web-cd and api-cd workflow runs for the same commit after user approval\n'
printf 'profile_session.parity_hint=%s\n' "compare web and api worker versions: bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env ${CF_ENV} ; bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env ${CF_ENV} (run after user approval; read-only)"
printf 'profile_session.tail_hint=bash scripts/cf.sh tail --env %s\n' "${CF_ENV}"
