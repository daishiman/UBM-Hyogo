#!/usr/bin/env bats

setup() {
  cat > "$BATS_TEST_TMPDIR/cf.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  *idx_schema_aliases_revision_stablekey_unique*) echo "idx_schema_aliases_revision_stablekey_unique" ;;
  *idx_schema_aliases_revision_question_unique*) echo "idx_schema_aliases_revision_question_unique" ;;
  *schema_aliases*) echo "schema_aliases" ;;
  *"PRAGMA table_info(schema_diff_queue);"*) printf 'backfill_cursor\nbackfill_status\n' ;;
  *) echo "unexpected $*" >&2; exit 1 ;;
esac
SH
  chmod +x "$BATS_TEST_TMPDIR/cf.sh"
  export CF_WRAPPER="$BATS_TEST_TMPDIR/cf.sh"
}

@test "postcheck verifies five schema objects" {
  run bash scripts/d1/postcheck.sh ubm-hyogo-db-staging --env staging
  [ "$status" -eq 0 ]
  [[ "$output" == *'"missing":[]'* ]]
}
