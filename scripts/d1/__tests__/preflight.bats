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
  [[ "$output" == *'"expected_state":"pending"'* ]]
  [[ "$output" == *'"actual_state":"pending"'* ]]
}

@test "preflight accepts already applied migration when expected" {
  cat > "$BATS_TEST_TMPDIR/cf.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  whoami) echo "ok" ;;
  "d1 list") echo "ubm-hyogo-db-staging" ;;
  d1\ migrations\ list*) echo "0008_schema_alias_hardening applied" ;;
  *) echo "unexpected $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$BATS_TEST_TMPDIR/cf.sh"

  run bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening --expect applied --json
  [ "$status" -eq 0 ]
  [[ "$output" == *'"expected_state":"applied"'* ]]
  [[ "$output" == *'"actual_state":"applied"'* ]]
}

@test "preflight rejects unexpected migration state" {
  run bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening --expect applied
  [ "$status" -eq 65 ]
  [[ "$output" == *"expected=applied actual=pending"* ]]
}

@test "preflight rejects invalid env" {
  run bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env dev
  [ "$status" -eq 64 ]
}

@test "preflight rejects db env mismatch" {
  run bash scripts/d1/preflight.sh typo-db --env staging
  [ "$status" -eq 66 ]
}

@test "preflight rejects target-external pending migrations" {
  cat > "$BATS_TEST_TMPDIR/cf.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  whoami) echo "ok" ;;
  "d1 list") echo "ubm-hyogo-db-staging" ;;
  d1\ migrations\ list*) printf '0008_schema_alias_hardening pending\n0009_other pending\n' ;;
  *) echo "unexpected $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$BATS_TEST_TMPDIR/cf.sh"

  run bash scripts/d1/preflight.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening
  [ "$status" -eq 67 ]
  [[ "$output" == *"target-external pending migrations exist"* ]]
}
