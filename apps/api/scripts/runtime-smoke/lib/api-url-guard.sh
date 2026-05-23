#!/usr/bin/env bash
# shellcheck shell=bash

require_api_url() {
  local env_name="$1" api_url="$2" staging_url="${3:-}"

  if [ -z "$api_url" ]; then
    printf 'runtime-smoke: %s API URL is required\n' "$env_name" >&2
    return 2
  fi

  case "$api_url" in
    http://*|https://*) ;;
    *)
      printf 'runtime-smoke: %s API URL must start with http:// or https://\n' "$env_name" >&2
      return 2
      ;;
  esac

  if [ "$env_name" = "production" ]; then
    case "$api_url" in
      *staging*|*preview*|*localhost*|*127.0.0.1*)
        printf 'runtime-smoke: production URL points at a non-production host\n' >&2
        return 2
        ;;
    esac
    if [ -n "$staging_url" ] && [ "$api_url" = "$staging_url" ]; then
      printf 'runtime-smoke: PRODUCTION_API_URL must differ from STAGING_API_URL\n' >&2
      return 2
    fi
  fi
}

