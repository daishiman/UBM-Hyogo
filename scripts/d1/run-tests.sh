#!/usr/bin/env bash
set -euo pipefail

if command -v bats >/dev/null 2>&1; then
  exec bats scripts/d1/__tests__/*.bats
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"; rm -rf .evidence/d1/20260503T000000Z' EXIT

cat > "$tmp/cf.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  whoami) echo "ok" ;;
  "d1 list") echo "ubm-hyogo-db-staging" ;;
  d1\ migrations\ list*) echo "0008_schema_alias_hardening pending" ;;
  d1\ migrations\ apply*) echo "apply should not run in dry-run" >&2; exit 99 ;;
  *) echo "unexpected $*" >&2; exit 1 ;;
esac
SH
chmod +x "$tmp/cf.sh"
export CF_WRAPPER="$tmp/cf.sh"

assert_contains() {
  case "$1" in
    *"$2"*) ;;
    *) echo "assertion failed: expected output to contain $2" >&2; exit 1 ;;
  esac
}

out="$(bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening --json)"
assert_contains "$out" '"unapplied":["0008_schema_alias_hardening"]'

if bash scripts/d1/preflight.sh typo-db --env staging >/dev/null 2>&1; then
  echo "preflight db/env mismatch should fail" >&2
  exit 1
fi

if bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env dev >/dev/null 2>&1; then
  echo "preflight invalid env should fail" >&2
  exit 1
fi

out="$(bash scripts/d1/evidence.sh --ts 20260503T000000Z --type apply --stdin <<< "Authorization: Bearer abc")"
assert_contains "$out" ".evidence/d1/20260503T000000Z/apply.log"
if grep -q "Bearer abc" .evidence/d1/20260503T000000Z/apply.log; then
  echo "redaction failed" >&2
  exit 1
fi

out="$(bash scripts/d1/evidence.sh --ts 20260503T000000Z --type meta --db ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening --dry-run 1 --exit-code 0)"
assert_contains "$out" ".evidence/d1/20260503T000000Z/meta.json"
assert_contains "$(cat .evidence/d1/20260503T000000Z/meta.json)" '"dry_run":true'

DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening >/dev/null

echo "scripts/d1 fallback tests passed"
