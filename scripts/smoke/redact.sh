#!/usr/bin/env bash
set -euo pipefail

sed -E \
  -e 's/^([Ss]et-[Cc]ookie):.*/\1: [REDACTED]/' \
  -e 's/^([Cc]ookie):.*/\1: [REDACTED]/' \
  -e 's/^([Aa]uthorization):.*/\1: [REDACTED]/' \
  -e 's/Bearer [A-Za-z0-9._~+\/=-]+/Bearer [REDACTED]/g' \
  -e 's/cf-_session=[A-Za-z0-9._-]+/cf-_session=[REDACTED]/g' \
  -e 's/(__Secure-authjs[A-Za-z0-9._-]*=)[A-Za-z0-9._~+\/=-]+/\1[REDACTED]/g' \
  -e 's/("session[Tt]oken"[[:space:]]*:[[:space:]]*")[^"]+(")/\1[REDACTED]\2/g' \
  -e 's/("[Aa]ccess[Tt]oken"[[:space:]]*:[[:space:]]*")[^"]+(")/\1[REDACTED]\2/g'
