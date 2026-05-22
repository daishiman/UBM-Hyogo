#!/usr/bin/env bats
# live-mode bats tests (Issue #553)
# - --mode=live と --token-env が必須
# - --dry-run 指定時は POST しない（exit 0）
# - token 値は env から読み、stdout/stderr に echo されない
# - grep gate: live mode の output に Slack webhook URL / PAT / salt が含まれない

setup() {
  REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../../.." && pwd)"
  TMP="$(mktemp -d)"
}

teardown() {
  rm -rf "$TMP"
}

@test "live mode: missing --endpoint exits 2" {
  run bash "$REPO_ROOT/scripts/audit-correlation/run.sh" --mode=live --token-env DUMMY_TOKEN_ENV
  [ "$status" -eq 2 ]
}

@test "live mode: missing --token-env exits 2" {
  run bash "$REPO_ROOT/scripts/audit-correlation/run.sh" --mode=live --endpoint https://example.com/internal/audit-correlation/run
  [ "$status" -eq 2 ]
}

@test "live mode: empty token env exits 2 without echoing token name's value" {
  unset MAYBE_EMPTY_TOKEN
  run bash "$REPO_ROOT/scripts/audit-correlation/run.sh" --mode=live \
    --endpoint https://example.com/internal/audit-correlation/run \
    --token-env MAYBE_EMPTY_TOKEN
  [ "$status" -eq 2 ]
  [[ "$output" != *"ghp_"* ]]
}

@test "live mode: --dry-run does not POST and exits 0" {
  export DUMMY_TOKEN="$(printf 't%.0s' {1..48})"
  run bash "$REPO_ROOT/scripts/audit-correlation/run.sh" --mode=live \
    --endpoint https://example.invalid/internal/audit-correlation/run \
    --token-env DUMMY_TOKEN \
    --dry-run
  [ "$status" -eq 0 ]
  # token 値が出力に含まれない
  [[ "$output" != *"$DUMMY_TOKEN"* ]]
}

@test "live mode: dry-run output does not contain Slack webhook URL or PAT literal" {
  export DUMMY_TOKEN="$(printf 't%.0s' {1..48})"
  run bash "$REPO_ROOT/scripts/audit-correlation/run.sh" --mode=live \
    --endpoint https://example.invalid/internal/audit-correlation/run \
    --token-env DUMMY_TOKEN \
    --dry-run
  [ "$status" -eq 0 ]
  [[ "$output" != *"hooks.slack.com"* ]]
  [[ "$output" != *"ghp_"* ]]
}
