#!/usr/bin/env bash
# UT-15 Phase 4 F-03: cf-waf-apply 用の bash function ライブラリ。
# - 副作用は printf / curl のみ。set -euo pipefail 前提。
# - secret 値は stdout / stderr / file に絶対に出さない。
set -euo pipefail

CF_API_BASE="${CF_API_BASE:-https://api.cloudflare.com/client/v4}"

# 戻り値: 0 成功 / 11 token / 12 schema / 13 api / 14 diff
EXIT_TOKEN=11
EXIT_SCHEMA=12
EXIT_API=13
EXIT_DIFF=14

cf_waf_log() {
  printf '[cf-waf-apply] %s\n' "$*" >&2
}

cf_waf_die() {
  local code="$1"; shift
  printf '[cf-waf-apply] error: %s\n' "$*" >&2
  exit "$code"
}

preflight_check() {
  if ! command -v jq >/dev/null 2>&1; then
    cf_waf_die "$EXIT_SCHEMA" "jq is required"
  fi
  if [ "${CF_WAF_SKIP_TOKEN_CHECK:-0}" != "1" ]; then
    if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
      cf_waf_die "$EXIT_TOKEN" "CLOUDFLARE_API_TOKEN is not injected (use op run)"
    fi
  fi
  printf '{"preflight":"ok"}\n'
}

load_config() {
  local config_path="$1"
  if [ ! -f "$config_path" ]; then
    cf_waf_die "$EXIT_SCHEMA" "config not found: $config_path"
  fi
  if ! jq empty "$config_path" >/dev/null 2>&1; then
    cf_waf_die "$EXIT_SCHEMA" "config is not valid JSON: $config_path"
  fi
  jq -e '
    .version == 1
    and (.zones | type == "array")
    and (.customRules | type == "array")
    and (.rateLimitRules | type == "array")
    and (.managedRuleset.phase == "http_request_firewall_managed")
  ' "$config_path" >/dev/null \
    || cf_waf_die "$EXIT_SCHEMA" "config schema invalid: $config_path"
  jq -c '.' "$config_path"
}

# 期待される宣言を Cloudflare API 風の payload 形に正規化（dry-run 用 expected）
normalize_expected() {
  local config_json="$1"
  local mode="$2"
  printf '%s' "$config_json" | jq --arg mode "$mode" '
    {
      managedRuleset: {
        phase: .managedRuleset.phase,
        mode: ( if $mode == "enforce" then "on" else .managedRuleset.defaultMode end )
      },
      customRules: [
        .customRules[] | {
          name: .name,
          expression: .expression,
          action: .action,
          mode: ( if $mode == "enforce" then "enforce" else .mode end )
        }
      ],
      rateLimitRules: [
        .rateLimitRules[] | {
          name: .name,
          expression: .expression,
          action: .action,
          mode: ( if $mode == "enforce" then "enforce" else .mode end ),
          ratelimit: .ratelimit
        }
      ]
    }
  '
}

fetch_remote_state() {
  local zone_id="$1"
  local token="$2"
  if [ "${CF_WAF_OFFLINE:-0}" = "1" ]; then
    printf '{"offline":true,"zone":"%s"}\n' "$zone_id"
    return 0
  fi
  local resp http_code
  resp=$(curl --fail-with-body --silent --show-error \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -w "\n%{http_code}" \
    "$CF_API_BASE/zones/$zone_id/rulesets" \
    || cf_waf_die "$EXIT_API" "fetch_remote_state failed for zone $zone_id")
  http_code="${resp##*$'\n'}"
  if [ "$http_code" != "200" ]; then
    cf_waf_die "$EXIT_API" "non-200 response from rulesets list: $http_code"
  fi
  printf '%s' "${resp%$'\n'*}"
}

compute_diff() {
  local expected_json="$1"
  local actual_json="$2"
  local diff
  diff=$(jq -n --argjson e "$expected_json" --argjson a "$actual_json" '
    {
      expected: $e,
      actual_summary: ( $a | if type == "object" then keys else "list" end ),
      changed: ( $a | if type == "object" and (.offline // false) then true else true end )
    }
  ')
  printf '%s' "$diff"
}

print_dry_run() {
  local diff_json="$1"
  printf '%s\n' "$diff_json"
}

apply_managed_ruleset() {
  cf_waf_die "$EXIT_API" "apply_managed_ruleset is not implemented before Phase 13 G1 approval"
}

apply_custom_rules() {
  cf_waf_die "$EXIT_API" "apply_custom_rules is not implemented before Phase 13 G1 approval"
}

apply_rate_limit_rules() {
  cf_waf_die "$EXIT_API" "apply_rate_limit_rules is not implemented before Phase 13 G1 approval"
}
