#!/usr/bin/env bash
# scripts/lib/redaction.sh — observability target diff script の redaction module
#
# 純粋関数 redact_stream を提供する。stdin → stdout で R-01〜R-06 を適用。
# token / OAuth / sink URL credential / dataset write key を出力に残さない。
# 詳細仕様: docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/outputs/phase-02/redaction-rules.md
#
# Usage:
#   . scripts/lib/redaction.sh
#   echo "$response" | redact_stream

# shellcheck shell=bash

# Public: redact_stream — stdin を読んで R-01〜R-06 を順に適用し stdout に書く
redact_stream() {
  # R-02 (Authorization / Bearer / Basic) を URL query より先に処理 (Authorization 値中の token を先に潰す)
  # R-06 OAuth ya29.* は R-01 より先に処理して特定 prefix を保持
  # R-04 AWS access key (AKIA...) も R-01 の汎用 token regex より先に
  # R-03 URL ?query は host を残すために最後に
  sed -E \
    -e 's/(Bearer|bearer|BEARER|Basic|basic|BASIC)[[:space:]]+[^[:space:],]+/\1 ***REDACTED_AUTH***/g' \
    -e 's/(authorization|Authorization|AUTHORIZATION)[[:space:]]*[:=][[:space:]]*[^[:space:],]+/\1: ***REDACTED_AUTH***/g' \
    -e 's/ya29\.[A-Za-z0-9_-]+/***REDACTED_OAUTH***/g' \
    -e 's/AKIA[0-9A-Z]{16}/***REDACTED_ACCESS_KEY***/g' \
    -e 's/(dataset_credential|access_key_id|secret_access_key|access_key|api_key|api-token|x-auth-key|x-auth-email)([[:space:]]*[:=][[:space:]]*"?)[^",[:space:]]+/\1\2***REDACTED***/Ig' \
    -e 's/[A-Za-z0-9_-]{40,}/***REDACTED_TOKEN***/g' \
    -e 's|(https?://[^/[:space:]]+(/[^?[:space:]]*)?)\?[^[:space:]]*|\1?***REDACTED***|g'
}

# Public: redact_string — 引数の文字列を redaction して echo
redact_string() {
  printf '%s' "$1" | redact_stream
}
