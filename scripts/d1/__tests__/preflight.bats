#!/usr/bin/env bats

setup() {
  export TMPDIR="$BATS_TEST_TMPDIR"
  export PATH="$BATS_TEST_TMPDIR/bin:$PATH"
  mkdir -p "$BATS_TEST_TMPDIR/bin"
  cat > "$BATS_TEST_TMPDIR/cf.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  whoami) echo "ok" ;;
  "d1 list") echo "ubm-hyogo-db-staging" ;;
  d1\ migrations\ list*) echo "0008_schema_alias_hardening pending" ;;
  *) echo "unexpected $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$BATS_TEST_TMPDIR/cf.sh"
  export CF_WRAPPER="$BATS_TEST_TMPDIR/cf.sh"
}

@test "preflight emits pending migration json" {
  run bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening --json
  [ "$status" -eq 0 ]
  [[ "$output" == *'"unapplied":["0008_schema_alias_hardening"]'* ]]
}

@test "preflight rejects invalid env" {
  run bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env dev
  [ "$status" -eq 64 ]
}

@test "preflight rejects db env mismatch" {
  run bash scripts/d1/preflight.sh typo-db --env staging
  [ "$status" -eq 66 ]
}
