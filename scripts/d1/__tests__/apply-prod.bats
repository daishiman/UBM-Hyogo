#!/usr/bin/env bats

setup() {
  cat > "$BATS_TEST_TMPDIR/cf.sh" <<'SH'
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
  chmod +x "$BATS_TEST_TMPDIR/cf.sh"
  export CF_WRAPPER="$BATS_TEST_TMPDIR/cf.sh"
  export DRY_RUN=1
}

@test "apply-prod dry-run skips migrations apply and writes evidence" {
  run bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening
  [ "$status" -eq 0 ]
  [[ "$output" == *".evidence/d1/"* ]]
}

@test "apply-prod dry-run records skipped postcheck" {
  run bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening
  [ "$status" -eq 0 ]
  evidence_dir="${output##*: }"
  grep -q '"postcheck":"skipped"' "$evidence_dir/postcheck.json"
}
