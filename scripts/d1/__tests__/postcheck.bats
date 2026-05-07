#!/usr/bin/env bats

setup() {
  cat > "$BATS_TEST_TMPDIR/cf.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  *"PRAGMA table_info(schema_diff_queue);"*) printf 'backfill_cursor\nbackfill_status\n' ;;
  *) echo "unexpected $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$BATS_TEST_TMPDIR/cf.sh"
  export CF_WRAPPER="$BATS_TEST_TMPDIR/cf.sh"
}

@test "postcheck verifies hardening migration columns" {
  run bash scripts/d1/postcheck.sh ubm-hyogo-db-staging --env staging
  [ "$status" -eq 0 ]
  [[ "$output" == *'"missing":[]'* ]]
  [[ "$output" == *'"schema_diff_queue.backfill_cursor":true'* ]]
  [[ "$output" == *'"schema_diff_queue.backfill_status":true'* ]]
  [[ "$output" != *"schema_aliases"* ]]
}
