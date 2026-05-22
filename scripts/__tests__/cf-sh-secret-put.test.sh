#!/usr/bin/env bash
set -euo pipefail

fail=0

set +e
printf '' | CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging --dry-run >/tmp/cf-sh-empty.out 2>/tmp/cf-sh-empty.err
ec=$?
set -e
if [[ "$ec" -ne 78 ]]; then
  echo "FAIL [CFSH-01] empty stdin should exit 78, got $ec"
  fail=$((fail + 1))
elif ! grep -Fq "refusing empty stdin" /tmp/cf-sh-empty.err; then
  echo "FAIL [CFSH-01] empty stdin error message missing"
  fail=$((fail + 1))
else
  echo "PASS [CFSH-01] empty secret stdin rejected"
fi

set +e
printf '%s' "validlongvaluevalidlongvaluevalidlongvalue" | CF_SH_SKIP_WITH_ENV=1 bash scripts/cf.sh secret put AUTH_SECRET --config apps/api/wrangler.toml --env staging --dry-run >/tmp/cf-sh-valid.out 2>/tmp/cf-sh-valid.err
ec=$?
set -e
if [[ "$ec" -ne 0 ]]; then
  echo "FAIL [CFSH-02] non-empty dry-run should exit 0, got $ec"
  fail=$((fail + 1))
elif ! grep -Fq "accepted non-empty stdin" /tmp/cf-sh-valid.err; then
  echo "FAIL [CFSH-02] dry-run acceptance message missing"
  fail=$((fail + 1))
else
  echo "PASS [CFSH-02] non-empty secret stdin dry-run accepted"
fi

rm -f /tmp/cf-sh-empty.out /tmp/cf-sh-empty.err /tmp/cf-sh-valid.out /tmp/cf-sh-valid.err

if [[ "$fail" -ne 0 ]]; then
  echo "FAIL: $fail cases"
  exit 1
fi
echo "OK: cf.sh secret put guard tests pass"
